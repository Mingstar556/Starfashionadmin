import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path !== '/login' && !path.startsWith('/api') && !path.startsWith('/_next')) {
    const sessionCookie = req.cookies.get('star_admin_session');
    if (!sessionCookie || sessionCookie.value !== 'authenticated_token_active') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
