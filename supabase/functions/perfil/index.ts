// Perfil del usuario: nombre, cargo y firma que se imprimen en los documentos
// aprobados. Primer modulo migrado del navegador al backend.
//
//   GET    /perfil        -> el perfil del que llama
//   PUT    /perfil        -> nombre, cargo, telefono, notas
//   PUT    /perfil/firma  -> guarda la ruta de la firma subida
//   DELETE /perfil/firma  -> la quita
//
// Autorizacion: no hay permiso por modulo que revisar. Cada quien opera sobre
// SU perfil y nada mas, asi que la regla es filtrar por authUserId. Ojo: db()
// usa service_role e ignora RLS, de modo que ese filtro es la unica barrera.

import { db } from "../_shared/db.ts";
import { identificar, NoAutenticado, type Identidad } from "../_shared/auth.ts";
import { error, json, manejar } from "../_shared/http.ts";

const COLUMNAS = "id, nombre, cargo, telefono, firma_digital_url, notas";

// AUTORIZACION: filtra por auth_user_id (dueño de la fila), no hace falta exigirPermiso
async function obtener(identidad: Identidad, origen: string | null): Promise<Response> {
  const { data, error: err } = await db()
    .from("usuario_perfil")
    .select(COLUMNAS)
    .eq("auth_user_id", identidad.authUserId)
    .maybeSingle();

  if (err) return error(`No se pudo leer el perfil: ${err.message}`, origen, 500);
  return json(data, origen);
}

// AUTORIZACION: filtra por auth_user_id (dueño de la fila)
async function guardar(
  identidad: Identidad,
  req: Request,
  origen: string | null,
): Promise<Response> {
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo) return error("Cuerpo invalido", origen);

  const nombre = String(cuerpo.nombre ?? "").trim();
  if (!nombre) {
    return error("El nombre es obligatorio: aparece en los documentos firmados.", origen);
  }

  const limpiar = (v: unknown) => String(v ?? "").trim() || null;

  const { error: err } = await db()
    .from("usuario_perfil")
    .update({
      nombre,
      cargo: limpiar(cuerpo.cargo),
      telefono: limpiar(cuerpo.telefono),
      notas: limpiar(cuerpo.notas),
    })
    .eq("auth_user_id", identidad.authUserId);

  if (err) return error(`No se pudo guardar: ${err.message}`, origen, 500);
  return json({ ok: "Perfil guardado." }, origen);
}

// El archivo lo sube el navegador directo al bucket (que tiene sus propias
// politicas); aca solo se registra la ruta resultante. Asi no hay que pasar
// 5 MB por la funcion.
// AUTORIZACION: filtra por auth_user_id (dueño de la fila)
async function guardarFirma(
  identidad: Identidad,
  req: Request,
  origen: string | null,
): Promise<Response> {
  const cuerpo = await req.json().catch(() => null);
  const ruta = String(cuerpo?.ruta ?? "").trim();
  if (!ruta) return error("Falta la ruta del archivo", origen);

  // Solo rutas del propio ERP: evita que se registre cualquier string.
  if (!ruta.startsWith("usuario/")) return error("Ruta no permitida", origen);

  const anterior = await rutaFirmaActual(identidad);

  const { error: err } = await db()
    .from("usuario_perfil")
    .update({ firma_digital_url: ruta })
    .eq("auth_user_id", identidad.authUserId);

  if (err) return error(`No se pudo guardar la firma: ${err.message}`, origen, 500);
  return json({ ok: "Firma actualizada.", anterior }, origen);
}

// AUTORIZACION: filtra por auth_user_id (dueño de la fila)
async function quitarFirma(identidad: Identidad, origen: string | null): Promise<Response> {
  const anterior = await rutaFirmaActual(identidad);

  const { error: err } = await db()
    .from("usuario_perfil")
    .update({ firma_digital_url: null })
    .eq("auth_user_id", identidad.authUserId);

  if (err) return error(`No se pudo quitar la firma: ${err.message}`, origen, 500);
  return json({ ok: "Firma quitada.", anterior }, origen);
}

// Se devuelve al frontend para que borre el archivo viejo despues de que la
// base ya apunta al nuevo: si se borrara antes y fallara el update, la firma
// se perderia sin reemplazo.
// AUTORIZACION: helper interno, filtra por auth_user_id (dueño de la fila)
async function rutaFirmaActual(identidad: Identidad): Promise<string | null> {
  const { data } = await db()
    .from("usuario_perfil")
    .select("firma_digital_url")
    .eq("auth_user_id", identidad.authUserId)
    .maybeSingle();
  return data?.firma_digital_url ?? null;
}

Deno.serve((req) =>
  manejar(req, async (req, origen) => {
    let identidad: Identidad;
    try {
      identidad = await identificar(req);
    } catch (e) {
      if (e instanceof NoAutenticado) return error(e.message, origen, 401);
      throw e;
    }

    const ruta = new URL(req.url).pathname.replace(/^\/perfil/, "") || "/";

    if (ruta === "/" && req.method === "GET") return obtener(identidad, origen);
    if (ruta === "/" && req.method === "PUT") return guardar(identidad, req, origen);
    if (ruta === "/firma" && req.method === "PUT") return guardarFirma(identidad, req, origen);
    if (ruta === "/firma" && req.method === "DELETE") return quitarFirma(identidad, origen);

    return error("Ruta no encontrada", origen, 404);
  })
);
