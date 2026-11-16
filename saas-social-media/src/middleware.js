import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/signup"];

// Middleware enxuto: renova a sessão e separa logado / não logado.
// Aprovação e workspace são checados no servidor de cada área (layout do painel,
// /onboarding, /aguardando, /admin), para não pesar em todo clique.
export async function middleware(request) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims || null;

  if (!user) {
    if (AUTH_PAGES.includes(pathname)) return response;
    return redirectTo(request, "/login");
  }
  if (AUTH_PAGES.includes(pathname)) return redirectTo(request, "/");
  return response;
}

function redirectTo(request, pathname) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

// Fora do middleware: /api (cada rota se protege), /c/* (portal público do cliente),
// /demo, /privacidade e arquivos estáticos.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|c/|demo|privacidade|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
