import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullUrl = request.url;

  console.log(`Middleware processing: ${pathname} | Full URL: ${fullUrl}`);

  // Security: Prevent path traversal attacks (check original URL before normalization)
  if (fullUrl.includes('..') || fullUrl.includes('%2e%2e') || fullUrl.includes('%2E%2E') ||
      pathname.includes('..') || pathname.includes('%2e%2e') || pathname.includes('%2E%2E')) {
    console.warn(`Path traversal attempt blocked: ${fullUrl}`);
    return new NextResponse('Bad Request - Path Traversal Detected', { status: 400 });
  }

  // Security: Prevent double slashes that could cause routing issues
  if (pathname.includes('//')) {
    const cleanPath = pathname.replace(/\/+/g, '/');
    console.warn(`Double slash detected, redirecting: ${pathname} -> ${cleanPath}`);
    return NextResponse.redirect(new URL(cleanPath + search, request.url));
  }

  // Security: Prevent null bytes
  if (pathname.includes('\0') || search.includes('\0')) {
    console.warn(`Null byte attack blocked: ${pathname}${search}`);
    return new NextResponse('Bad Request - Null Byte Detected', { status: 400 });
  }

  // Security: Basic XSS protection for query parameters
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(search)) {
      console.warn(`Suspicious query parameter blocked: ${search}`);
      return new NextResponse('Bad Request - Suspicious Content Detected', { status: 400 });
    }
  }

  // Handle case-insensitive redirects for practice routes
  if (pathname.startsWith('/practice/')) {
    // Check for exam type case mismatch in the URL
    const examTypeMatch = pathname.match(/^\/practice\/([^\/]+)(\/.*)?$/);
    if (examTypeMatch) {
      const examType = examTypeMatch[1];
      const remainingPath = examTypeMatch[2] || '';
      const lowerExamType = examType.toLowerCase();

      // If the examType is not lowercase, redirect to lowercase version
      if (examType !== lowerExamType) {
        const newPath = `/practice/${lowerExamType}${remainingPath}`;
        console.log(`Redirecting case mismatch: ${pathname} -> ${newPath}`);
        return NextResponse.redirect(new URL(newPath + search, request.url));
      }
    }
  }

  // Add Ayansh user context to all API requests
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    response.headers.set('x-user-id', 'ayansh')
    response.headers.set('x-user-role', 'student')
    response.headers.set('x-user-name', 'Ayansh')
    console.log(`API request with user context: ${pathname}`)
    return response
  }

  // Continue with the request
  console.log(`Request allowed: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};