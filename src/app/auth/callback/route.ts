import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { marcarActividad } from "@/lib/supabase/idle";

// Canjea el codigo del enlace de recuperacion (u otros correos de auth) por una
// sesion real antes de mandar al usuario a la pantalla que corresponda.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/erp";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await marcarActividad();
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("El enlace ya no es valido, pide uno nuevo")}`,
  );
}
