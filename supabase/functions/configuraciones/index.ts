// Configuraciones basicas: empresa, parametros por modulo, personas (terceros),
// formas de pago y catalogo de recursos.
//
//   GET /configuraciones/empresa
//   PUT /configuraciones/empresa
//   PUT    /configuraciones/empresa/logo   { ruta }
//   DELETE /configuraciones/empresa/logo
//   PUT    /configuraciones/empresa/firma  { ruta }
//   DELETE /configuraciones/empresa/firma
//   GET /configuraciones/parametros
//   GET /configuraciones/personas
//   GET /configuraciones/personas/:id
//   GET /configuraciones/formas-pago
//   GET /configuraciones/recursos            -> { clases, recursos }
//
// Antes cada pantalla pedia el empresaId al backend y se lo devolvia en cada
// consulta. Aca ya no hace falta: identidad.empresaId lo resuelve auth.ts una
// sola vez a partir del token, y todas las consultas filtran con ese valor.

import { db } from "../_shared/db.ts";
import { exigirPermiso, identificar, NoAutenticado, SinPermiso, type Identidad } from "../_shared/auth.ts";
import { error, json, manejar } from "../_shared/http.ts";

function sinEmpresa(origen: string | null): Response {
  return error("El usuario no tiene una empresa asociada.", origen, 409);
}

// ---------- empresa ----------

async function obtenerEmpresa(identidad: Identidad, origen: string | null): Promise<Response> {
  if (!identidad.empresaId) return sinEmpresa(origen);
  await exigirPermiso(identidad, "empresa", "ver");

  const { data, error: err } = await db()
    .from("empresas")
    .select("*")
    .eq("id", identidad.empresaId)
    .single();

  if (err) return error(`No se pudo leer la empresa: ${err.message}`, origen, 500);
  return json(data, origen);
}

const CAMPOS_TEXTO_EMPRESA = [
  "nombre_comercial", "nombre_legal", "identificador", "giro", "direccion",
  "comuna", "provincia", "region", "telefono", "email", "web",
  "representante_legal_nombre", "representante_legal_identificador",
  "pie_de_firma", "textos_bienvenida",
] as const;

async function guardarEmpresa(
  identidad: Identidad,
  req: Request,
  origen: string | null,
): Promise<Response> {
  if (!identidad.empresaId) return sinEmpresa(origen);
  await exigirPermiso(identidad, "empresa", "editar");

  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo) return error("Cuerpo invalido", origen);

  const nombre = String(cuerpo.nombre_comercial ?? "").trim();
  if (!nombre) {
    return error("El nombre comercial es obligatorio: identifica a la empresa en todo el sistema.", origen);
  }

  const cambios: Record<string, string | null> = { nombre };
  for (const campo of CAMPOS_TEXTO_EMPRESA) {
    cambios[campo] = String(cuerpo[campo] ?? "").trim() || null;
  }

  const { error: err } = await db().from("empresas").update(cambios).eq("id", identidad.empresaId);
  if (err) return error(`No se pudo guardar: ${err.message}`, origen, 500);
  return json({ ok: "Datos de la empresa guardados." }, origen);
}

async function actualizarImagenEmpresa(
  identidad: Identidad,
  campo: "logo_url" | "firma_digital_url",
  ruta: string | null,
  origen: string | null,
): Promise<Response> {
  if (!identidad.empresaId) return sinEmpresa(origen);
  await exigirPermiso(identidad, "empresa", "editar");

  if (ruta && !ruta.startsWith("empresa/")) return error("Ruta no permitida", origen);

  const { data: actual } = await db()
    .from("empresas")
    .select(campo)
    .eq("id", identidad.empresaId)
    .maybeSingle();
  const anterior = (actual as Record<string, string | null> | null)?.[campo] ?? null;

  const { error: err } = await db()
    .from("empresas")
    .update({ [campo]: ruta })
    .eq("id", identidad.empresaId);

  if (err) return error(`No se pudo guardar: ${err.message}`, origen, 500);
  return json({ ok: "Imagen actualizada.", anterior }, origen);
}

// ---------- parametros por modulo ----------

async function listarConfiguraciones(identidad: Identidad, origen: string | null): Promise<Response> {
  if (!identidad.empresaId) return sinEmpresa(origen);
  await exigirPermiso(identidad, "configuraciones", "ver");

  const { data, error: err } = await db()
    .from("configuraciones")
    .select("id, modulo, clave, valor, descripcion")
    .eq("empresa_id", identidad.empresaId)
    .order("modulo")
    .order("clave");

  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  return json(data, origen);
}

// ---------- personas ----------

const COLUMNAS_PERSONA = `id, tipo_persona, identificador, nombre_legal, nombre_comercial,
   nombres, apellido_paterno, apellido_materno, giro,
   es_proveedor, es_empleado, es_cliente, es_contratista, es_transportista, vigente`;

async function listarPersonas(identidad: Identidad, origen: string | null): Promise<Response> {
  if (!identidad.empresaId) return sinEmpresa(origen);
  await exigirPermiso(identidad, "personas", "ver");

  const { data, error: err } = await db()
    .from("personas")
    .select(COLUMNAS_PERSONA)
    .eq("empresa_id", identidad.empresaId)
    .order("created_at");

  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  return json(data, origen);
}

