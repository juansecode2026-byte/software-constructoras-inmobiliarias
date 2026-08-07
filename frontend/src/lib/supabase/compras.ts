// Consultas tipadas para el modulo Compras (ver supabase/migrations/0010_compras.sql
// y docs/modulo-compras.md local): Solicitud de Recursos -> Solicitud de
// Cotizacion -> Orden de Compra. El Cuadro Comparativo se calcula en
// obtenerSolicitudCotizacionDetalle a partir de solicitud_cotizacion_precios,
// no vive en una tabla propia.

import { createClient } from "./client";

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

type Estado = "en_digitacion" | "pendiente" | "terminada";
type EstadoAprobacion = "pendiente" | "aprobado" | "rechazado";

// ---------- Solicitud de Recursos ----------

export interface SolicitudRecursoFila {
  id: string;
  numero: number;
  descripcion: string | null;
  solicita: string | null;
  f_emision: string;
  estado: Estado;
  estado_aprobacion: EstadoAprobacion;
}

export async function listarSolicitudesRecursos(obraId: string): Promise<SolicitudRecursoFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_recursos")
    .select("id, numero, descripcion, solicita, f_emision, estado, estado_aprobacion")
    .eq("obra_id", obraId)
    .order("numero", { ascending: false });

  if (error) throw error;
  return data;
}

export interface SolicitudRecursoLineaFila {
  id: string;
  cantidad: number;
  unidad_embalaje: string | null;
  factor: number;
  notas: string | null;
  cantidad_cotizada: number;
  cantidad_comprada: number;
  estado: "pendiente" | "terminada";
  urgencia: { nombre: string } | null;
  recurso: { codigo: string; nombre: string; unidad_compra: string };
  area: { codigo: string; nombre: string } | null;
  partida: { codigo: string; nombre: string } | null;
}

export interface SolicitudRecursoDetalle {
  id: string;
  numero: number;
  descripcion: string | null;
  solicita: string | null;
  f_emision: string;
  f_esperada_recepcion: string | null;
  tipo_solicitud: string;
  estado: Estado;
  estado_aprobacion: EstadoAprobacion;
  lineas: SolicitudRecursoLineaFila[];
}

export async function obtenerSolicitudRecursoDetalle(id: string): Promise<SolicitudRecursoDetalle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_recursos")
    .select(
      `id, numero, descripcion, solicita, f_emision, f_esperada_recepcion, tipo_solicitud,
       estado, estado_aprobacion,
       lineas:solicitud_recurso_lineas (
         id, cantidad, unidad_embalaje, factor, notas, cantidad_cotizada, cantidad_comprada, estado, orden,
         urgencia:urgencias ( nombre ),
         recurso:recursos ( codigo, nombre, unidad_compra ),
         partida:presupuesto_partidas ( partida:partidas ( codigo, nombre ), area:areas ( codigo, nombre ) )
       )`,
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  const raw = data as unknown as Omit<SolicitudRecursoDetalle, "lineas"> & {
    lineas: (Omit<SolicitudRecursoLineaFila, "urgencia" | "recurso" | "area" | "partida"> & {
      orden: number;
      urgencia: { nombre: string } | null;
      recurso: { codigo: string; nombre: string; unidad_compra: string };
      partida: { partida: { codigo: string; nombre: string }; area: { codigo: string; nombre: string } } | null;
    })[];
  };

  return {
    ...raw,
    lineas: raw.lineas
      .sort((a, b) => a.orden - b.orden)
      .map((l) => ({
        ...l,
        area: l.partida?.area ?? null,
        partida: l.partida?.partida ?? null,
      })),
  };
}

// ---------- Solicitud de Cotizacion ----------

export interface SolicitudCotizacionFila {
  id: string;
  numero: number;
  descripcion: string | null;
  solicita: string | null;
  f_emision: string;
  estado: Estado;
  estado_aprobacion: EstadoAprobacion;
}

export async function listarSolicitudesCotizacion(obraId: string): Promise<SolicitudCotizacionFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_cotizacion")
    .select("id, numero, descripcion, solicita, f_emision, estado, estado_aprobacion")
    .eq("obra_id", obraId)
    .order("numero", { ascending: false });

  if (error) throw error;
  return data;
}

export interface CuadroComparativoFila {
  lineaId: string;
  recurso: { codigo: string; nombre: string; unidad_compra: string };
  cantidad: number;
  // precio y subtotal por proveedor, en el mismo orden que `proveedores`
  precios: (number | null)[];
  subtotales: (number | null)[];
}

export interface ProveedorCotizacionFila {
  id: string;
  nombre: string;
  formaPago: string | null;
  atiende: string | null;
  enviado: boolean;
}

export interface SolicitudCotizacionDetalle {
  id: string;
  numero: number;
  descripcion: string | null;
  solicita: string | null;
  moneda: string;
  f_emision: string;
  estado: Estado;
  estado_aprobacion: EstadoAprobacion;
  proveedores: ProveedorCotizacionFila[];
  // Cuadro Comparativo: vista calculada, no tabla propia (ver docs/modulo-compras.md)
  cuadroComparativo: CuadroComparativoFila[];
}

