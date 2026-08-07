// Cliente HTTP hacia el backend (Edge Functions).
//
// Reemplaza las consultas directas a las tablas: desde aca el frontend solo
// conoce nombres de endpoints ("perfil", "presupuesto/obras"), nunca nombres de
// tablas ni columnas.
//
// La sesion la sigue manejando Supabase Auth en el navegador — eso no cambia,
// porque Auth es un servicio de identidad, no acceso a datos. Lo que se manda
// al backend es el token que Auth entrega.

import { supabase } from "@/lib/supabase/client";

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export class ErrorApi extends Error {
  constructor(mensaje: string, readonly status: number) {
    super(mensaje);
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new ErrorApi("Sesión no válida. Vuelve a iniciar sesión.", 401);

  const respuesta = await fetch(`${BASE}/${ruta}`, {
    ...opciones,
    headers: {
      ...opciones.headers,
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      ...(opciones.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (respuesta.status === 204) return null as T;

  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ErrorApi(cuerpo?.error ?? `Error ${respuesta.status}`, respuesta.status);
  }

  return cuerpo as T;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>(ruta),
  put: <T>(ruta: string, cuerpo?: unknown) =>
    pedir<T>(ruta, { method: "PUT", body: cuerpo ? JSON.stringify(cuerpo) : undefined }),
  post: <T>(ruta: string, cuerpo?: unknown) =>
    pedir<T>(ruta, { method: "POST", body: cuerpo ? JSON.stringify(cuerpo) : undefined }),
  borrar: <T>(ruta: string) => pedir<T>(ruta, { method: "DELETE" }),
};
