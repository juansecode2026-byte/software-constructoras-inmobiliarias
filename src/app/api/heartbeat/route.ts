import { NextResponse } from "next/server";
import { marcarActividad } from "@/lib/supabase/idle";

// El cliente llama esto mientras hay actividad real del usuario (mouse,
// teclado, scroll) para mantener viva la cookie de inactividad, aunque el
// usuario se quede en una sola pantalla sin navegar.
export async function POST() {
  await marcarActividad();
  return NextResponse.json({ ok: true });
}
