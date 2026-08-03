import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicSupabaseConfig } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const requestHeaders = new Headers(request.headers);
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);

  if (!isProtectedRoute(request.nextUrl.pathname)) return response;

  try {
    const { publishableKey, url } = getPublicSupabaseConfig();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet)
            request.cookies.set(name, value);
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          for (const { name, options, value } of cookiesToSet)
            response.cookies.set(name, value, options);
          response.headers.set(
            'Content-Security-Policy',
            contentSecurityPolicy,
          );
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub)
      return signInRedirect(request, contentSecurityPolicy);
    return response;
  } catch {
    return signInRedirect(request, contentSecurityPolicy);
  }
}

function isProtectedRoute(pathname: string) {
  return ['/account', '/admin', '/platform'].some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

function buildContentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { url } = getPublicSupabaseConfig();
  const supabaseOrigin = new URL(url).origin;
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "media-src 'none'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `style-src 'self' ${isDevelopment ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ''}`,
    `connect-src 'self' ${supabaseOrigin}`,
    "worker-src 'self' blob:",
  ].join('; ');
}

function signInRedirect(request: NextRequest, contentSecurityPolicy: string) {
  const url = request.nextUrl.clone();
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = '/sign-in';
  url.search = '';
  url.searchParams.set('next', requestedPath);
  const response = NextResponse.redirect(url);
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
