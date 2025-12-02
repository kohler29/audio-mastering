import { NextRequest, NextResponse } from 'next/server';
import { generateSignedCSRFToken } from '@/lib/csrf';

/**
 * GET /api/csrf-token
 * Generate and return a CSRF token
 */
export async function GET(request: NextRequest) {
  try {
    const token = generateSignedCSRFToken();

    const response = NextResponse.json({ token }, { status: 200 });

    // Set CSRF token in cookie (for Double Submit Cookie pattern)
    response.cookies.set('csrf-token', token, {
      httpOnly: false, // Must be accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat generate CSRF token' },
      { status: 500 }
    );
  }
}

