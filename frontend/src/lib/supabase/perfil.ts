// Perfil del usuario: lo que se imprime en documentos aprobados (nombre, cargo,
// firma). auth.users solo guarda email y clave.

import { createClient } from "./client";

export interface UsuarioPerfil {
  id: string;
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  firma_digital_url: string | null;
  notas: string | null;
}

export async function obtenerPerfil(): Promise<UsuarioPerfil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("usuario_perfil")
    .select("id, nombre, cargo, telefono, firma_digital_url, notas")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
