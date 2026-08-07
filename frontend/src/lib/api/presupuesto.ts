// Modulo Presupuesto. Mismas firmas que lib/supabase/presupuesto.ts, salvo
// listarObras() y obtenerObraPorNombre(): ya no reciben empresaId, el backend
// lo resuelve del token (igual que en configuraciones.ts). obtenerEmpresaId()
// desaparece del todo: nada del frontend necesita el id de la empresa.

import { api } from "./client";

export interface ObraFila {
  id: string;
  nombre: string;
  estado: "en_planificacion" | "en_ejecucion" | "cerrada";
  presupuestoTotal: number | null;
}

export function listarObras(): Promise<ObraFila[]> {
  return api.get("presupuesto/obras");
}

export function obtenerObraPorNombre(nombre: string): Promise<{ id: string; nombre: string; estado: string }> {
  return api.get(`presupuesto/obras/por-nombre/${encodeURIComponent(nombre)}`);
}

export interface PresupuestoFila {
  id: string;
  numero: number;
  nombre: string;
  estado: string;
  estadoEsAprobado: boolean;
  vigente: boolean;
  carpeta_id: string | null;
  total: number;
}

export function listarPresupuestos(obraId: string): Promise<PresupuestoFila[]> {
  return api.get(`presupuesto/obras/${obraId}/presupuestos`);
}

export interface CarpetaFila {
  id: string;
  nombre: string;
  parent_id: string | null;
}

export function listarCarpetas(obraId: string): Promise<CarpetaFila[]> {
  return api.get(`presupuesto/obras/${obraId}/carpetas`);
}

export interface PresupuestoDetalle {
  id: string;
  numero: number;
  nombre: string;
  estado: string;
  estadoEsAprobado: boolean;
  vigente: boolean;
  descripcion: string | null;
  categoria: string | null;
  pie_firma: string | null;
  imprevistos_pct: number;
  gastos_generales_pct: number;
  utilidad_pct: number;
  iva_pct: number;
  credito_iva_pct: number;
  incluir_pct_en_pu: boolean;
  presupuesto_original_id: string | null;
  cliente: { nombre_legal: string | null; nombre_comercial: string | null } | null;
}

export function obtenerPresupuestoDetalle(presupuestoId: string): Promise<PresupuestoDetalle> {
  return api.get(`presupuesto/${presupuestoId}`);
}

export interface GrupoFila {
  id: string;
  parent_id: string | null;
  tipo: "grupo" | "titulo";
  codigo: string | null;
  item: string | null;
  nombre: string;
  orden: number;
}

export interface PartidaEnAreaFila {
  presupuestoPartidaId: string;
  grupoId: string | null;
  cantidad: number;
  precioUnitarioTotal: number;
  partida: { codigo: string; nombre: string; unidad: string };
}

export interface AreaConPartidas {
  id: string;
  codigo: string;
  nombre: string;
  item: string | null;
  unidad: string;
  cantidad: number;
  grupos: GrupoFila[];
  partidas: PartidaEnAreaFila[];
}

export function listarAreasYPartidas(presupuestoId: string): Promise<AreaConPartidas[]> {
  return api.get(`presupuesto/${presupuestoId}/areas`);
}

export interface ComparacionArea {
  codigo: string;
  nombre: string;
  unidad: string;
  cantidadOriginal: number | null;
  totalOriginal: number | null;
  cantidadTrabajo: number | null;
  totalTrabajo: number | null;
  diferenciaCantidad: number | null;
  diferenciaTotal: number | null;
}

export interface ComparacionOriginalTrabajo {
  original: { id: string; numero: number; nombre: string };
  trabajo: { id: string; numero: number; nombre: string };
  areas: ComparacionArea[];
  totalOriginal: number;
  totalTrabajo: number;
}

export function obtenerComparacionOriginalTrabajo(presupuestoTrabajoId: string): Promise<ComparacionOriginalTrabajo> {
  return api.get(`presupuesto/${presupuestoTrabajoId}/comparacion`);
}

export interface EstadoInicioPartida {
  disponible: boolean;
  areaCodigo: string | null;
  iniciada: boolean;
  iniciadaEn: string | null;
  autorizacionMotivo: string | null;
  totalOriginal: number | null;
  totalTrabajo: number;
  sobrecosto: boolean;
}

export function obtenerEstadoInicioPartida(presupuestoPartidaId: string): Promise<EstadoInicioPartida> {
  return api.get(`presupuesto/partidas/${presupuestoPartidaId}/estado-inicio`);
}

export interface RecursoPartidaFila {
  codigo: string;
  nombre: string;
  tipo_costo: string;
  rendimiento: number;
  factor: number;
  cantidad: number;
  precio_unitario: number;
  porcentaje: number | null;
  tipo_porcentaje: string | null;
  comentario: string | null;
  sugerido_por_agente: boolean;
  agente_meta: Record<string, unknown> | null;
}

export interface PresupuestoPartidaDetalle {
  id: string;
  cantidad: number;
  imprevistos_pct: number;
  gastos_generales_pct: number;
  utilidad_pct: number;
  imprevistos_manual: boolean;
  gastos_generales_manual: boolean;
  utilidad_manual: boolean;
  precio_unitario_total: number;
  partida: { codigo: string; nombre: string; unidad: string };
  recursos: RecursoPartidaFila[];
}

export function obtenerPartidaDetalle(presupuestoPartidaId: string): Promise<PresupuestoPartidaDetalle> {
  return api.get(`presupuesto/partidas/${presupuestoPartidaId}`);
}

export interface PartidaObraFila {
  presupuestoPartidaId: string;
  presupuestoId: string;
  presupuestoNumero: number;
  areaCodigo: string;
  areaNombre: string;
  partida: { codigo: string; nombre: string; unidad: string };
  cantidad: number;
  total: number;
}

export function listarPartidasObra(obraId: string): Promise<PartidaObraFila[]> {
  return api.get(`presupuesto/obras/${obraId}/partidas`);
}

export interface PresupuestoTrabajoFila {
  id: string;
  numero: number;
  nombre: string;
  originalNumero: number;
}

export function listarPresupuestosConOriginal(obraId: string): Promise<PresupuestoTrabajoFila[]> {
  return api.get(`presupuesto/obras/${obraId}/presupuestos-con-original`);
}

export interface EstadoInicioObraFila {
  presupuestoPartidaId: string;
  presupuestoId: string;
  presupuestoNumero: number;
  areaCodigo: string;
  partida: { codigo: string; nombre: string };
  totalOriginal: number | null;
  totalTrabajo: number;
  sobrecosto: boolean;
  iniciada: boolean;
  iniciadaEn: string | null;
}

export function listarEstadoInicioObra(obraId: string): Promise<EstadoInicioObraFila[]> {
  return api.get(`presupuesto/obras/${obraId}/estado-inicio`);
}
