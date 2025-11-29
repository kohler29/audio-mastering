import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/presets/[id]
 * Get a specific preset by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const preset = await prisma.preset.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah user memiliki akses (own preset atau published)
    if (preset.userId !== payload.userId && !preset.isPublic) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses ke preset ini' },
        { status: 403 }
      );
    }

    return NextResponse.json({ preset }, { status: 200 });
  } catch (error) {
    console.error('Get preset error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/presets/[id]
 * Update a preset
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const preset = await prisma.preset.findUnique({
      where: { id },
    });

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hanya owner yang bisa update
    if (preset.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin untuk mengupdate preset ini' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, settings, isPublic } = body;

    // Cek apakah nama sudah digunakan oleh preset lain milik user ini
    if (name && name.trim() !== preset.name) {
      const existingPreset = await prisma.preset.findFirst({
        where: {
          userId: payload.userId,
          name: name.trim(),
          id: { not: id },
        },
      });

      if (existingPreset) {
        return NextResponse.json(
          { error: `Preset dengan nama "${name}" sudah ada` },
          { status: 400 }
        );
      }
    }

    // Update preset
    const updated = await prisma.preset.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(settings && { settings }),
        ...(typeof isPublic === 'boolean' && { isPublic }),
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

    return NextResponse.json({ preset: updated }, { status: 200 });
  } catch (error) {
    console.error('Update preset error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate preset' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/presets/[id]
 * Delete a preset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const preset = await prisma.preset.findUnique({
      where: { id },
    });

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hanya owner yang bisa delete
    if (preset.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin untuk menghapus preset ini' },
        { status: 403 }
      );
    }

    await prisma.preset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete preset error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus preset' },
      { status: 500 }
    );
  }
}

