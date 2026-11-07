import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD || 'starfashion2026';

    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'star_admin_session',
      value: 'authenticated_token_active',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'strict',
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
