import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sanitizePresetName, sanitizeFolderName, sanitizeGenreName } from '@/lib/validation';
import { verifyCSRFToken } from '@/lib/csrf';
import type { PresetWhereInput, PresetOrderByWithRelationInput } from '@/generated/models/Preset';
const PRESET_GENRE_ENABLED = process.env.PRESET_GENRE_ENABLED === 'true';

/**
 * GET /api/presets
 * Get all presets (user's own presets + published presets from others)
 * Supports pagination, search, filter, and sorting via query parameters
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const searchQuery = searchParams.get('q')?.trim() || '';
    const folderFilter = searchParams.get('folder') || null;
    const genreFilter = searchParams.get('genre') || null;
    const isPublicFilter = searchParams.get('isPublic');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const whereConditions: PresetWhereInput[] = [
      {
        OR: [
          { userId: payload.userId }, // User's own presets
          { isPublic: true }, // Published presets from others
        ],
      },
    ];

    // Add search filter
    if (searchQuery) {
      const searchOr: PresetWhereInput[] = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { folder: { contains: searchQuery, mode: 'insensitive' } },
      ];
      if (PRESET_GENRE_ENABLED) {
        searchOr.push({ genre: { contains: searchQuery, mode: 'insensitive' } });
      }
      whereConditions.push({ OR: searchOr });
    }

    // Add folder filter
    if (folderFilter) {
      whereConditions.push({ folder: folderFilter });
    }

    // Add genre filter
    if (genreFilter && PRESET_GENRE_ENABLED) {
      whereConditions.push({ genre: genreFilter });
    }

    // Add isPublic filter
    if (isPublicFilter !== null && isPublicFilter !== '') {
      whereConditions.push({ isPublic: isPublicFilter === 'true' });
    }

    const where: PresetWhereInput = {
      AND: whereConditions,
    };

    // Build orderBy
    let orderBy: PresetOrderByWithRelationInput;
    switch (sortBy) {
      case 'name':
        orderBy = { name: sortOrder === 'asc' ? 'asc' : 'desc' };
        break;
      case 'folder':
        orderBy = { folder: sortOrder === 'asc' ? 'asc' : 'desc' };
        break;
      case 'genre':
        orderBy = PRESET_GENRE_ENABLED
          ? { genre: sortOrder === 'asc' ? 'asc' : 'desc' }
          : { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
        break;
      case 'createdAt':
      default:
        orderBy = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
        break;
    }

    // Get total count for pagination
    const total = await prisma.preset.count({ where });

    // Get presets with pagination
    const presets = await prisma.preset.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        presets,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      { status: 200 }
    );
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
    const { name, settings, isPublic, folder, genre } = body;

    // Validasi input
    if (!name || !settings) {
      return NextResponse.json(
        { error: 'Nama dan settings harus diisi' },
        { status: 400 }
      );
    }

    // Validasi settings adalah object
    if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings harus berupa object' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedName = sanitizePresetName(name);
    const sanitizedFolder = sanitizeFolderName(folder);
    const sanitizedGenre = sanitizeGenreName(genre);

    if (!sanitizedName || sanitizedName.length === 0) {
      return NextResponse.json(
        { error: 'Nama preset tidak valid' },
        { status: 400 }
      );
    }

    // Cek apakah nama preset sudah ada untuk user ini di folder yang sama
    const existingPreset = await prisma.preset.findFirst({
      where: {
        userId: payload.userId,
        name: sanitizedName,
        folder: sanitizedFolder,
      },
    });

    if (existingPreset) {
      return NextResponse.json(
        { error: `Preset dengan nama "${sanitizedName}" sudah ada${sanitizedFolder ? ` di folder "${sanitizedFolder}"` : ''}` },
        { status: 400 }
      );
    }

    // Buat preset baru
    const preset = await prisma.preset.create({
      data: {
        name: sanitizedName,
        userId: payload.userId,
        settings: settings,
        isPublic: isPublic === true,
        folder: sanitizedFolder,
        genre: sanitizedGenre,
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