export async function obtenerSolicitudCotizacionDetalle(id: string): Promise<SolicitudCotizacionDetalle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_cotizacion")
    .select(
      `id, numero, descripcion, solicita, moneda, f_emision, estado, estado_aprobacion,
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
    .single();
  if (error) throw error;

  const raw = data as unknown as Omit<SolicitudCotizacionDetalle, "proveedores" | "cuadroComparativo"> & {
    lineas: {
      id: string;
      cantidad: number;
      orden: number;
      recurso: { codigo: string; nombre: string; unidad_compra: string };
    }[];
    proveedores: {
      id: string;
      atiende: string | null;
      enviado: boolean;
      forma_pago: { nombre: string } | null;
      proveedor: {
        tipo_persona: "empresa" | "natural";
        nombre_legal: string | null;
        nombre_comercial: string | null;
        nombres: string | null;
        apellido_paterno: string | null;
        apellido_materno: string | null;
      };
    }[];
  };

  const proveedores: ProveedorCotizacionFila[] = raw.proveedores.map((p) => ({
    id: p.id,
    nombre: nombreProveedor(p.proveedor),
    formaPago: p.forma_pago?.nombre ?? null,
    atiende: p.atiende,
    enviado: p.enviado,
  }));

  const { data: precios, error: errorPrecios } = await supabase
    .from("solicitud_cotizacion_precios")
    .select("linea_id, proveedor_id, precio, descuento_pct")
    .in(
      "linea_id",
      raw.lineas.map((l) => l.id),
    );
  if (errorPrecios) throw errorPrecios;

  const cuadroComparativo: CuadroComparativoFila[] = raw.lineas
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

  return {
    ...raw,
    proveedores,
    cuadroComparativo,
  };
}

// ---------- Orden de Compra ----------

export interface OrdenCompraFila {
  id: string;
  numero: number;
  descripcion: string | null;
  f_emision: string;
  estado: Estado;
  estado_aprobacion: EstadoAprobacion;
  enviado_proveedor: boolean;
  proveedor: { nombre_legal: string | null; nombre_comercial: string | null } | null;
  total: number;
}

interface OrdenCompraListaRaw {
  id: string;
  numero: number;
  descripcion: string | null;
  f_emision: string;
  estado: Estado;
  estado_aprobacion: EstadoAprobacion;
  enviado_proveedor: boolean;
  proveedor: { nombre_legal: string | null; nombre_comercial: string | null } | null;
  lineas: { cantidad: number; precio_unitario: number; descuento_pct: number }[];
}

function totalLinea(l: { cantidad: number; precio_unitario: number; descuento_pct: number }) {
  return Number(l.cantidad) * Number(l.precio_unitario) * (1 - Number(l.descuento_pct) / 100);
}

export async function listarOrdenesCompra(obraId: string): Promise<OrdenCompraFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordenes_compra")
    .select(
      `id, numero, descripcion, f_emision, estado, estado_aprobacion, enviado_proveedor,
       proveedor:personas ( nombre_legal, nombre_comercial ),
       lineas:orden_compra_lineas ( cantidad, precio_unitario, descuento_pct )`,
    )
    .eq("obra_id", obraId)
    .order("numero", { ascending: false });

  if (error) throw error;

  return (data as unknown as OrdenCompraListaRaw[]).map((o) => ({
    ...o,
    total: o.lineas.reduce((t, l) => t + totalLinea(l), 0),
  }));
}

export interface OrdenCompraLineaFila {
  id: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  cantidad_recibida: number;
  subtotal: number;
  recurso: { codigo: string; nombre: string; unidad_compra: string };
  area: { codigo: string; nombre: string } | null;
}

export interface OrdenCompraDetalle {
  id: string;
  numero: number;
  descripcion: string | null;
  f_emision: string;
  f_vencimiento: string | null;
  moneda: string;
  iva_pct: number;
  estado: Estado;
  estado_aprobacion: EstadoAprobacion;
  enviado_proveedor: boolean;
  proveedor: { nombre_legal: string | null; nombre_comercial: string | null } | null;
  formaPago: string | null;
  lineas: OrdenCompraLineaFila[];
  subtotal: number;
  iva: number;
  total: number;
}

export async function obtenerOrdenCompraDetalle(id: string): Promise<OrdenCompraDetalle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordenes_compra")
    .select(
      `id, numero, descripcion, f_emision, f_vencimiento, moneda, iva_pct,
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
    .single();
  if (error) throw error;

  const raw = data as unknown as Omit<OrdenCompraDetalle, "lineas" | "subtotal" | "iva" | "total" | "formaPago"> & {
    forma_pago: { nombre: string } | null;
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
  };

  const lineas: OrdenCompraLineaFila[] = raw.lineas
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

  return {
    ...raw,
    formaPago: raw.forma_pago?.nombre ?? null,
    lineas,
    subtotal,
    iva,
    total: subtotal + iva,
  };
}
