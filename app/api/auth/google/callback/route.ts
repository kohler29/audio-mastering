import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { generateSafeUsername, isValidEmail, sanitizeString } from '@/lib/validation';

/**
 * Handle Google OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${encodeURIComponent('Google OAuth gagal')}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${encodeURIComponent('Kode OAuth tidak ditemukan')}`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${encodeURIComponent('Google OAuth tidak dikonfigurasi')}`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${encodeURIComponent('Gagal mendapatkan token')}`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${encodeURIComponent('Gagal mendapatkan informasi user')}`
      );
    }

    const userInfo = await userInfoResponse.json();
    const { id: googleId, email, name } = userInfo;

    if (!email || !isValidEmail(email)) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${encodeURIComponent('Email tidak ditemukan dari Google')}`
      );
    }

    // Sanitize email
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 254);

    // Generate safe username from email or name
    const username = generateSafeUsername(name || email);

    // Cari user berdasarkan googleId atau email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedEmail },
        ],
      },
    });

    if (user) {
      // Update user jika belum ada googleId
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleId,
            provider: 'google',
            // Update username jika belum ada atau dari email
            username: user.username || username,
          },
        });
      } else if (user.googleId !== googleId) {
        // Update googleId jika berbeda
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleId,
            provider: 'google',
          },
        });
      }
    } else {
      // Buat user baru
      // Cek apakah username sudah ada, jika ya tambahkan angka
      let finalUsername = username;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${username}_${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          email: sanitizedEmail,
          username: finalUsername,
          googleId: googleId,
          provider: 'google',
        },
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Set cookie dan redirect
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`
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
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${encodeURIComponent('Terjadi kesalahan saat login dengan Google')}`
    );
  }
}

