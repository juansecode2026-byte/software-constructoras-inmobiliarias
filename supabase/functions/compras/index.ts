// Flujo de Compras: Solicitud de Recursos -> Solicitud de Cotizacion -> Orden
// de Compra. El Cuadro Comparativo se calcula aca a partir de
// solicitud_cotizacion_precios; no vive en una tabla propia.
//
//   GET /compras/solicitudes-recursos?obraId=xxx
//   GET /compras/solicitudes-recursos/:id
//   GET /compras/solicitudes-cotizacion?obraId=xxx
//   GET /compras/solicitudes-cotizacion/:id
//   GET /compras/ordenes?obraId=xxx
//   GET /compras/ordenes/:id
//
// Primer modulo donde el acceso se filtra por OBRA, no solo por permiso de
// modulo: con una empresa y varios proyectos (Miramar, Los Aromos, Vista
// Norte), "compras.ver" dice que el cargo puede ver compras en general,
// exigirAccesoObra() dice si puede verlas de ESTA obra puntual.

import { db } from "../_shared/db.ts";
import { exigirAccesoObra, exigirPermiso, identificar, NoAutenticado, SinPermiso, type Identidad } from "../_shared/auth.ts";
import { error, json, manejar } from "../_shared/http.ts";

function nombreProveedor(p: {
  tipo_persona: "empresa" | "natural";
  nombre_legal: string | null;
  nombre_comercial: string | null;
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
}): string {
  if (p.tipo_persona === "natural") {
    return [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(" ");
  }
  return p.nombre_legal ?? p.nombre_comercial ?? "Proveedor";
}

function totalLinea(l: { cantidad: number; precio_unitario: number; descuento_pct: number }) {
  return Number(l.cantidad) * Number(l.precio_unitario) * (1 - Number(l.descuento_pct) / 100);
}

// ---------- Solicitud de Recursos ----------

async function listarSolicitudesRecursos(
  identidad: Identidad,
  obraId: string,
  origen: string | null,
): Promise<Response> {
  await exigirPermiso(identidad, "compras", "ver");
  await exigirAccesoObra(identidad, obraId);

  const { data, error: err } = await db()
    .from("solicitudes_recursos")
    .select("id, numero, descripcion, solicita, f_emision, estado, estado_aprobacion")
    .eq("obra_id", obraId)
    .order("numero", { ascending: false });

  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  return json(data, origen);
}

async function obtenerSolicitudRecursoDetalle(
  identidad: Identidad,
  id: string,
  origen: string | null,
): Promise<Response> {
  await exigirPermiso(identidad, "compras", "ver");

  const { data, error: err } = await db()
    .from("solicitudes_recursos")
    .select(
      `id, numero, descripcion, solicita, f_emision, f_esperada_recepcion, tipo_solicitud,
       estado, estado_aprobacion, obra_id,
       lineas:solicitud_recurso_lineas (
         id, cantidad, unidad_embalaje, factor, notas, cantidad_cotizada, cantidad_comprada, estado, orden,
         urgencia:urgencias ( nombre ),
         recurso:recursos ( codigo, nombre, unidad_compra ),
         partida:presupuesto_partidas ( partida:partidas ( codigo, nombre ), area:areas ( codigo, nombre ) )
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  if (!data) return error("Solicitud no encontrada", origen, 404);

  await exigirAccesoObra(identidad, data.obra_id as string);

  const raw = data as unknown as {
    lineas: {
      orden: number;
      urgencia: { nombre: string } | null;
      recurso: { codigo: string; nombre: string; unidad_compra: string };
      partida: { partida: { codigo: string; nombre: string }; area: { codigo: string; nombre: string } } | null;
      [k: string]: unknown;
    }[];
    [k: string]: unknown;
  };

  return json(
    {
      ...raw,
      lineas: raw.lineas
        .sort((a, b) => a.orden - b.orden)
        .map((l) => ({ ...l, area: l.partida?.area ?? null, partida: l.partida?.partida ?? null })),
    },
    origen,
  );
}

// ---------- Solicitud de Cotizacion ----------

async function listarSolicitudesCotizacion(
  identidad: Identidad,
  obraId: string,
  origen: string | null,
): Promise<Response> {
  await exigirPermiso(identidad, "compras", "ver");
  await exigirAccesoObra(identidad, obraId);

  const { data, error: err } = await db()
    .from("solicitudes_cotizacion")
    .select("id, numero, descripcion, solicita, f_emision, estado, estado_aprobacion")
    .eq("obra_id", obraId)
    .order("numero", { ascending: false });

  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  return json(data, origen);
}

async function obtenerSolicitudCotizacionDetalle(
  identidad: Identidad,
  id: string,
  origen: string | null,
): Promise<Response> {
  await exigirPermiso(identidad, "compras", "ver");

  const { data, error: err } = await db()
    .from("solicitudes_cotizacion")
    .select(
      `id, numero, descripcion, solicita, moneda, f_emision, estado, estado_aprobacion, obra_id,
       lineas:solicitud_cotizacion_lineas (
         id, cantidad, orden,
         recurso:recursos ( codigo, nombre, unidad_compra )
       ),
       proveedores:solicitud_cotizacion_proveedores (
         id, atiende, enviado,
         forma_pago:formas_pago ( nombre ),
         proveedor:personas ( tipo_persona, nombre_legal, nombre_comercial, nombres, apellido_paterno, apellido_materno )
       )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  if (!data) return error("Solicitud no encontrada", origen, 404);

  await exigirAccesoObra(identidad, data.obra_id as string);

  const raw = data as unknown as {
    lineas: { id: string; cantidad: number; orden: number; recurso: { codigo: string; nombre: string; unidad_compra: string } }[];
    proveedores: {
      id: string;
      atiende: string | null;
      enviado: boolean;
      forma_pago: { nombre: string } | null;
      proveedor: Parameters<typeof nombreProveedor>[0];
    }[];
    [k: string]: unknown;
  };

  const proveedores = raw.proveedores.map((p) => ({
    id: p.id,
    nombre: nombreProveedor(p.proveedor),
    formaPago: p.forma_pago?.nombre ?? null,
    atiende: p.atiende,
    enviado: p.enviado,
  }));

  const { data: precios, error: errPrecios } = await db()
    .from("solicitud_cotizacion_precios")
    .select("linea_id, proveedor_id, precio, descuento_pct")
    .in("linea_id", raw.lineas.map((l) => l.id));
  if (errPrecios) return error(`No se pudo leer: ${errPrecios.message}`, origen, 500);

  const cuadroComparativo = raw.lineas
    .sort((a, b) => a.orden - b.orden)
    .map((linea) => {
      const precioDe = (proveedorId: string) =>
        precios.find((p) => p.linea_id === linea.id && p.proveedor_id === proveedorId) ?? null;

      const preciosLinea = proveedores.map((prov) => {
        const p = precioDe(prov.id);
        if (!p || p.precio === null) return null;
        return Number(p.precio) * (1 - Number(p.descuento_pct) / 100);
      });

      return {
        lineaId: linea.id,
        recurso: linea.recurso,
        cantidad: Number(linea.cantidad),
        precios: preciosLinea,
        subtotales: preciosLinea.map((precio) => (precio === null ? null : precio * Number(linea.cantidad))),
      };
    });

  return json({ ...raw, proveedores, cuadroComparativo }, origen);
}

// ---------- Orden de Compra ----------

async function listarOrdenesCompra(
  identidad: Identidad,
  obraId: string,
  origen: string | null,
): Promise<Response> {
  await exigirPermiso(identidad, "compras", "ver");
  await exigirAccesoObra(identidad, obraId);

  const { data, error: err } = await db()
    .from("ordenes_compra")
    .select(
      `id, numero, descripcion, f_emision, estado, estado_aprobacion, enviado_proveedor,
       proveedor:personas ( nombre_legal, nombre_comercial ),
       lineas:orden_compra_lineas ( cantidad, precio_unitario, descuento_pct )`,
    )
    .eq("obra_id", obraId)
    .order("numero", { ascending: false });

  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);

  const conTotal = (data as unknown as { lineas: { cantidad: number; precio_unitario: number; descuento_pct: number }[]; [k: string]: unknown }[])
    .map((o) => ({ ...o, total: o.lineas.reduce((t, l) => t + totalLinea(l), 0) }));

  return json(conTotal, origen);
}

async function obtenerOrdenCompraDetalle(
  identidad: Identidad,
  id: string,
  origen: string | null,
): Promise<Response> {
  await exigirPermiso(identidad, "compras", "ver");

  const { data, error: err } = await db()
    .from("ordenes_compra")
    .select(
      `id, numero, descripcion, f_emision, f_vencimiento, moneda, iva_pct, obra_id,
       estado, estado_aprobacion, enviado_proveedor,
       proveedor:personas ( nombre_legal, nombre_comercial ),
       forma_pago:formas_pago ( nombre ),
       lineas:orden_compra_lineas (
         id, cantidad, precio_unitario, descuento_pct, cantidad_recibida, orden,
         recurso:recursos ( codigo, nombre, unidad_compra ),
         area:presupuesto_partidas ( area:areas ( codigo, nombre ) )
       )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  if (!data) return error("Orden no encontrada", origen, 404);

  await exigirAccesoObra(identidad, data.obra_id as string);

  const raw = data as unknown as {
    forma_pago: { nombre: string } | null;
    iva_pct: number;
    lineas: {
      id: string;
      cantidad: number;
      precio_unitario: number;
      descuento_pct: number;
      cantidad_recibida: number;
      orden: number;
      recurso: { codigo: string; nombre: string; unidad_compra: string };
      area: { area: { codigo: string; nombre: string } } | null;
    }[];
    [k: string]: unknown;
  };

  const lineas = raw.lineas
    .sort((a, b) => a.orden - b.orden)
    .map((l) => ({
      id: l.id,
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio_unitario),
      descuento_pct: Number(l.descuento_pct),
      cantidad_recibida: Number(l.cantidad_recibida),
      subtotal: totalLinea(l),
      recurso: l.recurso,
      area: l.area?.area ?? null,
    }));

  const subtotal = lineas.reduce((t, l) => t + l.subtotal, 0);
  const iva = (subtotal * Number(raw.iva_pct)) / 100;

  return json(
    { ...raw, formaPago: raw.forma_pago?.nombre ?? null, lineas, subtotal, iva, total: subtotal + iva },
    origen,
  );
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

    const url = new URL(req.url);
    const partes = url.pathname.replace(/^\/compras/, "").split("/").filter(Boolean);
    const obraId = url.searchParams.get("obraId");

    try {
      if (partes[0] === "solicitudes-recursos" && partes.length === 1 && req.method === "GET") {
        if (!obraId) return error("Falta obraId", origen);
        return await listarSolicitudesRecursos(identidad, obraId, origen);
      }
      if (partes[0] === "solicitudes-recursos" && partes.length === 2 && req.method === "GET") {
        return await obtenerSolicitudRecursoDetalle(identidad, partes[1], origen);
      }
      if (partes[0] === "solicitudes-cotizacion" && partes.length === 1 && req.method === "GET") {
        if (!obraId) return error("Falta obraId", origen);
        return await listarSolicitudesCotizacion(identidad, obraId, origen);
      }
      if (partes[0] === "solicitudes-cotizacion" && partes.length === 2 && req.method === "GET") {
        return await obtenerSolicitudCotizacionDetalle(identidad, partes[1], origen);
      }
      if (partes[0] === "ordenes" && partes.length === 1 && req.method === "GET") {
        if (!obraId) return error("Falta obraId", origen);
        return await listarOrdenesCompra(identidad, obraId, origen);
      }
      if (partes[0] === "ordenes" && partes.length === 2 && req.method === "GET") {
        return await obtenerOrdenCompraDetalle(identidad, partes[1], origen);
      }
    } catch (e) {
      if (e instanceof SinPermiso) return error(e.message, origen, 403);
      throw e;
    }

    return error("Ruta no encontrada", origen, 404);
  })
);
