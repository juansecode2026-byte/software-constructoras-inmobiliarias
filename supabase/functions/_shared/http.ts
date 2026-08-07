// Respuestas y CORS compartidos por todas las Edge Functions.
//
// El navegador pide desde otro origen (localhost:3000 en desarrollo, el dominio
// del sitio en produccion), asi que cada respuesta necesita cabeceras CORS y
// hay que contestar el preflight OPTIONS.
//
// El dominio de produccion NO se hardcodea aca: agregarlo (o cambiarlo) es
// una variable de entorno del proyecto de Supabase (Edge Functions -> Manage
// secrets -> ORIGENES_ADICIONALES, separados por coma si son varios), no un
// cambio de codigo. Asi el dia del deploy real no depende de que alguien se
// acuerde de tocar este archivo y volver a desplegar: solo hay que setear la
// variable, que se lee en cada request sin redeploy.
//
// CORS exige que el navegador vea reflejado EXACTAMENTE su propio origen — no
// alcanza con mandar "algun" valor. Por eso el fallback cuando el origen no
// esta en la lista es intencionalmente uno que el navegador va a rechazar.

const ORIGENES_DESARROLLO = ["http://localhost:3000", "http://127.0.0.1:3000"];

function origenesPermitidos(): string[] {
  const adicionales = (Deno.env.get("ORIGENES_ADICIONALES") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return [...ORIGENES_DESARROLLO, ...adicionales];
}

export function cabecerasCors(origen: string | null): Record<string, string> {
  const permitidos = origenesPermitidos();
  // Solo se refleja el origen si esta en la lista; si no, se manda un valor
  // que no va a coincidir con nada real, y el navegador bloquea la respuesta
  // (que es exactamente lo que se busca para un origen no autorizado).
  const permitido = origen && permitidos.includes(origen) ? origen : "null";

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
