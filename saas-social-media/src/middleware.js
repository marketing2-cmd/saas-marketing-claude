import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/signup"];
const PENDING_PAGE = "/aguardando";

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

  // Cadastro precisa ser aprovado por um administrador da plataforma
  const { data: profile } = await supabase
    .from("platform_profiles")
    .select("status, is_admin")
    .eq("id", user.sub)
    .maybeSingle();
  const approved = profile?.status === "approved" || profile?.is_admin;

  if (!approved) {
    if (pathname === PENDING_PAGE) return response;
    return redirectTo(request, PENDING_PAGE);
  }
  if (pathname.startsWith("/admin") && !profile?.is_admin) return redirectTo(request, "/");

  const { count } = await supabase
    .from("workspace_members")
    .select("workspace_id", { count: "exact", head: true })
    .eq("user_id", user.sub);
  const hasWorkspace = (count || 0) > 0;

  if (AUTH_PAGES.includes(pathname) || pathname === PENDING_PAGE) return redirectTo(request, hasWorkspace ? "/" : "/onboarding");
  if (!hasWorkspace && pathname !== "/onboarding") return redirectTo(request, "/onboarding");
  if (hasWorkspace && pathname === "/onboarding") return redirectTo(request, "/");

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
