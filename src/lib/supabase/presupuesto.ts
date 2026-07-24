// Consultas tipadas para el modulo Presupuesto (ver supabase/migrations/0001_presupuesto.sql).
// Reemplazan progresivamente los datos de ejemplo de src/features/erp/data.ts.
// No se usan todavia en las paginas: faltan las variables de entorno de un
// proyecto Supabase real (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).

import { createClient } from "./server";

export interface ObraFila {
  id: string;
  nombre: string;
  estado: "en_planificacion" | "en_ejecucion" | "cerrada";
}

export async function listarObras(empresaId: string): Promise<ObraFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obras")
    .select("id, nombre, estado")
    .eq("empresa_id", empresaId)
    .order("nombre");

  if (error) throw error;
  return data;
}

export interface PresupuestoFila {
  id: string;
  numero: number;
  nombre: string;
  estado: "en_proceso" | "aprobado";
  vigente: boolean;
}

export async function listarPresupuestos(obraId: string): Promise<PresupuestoFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select("id, numero, nombre, estado, vigente")
    .eq("obra_id", obraId)
    .order("numero");

  if (error) throw error;
  return data;
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
