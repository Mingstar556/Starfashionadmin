import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'star_admin_session',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return NextResponse.redirect(new URL('/login', 'http://localhost:3000'));
}
