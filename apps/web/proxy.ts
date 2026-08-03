import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicSupabaseConfig } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  try {
    const { publishableKey, url } = getPublicSupabaseConfig();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet)
            request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, options, value } of cookiesToSet)
            response.cookies.set(name, value, options);
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) return signInRedirect(request);
    return response;
  } catch {
    return signInRedirect(request);
  }
}

function signInRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = '/sign-in';
  url.search = '';
  url.searchParams.set('next', requestedPath);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/platform/:path*'],
};
