import { NextResponse } from 'next/server';

/**
 * Menghapus cookie autentikasi dan melakukan logout user.
 * Metode: POST
 */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}
