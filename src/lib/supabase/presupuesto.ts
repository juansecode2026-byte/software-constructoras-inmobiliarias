// Consultas tipadas para el modulo Presupuesto (ver supabase/migrations/0001_presupuesto.sql).
// Usadas por src/app/erp/**, reemplazando los datos de ejemplo que antes vivian
// hardcodeados en src/features/erp/data.ts.

import { createClient } from "./server";

// Single-tenant por ahora (ver docs/diagnostico-erp.md): una sola empresa real.
// Se resuelve por nombre en vez de hardcodear un uuid.
export async function obtenerEmpresaId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empresas")
    .select("id")
    .limit(1)
    .single();

  if (error) throw error;
  return data.id;
}

export interface ObraFila {
  id: string;
  nombre: string;
  estado: "en_planificacion" | "en_ejecucion" | "cerrada";
  presupuestoTotal: number | null;
}

interface ObraConPartidas {
  id: string;
  nombre: string;
  estado: "en_planificacion" | "en_ejecucion" | "cerrada";
  presupuestos: { areas: { presupuesto_partidas: { cantidad: number; precio_unitario_total: number }[] }[] }[];
}

// Postgres devuelve columnas "numeric" como string via PostgREST; se convierten
// explicitamente antes de operar para no arrastrar strings por error.
function sumarTotal(presupuestos: ObraConPartidas["presupuestos"]): number {
  return presupuestos.reduce(
    (total, p) =>
      total +
      p.areas.reduce(
        (t, a) =>
          t +
          a.presupuesto_partidas.reduce(
            (tt, pp) => tt + Number(pp.cantidad) * Number(pp.precio_unitario_total),
            0,
          ),
        0,
      ),
    0,
  );
}

export async function listarObras(empresaId: string): Promise<ObraFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obras")
    .select(
      `id, nombre, estado,
       presupuestos ( areas ( presupuesto_partidas ( cantidad, precio_unitario_total ) ) )`,
    )
    .eq("empresa_id", empresaId)
    .order("nombre");

  if (error) throw error;

  return (data as unknown as ObraConPartidas[]).map((o) => ({
    id: o.id,
    nombre: o.nombre,
    estado: o.estado,
    presupuestoTotal: o.estado === "en_planificacion" ? null : sumarTotal(o.presupuestos),
  }));
}

export async function obtenerObraPorNombre(nombre: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obras")
    .select("id, nombre, estado")
    .eq("nombre", nombre)
    .single();

  if (error) throw error;
  return data;
}

export interface PresupuestoFila {
  id: string;
  numero: number;
  nombre: string;
  estado: "en_proceso" | "aprobado";
  vigente: boolean;
  total: number;
}

export async function listarPresupuestos(obraId: string): Promise<PresupuestoFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select(
      `id, numero, nombre, estado, vigente,
       areas ( presupuesto_partidas ( cantidad, precio_unitario_total ) )`,
    )
    .eq("obra_id", obraId)
    .order("numero");

  if (error) throw error;

  return (
    data as unknown as (Omit<PresupuestoFila, "total"> & {
      areas: { presupuesto_partidas: { cantidad: number; precio_unitario_total: number }[] }[];
    })[]
  ).map((p) => ({
    id: p.id,
    numero: p.numero,
    nombre: p.nombre,
    estado: p.estado,
    vigente: p.vigente,
    total: sumarTotal([{ areas: p.areas }]),
  }));
}

export interface CarpetaFila {
  id: string;
  nombre: string;
  parent_id: string | null;
}

export async function listarCarpetas(obraId: string): Promise<CarpetaFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuesto_carpetas")
    .select("id, nombre, parent_id")
    .eq("obra_id", obraId);

  if (error) throw error;
  return data;
}

export interface PartidaEnAreaFila {
  presupuestoPartidaId: string;
  cantidad: number;
  precioUnitarioTotal: number;
  partida: { codigo: string; nombre: string; unidad: string };
}

export interface AreaConPartidas {
  id: string;
  codigo: string;
  nombre: string;
  partidas: PartidaEnAreaFila[];
}

export async function listarAreasYPartidas(presupuestoId: string): Promise<AreaConPartidas[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("areas")
    .select(
      `id, codigo, nombre,
       presupuesto_partidas (
         id, cantidad, precio_unitario_total,
         partida:partidas ( codigo, nombre, unidad )
       )`,
    )
    .eq("presupuesto_id", presupuestoId)
    .order("codigo");

  if (error) throw error;

  return (
    data as unknown as {
      id: string;
      codigo: string;
      nombre: string;
      presupuesto_partidas: {
        id: string;
        cantidad: number;
        precio_unitario_total: number;
        partida: { codigo: string; nombre: string; unidad: string };
      }[];
    }[]
  ).map((a) => ({
    id: a.id,
    codigo: a.codigo,
    nombre: a.nombre,
    partidas: a.presupuesto_partidas.map((pp) => ({
      presupuestoPartidaId: pp.id,
      cantidad: pp.cantidad,
      precioUnitarioTotal: pp.precio_unitario_total,
      partida: pp.partida,
    })),
  }));
}

export interface RecursoPartidaFila {
  codigo: string;
  nombre: string;
  tipo_costo: string;
  rendimiento: number;
  cantidad: number;
  precio_unitario: number;
  sugerido_por_agente: boolean;
  agente_meta: Record<string, unknown> | null;
}

export interface PresupuestoPartidaDetalle {
  id: string;
  cantidad: number;
  imprevistos_pct: number;
  gastos_generales_pct: number;
  utilidad_pct: number;
  precio_unitario_total: number;
  partida: { codigo: string; nombre: string; unidad: string };
  recursos: RecursoPartidaFila[];
}

export async function obtenerPartidaDetalle(
  presupuestoPartidaId: string,
): Promise<PresupuestoPartidaDetalle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuesto_partidas")
    .select(
      `id, cantidad, imprevistos_pct, gastos_generales_pct, utilidad_pct, precio_unitario_total,
       partida:partidas ( codigo, nombre, unidad ),
       recursos:partida_recursos (
         rendimiento, cantidad, precio_unitario, sugerido_por_agente, agente_meta,
         recurso:recursos ( codigo, nombre, tipo_costo )
       )`,
    )
    .eq("id", presupuestoPartidaId)
    .single();

  if (error) throw error;
  return data as unknown as PresupuestoPartidaDetalle;
}
