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

export interface PresupuestoDetalle {
  id: string;
  numero: number;
  nombre: string;
  estado: "en_proceso" | "aprobado";
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

export async function obtenerPresupuestoDetalle(presupuestoId: string): Promise<PresupuestoDetalle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select(
      `id, numero, nombre, estado, vigente, descripcion, categoria, pie_firma,
       imprevistos_pct, gastos_generales_pct, utilidad_pct, iva_pct, credito_iva_pct,
       incluir_pct_en_pu, presupuesto_original_id,
       cliente:personas ( nombre_legal, nombre_comercial )`,
    )
    .eq("id", presupuestoId)
    .single();

  if (error) throw error;
  return data as unknown as PresupuestoDetalle;
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

export async function listarAreasYPartidas(presupuestoId: string): Promise<AreaConPartidas[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("areas")
    .select(
      `id, codigo, nombre, item, unidad, cantidad,
       grupos:presupuesto_grupos ( id, parent_id, tipo, codigo, item, nombre, orden ),
       presupuesto_partidas (
         id, grupo_id, cantidad, precio_unitario_total,
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
      item: string | null;
      unidad: string;
      cantidad: number;
      grupos: GrupoFila[];
      presupuesto_partidas: {
        id: string;
        grupo_id: string | null;
        cantidad: number;
        precio_unitario_total: number;
        partida: { codigo: string; nombre: string; unidad: string };
      }[];
    }[]
  ).map((a) => ({
    id: a.id,
    codigo: a.codigo,
    nombre: a.nombre,
    item: a.item,
    unidad: a.unidad,
    cantidad: Number(a.cantidad),
    grupos: a.grupos.sort((x, y) => x.orden - y.orden),
    partidas: a.presupuesto_partidas.map((pp) => ({
      presupuestoPartidaId: pp.id,
      grupoId: pp.grupo_id,
      cantidad: pp.cantidad,
      precioUnitarioTotal: pp.precio_unitario_total,
      partida: pp.partida,
    })),
  }));
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

interface AreaComparacionRaw {
  codigo: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  presupuesto_partidas: { cantidad: number; precio_unitario_total: number }[];
}

async function cargarAreasParaComparacion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  presupuestoId: string,
): Promise<Map<string, { nombre: string; unidad: string; cantidad: number; total: number }>> {
  const { data, error } = await supabase
    .from("areas")
    .select("codigo, nombre, unidad, cantidad, presupuesto_partidas ( cantidad, precio_unitario_total )")
    .eq("presupuesto_id", presupuestoId);

  if (error) throw error;

  const mapa = new Map<string, { nombre: string; unidad: string; cantidad: number; total: number }>();
  for (const area of data as unknown as AreaComparacionRaw[]) {
    const total = area.presupuesto_partidas.reduce(
      (t, pp) => t + Number(pp.cantidad) * Number(pp.precio_unitario_total),
      0,
    );
    mapa.set(area.codigo, {
      nombre: area.nombre,
      unidad: area.unidad,
      cantidad: Number(area.cantidad),
      total,
    });
  }
  return mapa;
}

// Compara, a nivel Area, un presupuesto de trabajo contra su version original
// congelada (ver docs/proceso-control-costos.md y modulo-presupuesto-demo-muda.md:
// reporte "Comparacion de Presupuestos Original-Trabajo"). No requiere el modulo
// de Compras: solo cruza dos versiones de presupuesto ya cargadas.
export async function obtenerComparacionOriginalTrabajo(
  presupuestoTrabajoId: string,
): Promise<ComparacionOriginalTrabajo> {
  const supabase = await createClient();

  const { data: trabajo, error: errorTrabajo } = await supabase
    .from("presupuestos")
    .select("id, numero, nombre, presupuesto_original_id")
    .eq("id", presupuestoTrabajoId)
    .single();
  if (errorTrabajo) throw errorTrabajo;
  if (!trabajo.presupuesto_original_id) {
    throw new Error("Este presupuesto no tiene una version original asociada.");
  }

  const { data: original, error: errorOriginal } = await supabase
    .from("presupuestos")
    .select("id, numero, nombre")
    .eq("id", trabajo.presupuesto_original_id)
    .single();
  if (errorOriginal) throw errorOriginal;

  const [mapaOriginal, mapaTrabajo] = await Promise.all([
    cargarAreasParaComparacion(supabase, original.id),
    cargarAreasParaComparacion(supabase, presupuestoTrabajoId),
  ]);

  const codigos = new Set([...mapaOriginal.keys(), ...mapaTrabajo.keys()]);

  const areas: ComparacionArea[] = [...codigos].sort().map((codigo) => {
    const o = mapaOriginal.get(codigo);
    const t = mapaTrabajo.get(codigo);
    return {
      codigo,
      nombre: t?.nombre ?? o?.nombre ?? codigo,
      unidad: t?.unidad ?? o?.unidad ?? "",
      cantidadOriginal: o?.cantidad ?? null,
      totalOriginal: o?.total ?? null,
      cantidadTrabajo: t?.cantidad ?? null,
      totalTrabajo: t?.total ?? null,
      diferenciaCantidad: o && t ? t.cantidad - o.cantidad : null,
      diferenciaTotal: o && t ? t.total - o.total : (t?.total ?? 0) - (o?.total ?? 0),
    };
  });

  return {
    original: { id: original.id, numero: original.numero, nombre: original.nombre },
    trabajo: { id: trabajo.id, numero: trabajo.numero, nombre: trabajo.nombre },
    areas,
    totalOriginal: areas.reduce((t, a) => t + (a.totalOriginal ?? 0), 0),
    totalTrabajo: areas.reduce((t, a) => t + (a.totalTrabajo ?? 0), 0),
  };
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

export async function obtenerPartidaDetalle(
  presupuestoPartidaId: string,
): Promise<PresupuestoPartidaDetalle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuesto_partidas")
    .select(
      `id, cantidad, imprevistos_pct, gastos_generales_pct, utilidad_pct,
       imprevistos_manual, gastos_generales_manual, utilidad_manual, precio_unitario_total,
       partida:partidas ( codigo, nombre, unidad ),
       recursos:partida_recursos (
         rendimiento, factor, cantidad, precio_unitario, porcentaje, comentario,
         sugerido_por_agente, agente_meta,
         tipo_porcentaje:tipos_porcentaje ( nombre ),
         recurso:recursos ( codigo, nombre, tipo_costo )
       )`,
    )
    .eq("id", presupuestoPartidaId)
    .single();

  if (error) throw error;

  const bruto = data as unknown as Omit<PresupuestoPartidaDetalle, "recursos"> & {
    recursos: (Omit<RecursoPartidaFila, "codigo" | "nombre" | "tipo_costo" | "tipo_porcentaje"> & {
      tipo_porcentaje: { nombre: string } | null;
      recurso: { codigo: string; nombre: string; tipo_costo: string };
    })[];
  };

  return {
    ...bruto,
    recursos: bruto.recursos.map((r) => ({
      codigo: r.recurso.codigo,
      nombre: r.recurso.nombre,
      tipo_costo: r.recurso.tipo_costo,
      rendimiento: r.rendimiento,
      factor: Number(r.factor),
      cantidad: r.cantidad,
      precio_unitario: r.precio_unitario,
      porcentaje: r.porcentaje === null ? null : Number(r.porcentaje),
      tipo_porcentaje: r.tipo_porcentaje?.nombre ?? null,
      comentario: r.comentario,
      sugerido_por_agente: r.sugerido_por_agente,
      agente_meta: r.agente_meta,
    })),
  };
}