async function obtenerPersonaDetalle(
  identidad: Identidad,
  personaId: string,
  origen: string | null,
): Promise<Response> {
  if (!identidad.empresaId) return sinEmpresa(origen);
  await exigirPermiso(identidad, "personas", "ver");

  const { data, error: err } = await db()
    .from("personas")
    .select(
      `id, tipo_persona, identificador, nombre_legal, nombre_comercial,
       nombres, apellido_paterno, apellido_materno, giro, descripcion,
       es_proveedor, es_empleado, es_cliente, es_contratista, es_transportista, vigente,
       opcion_pago, representante_legal_nombre, representante_legal_identificador,
       forma_pago:formas_pago ( nombre, dias_vence ),
       direcciones:persona_direcciones (
         id, tipo, nombre, direccion, region, provincia, comuna, email, telefono, telefono2,
         contactos:persona_contactos ( id, nombre, cargo, telefono, celular, email, vigente )
       ),
       datos_bancarios:persona_datos_bancarios (
         id, banco, tipo_cuenta, numero_cuenta, moneda
       ),
       archivos:persona_archivos ( id, nombre, tipo, url )`,
    )
    // empresa_id la tiene la persona, no hace falta el join: alcanza con
    // filtrar por ambas columnas para que nadie pida el id de otra empresa.
    .eq("id", personaId)
    .eq("empresa_id", identidad.empresaId)
    .maybeSingle();

  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  if (!data) return error("Persona no encontrada", origen, 404);
  return json(data, origen);
}

// ---------- formas de pago ----------

async function listarFormasPago(identidad: Identidad, origen: string | null): Promise<Response> {
  if (!identidad.empresaId) return sinEmpresa(origen);
  await exigirPermiso(identidad, "configuraciones", "ver");

  const { data, error: err } = await db()
    .from("formas_pago")
    .select("id, nombre, dias_vence, vigente")
    .eq("empresa_id", identidad.empresaId)
    .order("dias_vence");

  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  return json(data, origen);
}

// ---------- recursos y su arbol de clases ----------

async function listarRecursos(identidad: Identidad, origen: string | null): Promise<Response> {
  if (!identidad.empresaId) return sinEmpresa(origen);
  await exigirPermiso(identidad, "recursos", "ver");

  const [clases, recursos] = await Promise.all([
    db()
      .from("recurso_clases")
      .select(
        `id, parent_id, codigo, nombre, imputable,
         cuenta_inventario:cuentas_contables!recurso_clases_cuenta_inventario_id_fkey ( codigo, nombre ),
         cuenta_venta:cuentas_contables!recurso_clases_cuenta_venta_id_fkey ( codigo, nombre ),
         cuenta_costo_venta:cuentas_contables!recurso_clases_cuenta_costo_venta_id_fkey ( codigo, nombre )`,
      )
      .eq("empresa_id", identidad.empresaId)
      .order("codigo"),
    db()
      .from("recursos")
      .select(
        `id, codigo, nombre, tipo_costo, unidad_compra, con_stock, vigente,
         clase:recurso_clases ( id, nombre ),
         unidades_embalaje:recurso_unidades_embalaje ( id, unidad, factor, precio )`,
      )
      .eq("empresa_id", identidad.empresaId)
      .order("codigo"),
  ]);

  if (clases.error) return error(`No se pudo leer: ${clases.error.message}`, origen, 500);
  if (recursos.error) return error(`No se pudo leer: ${recursos.error.message}`, origen, 500);

  return json({ clases: clases.data, recursos: recursos.data }, origen);
}

// ---------- ruteo ----------

Deno.serve((req) =>
  manejar(req, async (req, origen) => {
    let identidad: Identidad;
    try {
      identidad = await identificar(req);
    } catch (e) {
      if (e instanceof NoAutenticado) return error(e.message, origen, 401);
      throw e;
    }

    const partes = new URL(req.url).pathname
      .replace(/^\/configuraciones/, "")
      .split("/")
      .filter(Boolean);

    try {
      if (partes[0] === "empresa" && partes.length === 1) {
        if (req.method === "GET") return await obtenerEmpresa(identidad, origen);
        if (req.method === "PUT") return await guardarEmpresa(identidad, req, origen);
      }

      if (partes[0] === "empresa" && (partes[1] === "logo" || partes[1] === "firma")) {
        const campo = partes[1] === "logo" ? "logo_url" : "firma_digital_url";
        if (req.method === "PUT") {
          const cuerpo = await req.json().catch(() => null);
          const ruta = String(cuerpo?.ruta ?? "").trim();
          if (!ruta) return error("Falta la ruta del archivo", origen);
          return await actualizarImagenEmpresa(identidad, campo, ruta, origen);
        }
        if (req.method === "DELETE") return await actualizarImagenEmpresa(identidad, campo, null, origen);
      }

      if (partes[0] === "parametros" && req.method === "GET") {
        return await listarConfiguraciones(identidad, origen);
      }

      if (partes[0] === "personas" && partes.length === 1 && req.method === "GET") {
        return await listarPersonas(identidad, origen);
      }

      if (partes[0] === "personas" && partes.length === 2 && req.method === "GET") {
        return await obtenerPersonaDetalle(identidad, partes[1], origen);
      }

      if (partes[0] === "formas-pago" && req.method === "GET") {
        return await listarFormasPago(identidad, origen);
      }

      if (partes[0] === "recursos" && req.method === "GET") {
        return await listarRecursos(identidad, origen);
      }
    } catch (e) {
      if (e instanceof SinPermiso) return error(e.message, origen, 403);
      throw e;
    }

    return error("Ruta no encontrada", origen, 404);
  })
);
