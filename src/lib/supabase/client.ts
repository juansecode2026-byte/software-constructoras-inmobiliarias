import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SPA: una sola instancia para toda la app. La sesion vive en localStorage y se
// refresca sola; detectSessionInUrl canjea el codigo de los correos de
// recuperacion, que antes canjeaba la route handler /auth/callback en el servidor.
export const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  },
);

// Se conserva el nombre para no reescribir la capa de datos, que hacia
// `const supabase = await createClient()`.
export function createClient() {
  return supabase;
}
