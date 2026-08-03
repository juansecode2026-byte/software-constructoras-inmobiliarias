import { supabase } from "@/lib/supabase/client";
import { marcarActividad } from "@/lib/supabase/idle";

// Las antiguas Server Actions redirigian desde el servidor. En SPA devuelven el
// resultado y es el componente quien navega con useNavigate().
export interface ResultadoAuth {
  error?: string;
  ok?: string;
}

export async function login(formData: FormData): Promise<ResultadoAuth> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  marcarActividad();
  return { ok: "Sesión iniciada." };
}

export async function solicitarReset(formData: FormData): Promise<ResultadoAuth> {
  const email = String(formData.get("email") ?? "");

  // En SPA el canje del codigo lo hace el propio cliente de Supabase
  // (detectSessionInUrl), por eso el enlace apunta directo a /login/reset.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login/reset`,
  });

  if (error) return { error: error.message };
  return { ok: "Te enviamos un correo con el enlace de recuperación." };
}

export async function actualizarPassword(formData: FormData): Promise<ResultadoAuth> {
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  marcarActividad();
  return { ok: "Contraseña actualizada." };
}
