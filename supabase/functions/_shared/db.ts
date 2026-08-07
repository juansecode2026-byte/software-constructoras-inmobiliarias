// Cliente de base de datos con service_role: ignora RLS.
//
// Esto es deliberado y es el modelo del plan de separacion: la autorizacion
// deja de expresarse como politicas RLS y pasa a ser codigo explicito en cada
// funcion. La contrapartida es que ninguna consulta puede confiar en que la
// base la va a filtrar — SIEMPRE hay que filtrar a mano por el usuario o la
// obra que corresponda.
//
// La clave la inyecta Supabase en el entorno de la funcion. Nunca sale de aca:
// si aparece en frontend/ es un error grave.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

let cliente: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cliente) return cliente;

  const url = Deno.env.get("SUPABASE_URL");
  const clave = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !clave) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno");
  }

  cliente = createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}
