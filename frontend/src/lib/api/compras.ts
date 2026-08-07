// Flujo de Compras. Mismas firmas que lib/supabase/compras.ts.

import { api } from "./client";

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

export function listarSolicitudesRecursos(obraId: string): Promise<SolicitudRecursoFila[]> {
  return api.get(`compras/solicitudes-recursos?obraId=${obraId}`);
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

export function obtenerSolicitudRecursoDetalle(id: string): Promise<SolicitudRecursoDetalle> {
  return api.get(`compras/solicitudes-recursos/${id}`);
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

export function listarSolicitudesCotizacion(obraId: string): Promise<SolicitudCotizacionFila[]> {
  return api.get(`compras/solicitudes-cotizacion?obraId=${obraId}`);
}

export interface CuadroComparativoFila {
  lineaId: string;
  recurso: { codigo: string; nombre: string; unidad_compra: string };
  cantidad: number;
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
  cuadroComparativo: CuadroComparativoFila[];
}

export function obtenerSolicitudCotizacionDetalle(id: string): Promise<SolicitudCotizacionDetalle> {
  return api.get(`compras/solicitudes-cotizacion/${id}`);
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

export function listarOrdenesCompra(obraId: string): Promise<OrdenCompraFila[]> {
  return api.get(`compras/ordenes?obraId=${obraId}`);
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

export function obtenerOrdenCompraDetalle(id: string): Promise<OrdenCompraDetalle> {
  return api.get(`compras/ordenes/${id}`);
}
