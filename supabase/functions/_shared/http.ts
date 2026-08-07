// Respuestas y CORS compartidos por todas las Edge Functions.
//
// El navegador pide desde otro origen (localhost:3000 en desarrollo, el dominio
// del sitio en produccion), asi que cada respuesta necesita cabeceras CORS y
// hay que contestar el preflight OPTIONS.

const ORIGENES_PERMITIDOS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export function cabecerasCors(origen: string | null): Record<string, string> {
  // Solo se refleja el origen si esta en la lista; si no, se manda el primero
  // (el navegador bloqueara la respuesta, que es lo que se busca).
  const permitido = origen && ORIGENES_PERMITIDOS.includes(origen)
    ? origen
    : Deno.env.get("SITIO_URL") ?? ORIGENES_PERMITIDOS[0];

  return {
    "Access-Control-Allow-Origin": permitido,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(datos: unknown, origen: string | null, status = 200): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { ...cabecerasCors(origen), "Content-Type": "application/json" },
  });
}

export function error(mensaje: string, origen: string | null, status = 400): Response {
  return json({ error: mensaje }, origen, status);
}

export function preflight(origen: string | null): Response {
  return new Response(null, { status: 204, headers: cabecerasCors(origen) });
}

// Envuelve el handler para que una excepcion no devuelva el stack al cliente.
// El detalle queda en los logs de la funcion (supabase functions logs <nombre>).
export async function manejar(
  req: Request,
  handler: (req: Request, origen: string | null) => Promise<Response>,
): Promise<Response> {
  const origen = req.headers.get("Origin");

  if (req.method === "OPTIONS") return preflight(origen);

  try {
    return await handler(req, origen);
  } catch (e) {
    console.error("Error no controlado:", e);
    return error("Error interno", origen, 500);
  }
}
