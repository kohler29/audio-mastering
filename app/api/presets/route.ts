import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/presets
 * Get all presets (user's own presets + published presets from others)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get user's own presets + published presets from others
    const presets = await prisma.preset.findMany({
      where: {
        OR: [
          { userId: payload.userId }, // User's own presets
          { isPublic: true }, // Published presets from others
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: [
        { folder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ presets }, { status: 200 });
  } catch (error) {
    console.error('Get presets error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/presets
 * Create a new preset
 */
export async function POST(request: NextRequest) {
  try {
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
    const { name, settings, isPublic, folder } = body;

    // Validasi input
    if (!name || !settings) {
      return NextResponse.json(
        { error: 'Nama dan settings harus diisi' },
        { status: 400 }
      );
    }

    // Validasi settings adalah object
    if (typeof settings !== 'object' || settings === null) {
      return NextResponse.json(
        { error: 'Settings harus berupa object' },
        { status: 400 }
      );
    }

    // Cek apakah nama preset sudah ada untuk user ini di folder yang sama
    const existingPreset = await prisma.preset.findFirst({
      where: {
        userId: payload.userId,
        name: name.trim(),
        folder: folder?.trim() || null,
      },
    });

    if (existingPreset) {
      return NextResponse.json(
        { error: `Preset dengan nama "${name}" sudah ada${folder ? ` di folder "${folder}"` : ''}` },
        { status: 400 }
      );
    }

    // Buat preset baru
    const preset = await prisma.preset.create({
      data: {
        name: name.trim(),
        userId: payload.userId,
        settings: settings,
        isPublic: isPublic === true,
        folder: folder?.trim() || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    console.error('Create preset error:', error);
    
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message?: string };
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Preset dengan nama ini sudah ada' },
          { status: 400 }
        );
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat preset';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

