import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  sanitizeString,
} from '@/lib/validation';
import { verifyCSRFToken } from '@/lib/csrf';

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

    const body = await request.json();
    const { email, username, password } = body;

    // Validasi input dasar
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username, dan password harus diisi' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 254);
    const sanitizedUsername = sanitizeString(username, 30);

    // Validasi email format
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Validasi username format
    if (!isValidUsername(sanitizedUsername)) {
      return NextResponse.json(
        { error: 'Username harus 3-30 karakter, hanya huruf, angka, dan underscore' },
        { status: 400 }
      );
    }

    // Validasi password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email atau username sudah terdaftar' },
        { status: 400 }
      );
    }

    // Cek apakah username sudah terdaftar
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: sanitizedUsername },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Email atau username sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        username: sanitizedUsername,
        password: hashedPassword,
        provider: 'email',
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Set cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mendaftar' },
      { status: 500 }
    );
  }
}

