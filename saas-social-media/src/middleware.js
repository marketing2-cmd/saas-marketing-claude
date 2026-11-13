import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/signup"];

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

  const { count } = await supabase
    .from("workspace_members")
    .select("workspace_id", { count: "exact", head: true })
    .eq("user_id", user.sub);
  const hasWorkspace = (count || 0) > 0;

  if (AUTH_PAGES.includes(pathname)) return redirectTo(request, hasWorkspace ? "/" : "/onboarding");
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
// /privacidade e arquivos estáticos.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|c/|privacidade|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
