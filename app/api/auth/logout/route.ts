import { NextRequest, NextResponse } from 'next/server';
import { verifyCSRFToken } from '@/lib/csrf';

/**
 * Menghapus cookie autentikasi dan melakukan logout user.
 * Metode: POST
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify CSRF token signature (Node.js runtime)
  const csrfToken = request.headers.get('x-csrf-token');
  if (csrfToken && !verifyCSRFToken(csrfToken)) {
    return NextResponse.json(
      { error: 'CSRF token tidak valid' },
      { status: 403 }
    );
  }
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
