import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sanitizeFolderName } from '@/lib/validation';
import { verifyCSRFToken } from '@/lib/csrf';

/**
 * PATCH /api/presets/folders
 * Rename folder (update semua preset di folder tersebut)
 */
export async function PATCH(request: NextRequest) {
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
    const { oldFolder, newFolder } = body;

    // Validasi input
    if (oldFolder === undefined || newFolder === undefined) {
      return NextResponse.json(
        { error: 'oldFolder dan newFolder harus diisi' },
        { status: 400 }
      );
    }

    // Sanitize folder names
    const sanitizedOldFolder = oldFolder ? sanitizeFolderName(oldFolder) : null;
    const sanitizedNewFolder = sanitizeFolderName(newFolder);

    // Validasi bahwa folder baru tidak kosong jika oldFolder tidak null
    if (sanitizedOldFolder !== null && (!sanitizedNewFolder || sanitizedNewFolder.length === 0)) {
      return NextResponse.json(
        { error: 'Nama folder baru tidak valid' },
        { status: 400 }
      );
    }

    // Cek apakah folder lama ada dan milik user ini
    const existingPresets = await prisma.preset.findMany({
      where: {
        userId: payload.userId,
        folder: sanitizedOldFolder,
      },
      select: {
        id: true,
      },
    });

    if (existingPresets.length === 0) {
      return NextResponse.json(
        { error: 'Folder tidak ditemukan atau tidak memiliki preset' },
        { status: 404 }
      );
    }

    // Cek apakah folder baru sudah ada
    const conflictingPresets = await prisma.preset.findFirst({
      where: {
        userId: payload.userId,
        folder: sanitizedNewFolder,
      },
    });

    if (conflictingPresets) {
      return NextResponse.json(
        { error: `Folder "${sanitizedNewFolder}" sudah ada` },
        { status: 400 }
      );
    }

    // Update semua preset di folder tersebut
    const result = await prisma.preset.updateMany({
      where: {
        userId: payload.userId,
        folder: sanitizedOldFolder,
      },
      data: {
        folder: sanitizedNewFolder,
      },
    });

    return NextResponse.json(
      {
        success: true,
        updatedCount: result.count,
        oldFolder: sanitizedOldFolder,
        newFolder: sanitizedNewFolder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Rename folder error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengubah nama folder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/presets/folders
 * Delete folder dengan opsi:
 * - Hapus semua preset di folder (action: 'delete')
 * - Pindahkan preset ke "No Folder" (action: 'move', default)
 */
export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder');
    const action = searchParams.get('action') || 'move'; // 'delete' atau 'move'

    if (!folder) {
      return NextResponse.json(
        { error: 'Parameter folder harus diisi' },
        { status: 400 }
      );
    }

    // Sanitize folder name
    const sanitizedFolder = sanitizeFolderName(folder);

    if (!sanitizedFolder) {
      return NextResponse.json(
        { error: 'Nama folder tidak valid' },
        { status: 400 }
      );
    }

    // Cek apakah folder ada dan milik user ini
    const existingPresets = await prisma.preset.findMany({
      where: {
        userId: payload.userId,
        folder: sanitizedFolder,
      },
      select: {
        id: true,
      },
    });

    if (existingPresets.length === 0) {
      return NextResponse.json(
        { error: 'Folder tidak ditemukan atau tidak memiliki preset' },
        { status: 404 }
      );
    }

    if (action === 'delete') {
      // Hapus semua preset di folder
      const result = await prisma.preset.deleteMany({
        where: {
          userId: payload.userId,
          folder: sanitizedFolder,
        },
      });

      return NextResponse.json(
        {
          success: true,
          deletedCount: result.count,
          action: 'delete',
        },
        { status: 200 }
      );
    } else {
      // Pindahkan preset ke "No Folder" (null)
      const result = await prisma.preset.updateMany({
        where: {
          userId: payload.userId,
          folder: sanitizedFolder,
        },
        data: {
          folder: null,
        },
      });

      return NextResponse.json(
        {
          success: true,
          movedCount: result.count,
          action: 'move',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus folder' },
      { status: 500 }
    );
  }
}

