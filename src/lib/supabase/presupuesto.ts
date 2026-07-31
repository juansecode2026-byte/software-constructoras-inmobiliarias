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
  estado: string;
  estadoEsAprobado: boolean;
  vigente: boolean;
  carpeta_id: string | null;
  total: number;
}

export async function listarPresupuestos(obraId: string): Promise<PresupuestoFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select(
      `id, numero, nombre, vigente, carpeta_id,
       estado:presupuesto_estados ( nombre, es_aprobado ),
       areas ( presupuesto_partidas ( cantidad, precio_unitario_total ) )`,
    )
    .eq("obra_id", obraId)
    .order("numero");

  if (error) throw error;

  return (
    data as unknown as {
      id: string;
      numero: number;
      nombre: string;
      vigente: boolean;
      carpeta_id: string | null;
      estado: { nombre: string; es_aprobado: boolean };
      areas: { presupuesto_partidas: { cantidad: number; precio_unitario_total: number }[] }[];
    }[]
  ).map((p) => ({
    id: p.id,
    numero: p.numero,
    nombre: p.nombre,
    estado: p.estado.nombre,
    estadoEsAprobado: p.estado.es_aprobado,
    vigente: p.vigente,
    carpeta_id: p.carpeta_id,
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

export async function obtenerPresupuestoDetalle(presupuestoId: string): Promise<PresupuestoDetalle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select(
      `id, numero, nombre, vigente, descripcion, categoria, pie_firma,
       imprevistos_pct, gastos_generales_pct, utilidad_pct, iva_pct, credito_iva_pct,
       incluir_pct_en_pu, presupuesto_original_id,
       estado:presupuesto_estados ( nombre, es_aprobado ),
       cliente:personas ( nombre_legal, nombre_comercial )`,
    )
    .eq("id", presupuestoId)
    .single();

  if (error) throw error;
  const bruto = data as unknown as Omit<PresupuestoDetalle, "estado" | "estadoEsAprobado"> & {
    estado: { nombre: string; es_aprobado: boolean };
  };
  return { ...bruto, estado: bruto.estado.nombre, estadoEsAprobado: bruto.estado.es_aprobado };
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

interface PresupuestoPartidaGateRaw {
  id: string;
  cantidad: number;
  precio_unitario_total: number;
  iniciada: boolean;
  iniciada_en: string | null;
  autorizacion_motivo: string | null;
  partida_id: string;
  area: {
    codigo: string;
    presupuesto_id: string;
    presupuesto: { presupuesto_original_id: string | null } | { presupuesto_original_id: string | null }[];
  };
}

// Estado del gate "Inicio de Partida" (ver docs/proceso-control-costos.md: nodo
// naranja de decision, distinto del reporte de consulta "Comparacion
// Original-Trabajo"). Compara el total de esta partida-en-trabajo contra su
// equivalente en la version original (misma area por codigo, misma partida de
// catalogo) para saber si hay sobrecosto que exija autorizacion.
export async function obtenerEstadoInicioPartida(
  presupuestoPartidaId: string,
): Promise<EstadoInicioPartida> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("presupuesto_partidas")
    .select(
      `id, cantidad, precio_unitario_total, iniciada, iniciada_en, autorizacion_motivo, partida_id,
       area:areas ( codigo, presupuesto_id, presupuesto:presupuestos ( presupuesto_original_id ) )`,
    )
    .eq("id", presupuestoPartidaId)
    .single();
  if (error) throw error;

  const raw = data as unknown as PresupuestoPartidaGateRaw;
  const areaPresupuesto = Array.isArray(raw.area.presupuesto) ? raw.area.presupuesto[0] : raw.area.presupuesto;
  const totalTrabajo = Number(raw.cantidad) * Number(raw.precio_unitario_total);
  const originalId = areaPresupuesto?.presupuesto_original_id ?? null;

  const base = {
    areaCodigo: raw.area.codigo,
    iniciada: raw.iniciada,
    iniciadaEn: raw.iniciada_en,
    autorizacionMotivo: raw.autorizacion_motivo,
    totalTrabajo,
  };

  if (!originalId) {
    return { ...base, disponible: false, totalOriginal: null, sobrecosto: false };
  }

  const { data: areaOriginal, error: errorArea } = await supabase
    .from("areas")
    .select("id")
    .eq("presupuesto_id", originalId)
    .eq("codigo", raw.area.codigo)
    .maybeSingle();
  if (errorArea) throw errorArea;

  let totalOriginal: number | null = null;
  if (areaOriginal) {
    const { data: ppOriginal, error: errorPP } = await supabase
      .from("presupuesto_partidas")
      .select("cantidad, precio_unitario_total")
      .eq("area_id", areaOriginal.id)
      .eq("partida_id", raw.partida_id)
      .maybeSingle();
    if (errorPP) throw errorPP;
    if (ppOriginal) {
      totalOriginal = Number(ppOriginal.cantidad) * Number(ppOriginal.precio_unitario_total);
    }
  }

  return {
    ...base,
    disponible: totalOriginal !== null,
    totalOriginal,
    sobrecosto: totalOriginal !== null && totalTrabajo > totalOriginal,
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

// ---------- vistas obra-completa: Partidas, Inicio de Partida, Informes ----------
// (ver docs/modulo-presupuesto-imagenes.md: submenu real "Presupuesto > Partidas /
// Inicio de Partida / Informes" - antes todo vivia enterrado dentro del detalle
// de un presupuesto puntual, sin vista propia a nivel obra)

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

export async function listarPartidasObra(obraId: string): Promise<PartidaObraFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select(
      `id, numero,
       areas ( codigo, nombre,
         presupuesto_partidas ( id, cantidad, precio_unitario_total,
           partida:partidas ( codigo, nombre, unidad ) ) )`,
    )
    .eq("obra_id", obraId)
    .order("numero");

  if (error) throw error;

  const filas: PartidaObraFila[] = [];
  for (const presupuesto of data as unknown as {
    id: string;
    numero: number;
    areas: {
      codigo: string;
      nombre: string;
      presupuesto_partidas: {
        id: string;
        cantidad: number;
        precio_unitario_total: number;
        partida: { codigo: string; nombre: string; unidad: string };
      }[];
    }[];
  }[]) {
    for (const area of presupuesto.areas) {
      for (const pp of area.presupuesto_partidas) {
        filas.push({
          presupuestoPartidaId: pp.id,
          presupuestoId: presupuesto.id,
          presupuestoNumero: presupuesto.numero,
          areaCodigo: area.codigo,
          areaNombre: area.nombre,
          partida: pp.partida,
          cantidad: Number(pp.cantidad),
          total: Number(pp.cantidad) * Number(pp.precio_unitario_total),
        });
      }
    }
  }
  return filas;
}

export interface PresupuestoTrabajoFila {
  id: string;
  numero: number;
  nombre: string;
  originalNumero: number;
}

// Presupuestos de trabajo con version original asociada: los unicos que
// pueden compararse (ver obtenerComparacionOriginalTrabajo) y los unicos que
// aplican para el gate de Inicio de Partida.
export async function listarPresupuestosConOriginal(obraId: string): Promise<PresupuestoTrabajoFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select("id, numero, nombre, original:presupuesto_original_id ( numero )")
    .eq("obra_id", obraId)
    .not("presupuesto_original_id", "is", null)
    .order("numero");

  if (error) throw error;

  return (data as unknown as { id: string; numero: number; nombre: string; original: { numero: number } | null }[])
    .filter((p) => p.original !== null)
    .map((p) => ({ id: p.id, numero: p.numero, nombre: p.nombre, originalNumero: p.original!.numero }));
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

// Todas las partidas de todos los presupuestos de trabajo de la obra, con su
// estado de "Inicio de Partida" - generaliza obtenerEstadoInicioPartida (que
// resuelve una sola partida) a la vista de lista completa de la obra.
export async function listarEstadoInicioObra(obraId: string): Promise<EstadoInicioObraFila[]> {
  const supabase = await createClient();
  const trabajos = await listarPresupuestosConOriginal(obraId);
  if (trabajos.length === 0) return [];

  const { data: presupuestosTrabajo, error: errorTrabajo } = await supabase
    .from("presupuestos")
    .select("id, presupuesto_original_id")
    .in(
      "id",
      trabajos.map((t) => t.id),
    );
  if (errorTrabajo) throw errorTrabajo;

  const originalIdDe = new Map(
    (presupuestosTrabajo as { id: string; presupuesto_original_id: string }[]).map((p) => [
      p.id,
      p.presupuesto_original_id,
    ]),
  );

  const filas: EstadoInicioObraFila[] = [];

  for (const trabajo of trabajos) {
    const originalId = originalIdDe.get(trabajo.id);
    if (!originalId) continue;

    const [areasTrabajo, areasOriginal] = await Promise.all([
      listarAreasConPartidasGate(supabase, trabajo.id),
      listarAreasConPartidasGate(supabase, originalId),
    ]);

    const totalPorPartidaOriginal = new Map<string, number>();
    for (const area of areasOriginal) {
      for (const pp of area.presupuesto_partidas) {
        totalPorPartidaOriginal.set(`${area.codigo}::${pp.partida_id}`, Number(pp.cantidad) * Number(pp.precio_unitario_total));
      }
    }

    for (const area of areasTrabajo) {
      for (const pp of area.presupuesto_partidas) {
        const totalTrabajo = Number(pp.cantidad) * Number(pp.precio_unitario_total);
        const totalOriginal = totalPorPartidaOriginal.get(`${area.codigo}::${pp.partida_id}`) ?? null;
        filas.push({
          presupuestoPartidaId: pp.id,
          presupuestoId: trabajo.id,
          presupuestoNumero: trabajo.numero,
          areaCodigo: area.codigo,
          partida: pp.partida,
          totalOriginal,
          totalTrabajo,
          sobrecosto: totalOriginal !== null && totalTrabajo > totalOriginal,
          iniciada: pp.iniciada,
          iniciadaEn: pp.iniciada_en,
        });
      }
    }
  }

  return filas;
}

async function listarAreasConPartidasGate(supabase: Awaited<ReturnType<typeof createClient>>, presupuestoId: string) {
  const { data, error } = await supabase
    .from("areas")
    .select(
      `codigo,
       presupuesto_partidas ( id, partida_id, cantidad, precio_unitario_total, iniciada, iniciada_en,
         partida:partidas ( codigo, nombre ) )`,
    )
    .eq("presupuesto_id", presupuestoId);
  if (error) throw error;

  return data as unknown as {
    codigo: string;
    presupuesto_partidas: {
      id: string;
      partida_id: string;
      cantidad: number;
      precio_unitario_total: number;
      iniciada: boolean;
      iniciada_en: string | null;
      partida: { codigo: string; nombre: string };
    }[];
  }[];
}
