// Identidad y permisos del que llama.
//
// Supabase ya valida la firma del JWT antes de invocar la funcion (verify_jwt),
// asi que aca no se vuelve a verificar la firma: se resuelve QUIEN es y QUE
// puede hacer, apoyandose en las funciones que dejo la migracion 0015
// (usuario_puede, usuario_accede_obra) para no reimplementar la regla.

import { createClient } from "npm:@supabase/supabase-js@2";
import { db } from "./db.ts";

export interface Identidad {
  authUserId: string;
  perfilId: string | null;
  empresaId: string | null;
}

export class NoAutenticado extends Error {}
export class SinPermiso extends Error {}

// Resuelve el usuario a partir del token que vino en Authorization.
export async function identificar(req: Request): Promise<Identidad> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) throw new NoAutenticado("Falta el token");

  const token = header.slice(7);

  // Cliente efimero con el token del usuario, solo para resolver quien es.
  const comoUsuario = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );

  const { data: { user }, error } = await comoUsuario.auth.getUser();
  if (error || !user) throw new NoAutenticado("Sesion no valida");

  // El perfil y la empresa salen de usuario_perfil, ya con service_role.
  const { data: perfil } = await db()
    .from("usuario_perfil")
    .select("perfil_id, empresa_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return {
    authUserId: user.id,
    perfilId: perfil?.perfil_id ?? null,
    empresaId: perfil?.empresa_id ?? null,
  };
}

// Permiso por modulo/accion. Lanza SinPermiso en vez de devolver false para que
// sea imposible olvidarse de revisar el resultado.
export async function exigirPermiso(
  identidad: Identidad,
  modulo: string,
  accion: string,
): Promise<void> {
  const { data, error } = await db().rpc("usuario_puede", {
    p_auth_user_id: identidad.authUserId,
    p_modulo: modulo,
    p_accion: accion,
  });

  if (error) throw new Error(`No se pudo verificar el permiso: ${error.message}`);
  if (data !== true) throw new SinPermiso(`Sin permiso para ${modulo}.${accion}`);
}

// Acceso a los datos de una obra concreta.
export async function exigirAccesoObra(identidad: Identidad, obraId: string): Promise<void> {
  const { data, error } = await db().rpc("usuario_accede_obra", {
    p_auth_user_id: identidad.authUserId,
    p_obra_id: obraId,
  });

  if (error) throw new Error(`No se pudo verificar el acceso a la obra: ${error.message}`);
  if (data !== true) throw new SinPermiso("Sin acceso a esta obra");
}
