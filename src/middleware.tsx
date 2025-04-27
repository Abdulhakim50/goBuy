import { NextRequest, NextResponse } from 'next/server';

// Only block and redirect if user is clearly not authenticated based on cookie
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isAdminPath = pathname.startsWith('/admin');

    if (isAdminPath) {
        const token = request.cookies.get('authjs.session-token'); // Example for NextAuth
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// --- Configure Middleware Matching ---
// See "Matching Paths" below to learn more
export const config = {
    // Matcher specifies which routes the middleware should run on.
    // Using a negative lookahead for /api, /_next/static, /_next/image, favicon.ico
    // And explicitly matching /admin/*
     matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)', '/admin/:path*'],
    // It's often simpler to just match the paths you want to protect:
    // matcher: ['/admin/:path*'], // Run ONLY on admin paths
};