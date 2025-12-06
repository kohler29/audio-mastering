import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { verifyCSRFToken } from '@/lib/csrf';

/**
 * POST /api/presets/bulk
 * Bulk delete presets
 */
export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token signature (Node.js runtime)
    const csrfToken = request.headers.get('x-csrf-token');
    if (csrfToken && !verifyCSRFToken(csrfToken)) {
      return NextResponse.json(
        { error: 'CSRF token tidak valid' },
        { status: 403 }
      );
    }

    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { presetIds } = body;

    // Validasi input
    if (!Array.isArray(presetIds) || presetIds.length === 0) {
      return NextResponse.json(
        { error: 'Preset IDs harus berupa array yang tidak kosong' },
        { status: 400 }
      );
    }

    // Validasi bahwa semua preset milik user ini
    const presets = await prisma.preset.findMany({
      where: {
        id: { in: presetIds },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    // Cek apakah semua preset ditemukan
    if (presets.length !== presetIds.length) {
      return NextResponse.json(
        { error: 'Beberapa preset tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah semua preset milik user ini
    const unauthorizedPresets = presets.filter(p => p.userId !== payload.userId);
    if (unauthorizedPresets.length > 0) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin untuk menghapus beberapa preset' },
        { status: 403 }
      );
    }

    // Hapus semua preset
    const result = await prisma.preset.deleteMany({
      where: {
        id: { in: presetIds },
        userId: payload.userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        deletedCount: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk delete presets error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus preset' },
      { status: 500 }
    );
  }
}


