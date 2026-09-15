import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];

// Página do sorteio: qualquer cliente acessa sem login (não é parte do
// Marketing OS em si, é o formulário público de inscrição), então fica de
// fora do gate de autenticação inteiro — nada de redirecionar para /login
// nem para /pending.
const OPEN_PATHS = ["/sorteio"];

// Roda em toda navegação de página (não em /api — cada rota de API faz sua
// própria checagem via src/lib/supabase/authGuard.js, que responde com JSON
// em vez de redirecionar para uma página HTML).
export async function middleware(request) {
  if (OPEN_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

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

  // getClaims() valida a assinatura do JWT a cada chamada — nunca usar getSession()
  // aqui, que não revalida o token contra o servidor de auth.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims || null;
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!user) {
    if (isPublicPath) return response;
    return redirectTo(request, "/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, role")
    .eq("id", user.sub)
    .maybeSingle();

  const isApproved = profile?.status === "approved";
  const isAdmin = profile?.role === "admin";

  if (isPublicPath) {
    return redirectTo(request, isApproved || isAdmin ? "/" : "/pending");
  }

  if (pathname === "/pending") {
    if (isApproved || isAdmin) return redirectTo(request, "/");
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (!isAdmin) return redirectTo(request, isApproved ? "/" : "/pending");
    return response;
  }

  if (!isApproved && !isAdmin) {
    return redirectTo(request, "/pending");
  }

  return response;
}

function redirectTo(request, pathname) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
