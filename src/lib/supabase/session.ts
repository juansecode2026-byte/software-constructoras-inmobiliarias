import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ACTIVITY_COOKIE_NAME, IDLE_TIMEOUT_SECONDS } from "./idle";

// Refresca la sesion de Supabase en cada request y protege /erp: sin sesion,
// redirige a /login; con sesion, /login redirige a /erp. Ademas cierra la
// sesion automaticamente si pasaron 10 minutos sin actividad (la cookie de
// actividad se vence sola, aunque el equipo se haya apagado sin cerrar sesion).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (user) {
    const huboActividadReciente = request.cookies.has(ACTIVITY_COOKIE_NAME);

    if (!huboActividadReciente) {
      await supabase.auth.signOut();

      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Tu sesión se cerró por 10 minutos de inactividad");
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }

    supabaseResponse.cookies.set(ACTIVITY_COOKIE_NAME, String(Date.now()), {
      maxAge: IDLE_TIMEOUT_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  if (!user && pathname.startsWith("/erp")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/erp";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
