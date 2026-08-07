// Modulo Presupuesto: el nucleo del ERP. Jerarquia obra -> presupuesto -> area
// -> partida -> recurso (ver docs/base-de-datos.md).
//
// El modulo mas grande y el ultimo en migrar. Todas las rutas de solo lectura
// exigen permiso "presupuesto.ver"; la unica escritura (iniciar partida) exige
// "presupuesto.aprobar", que es lo que la migracion 0015 le da al jefe_obra
// pero NO al comprador — antes cualquier usuario autenticado podia iniciar
// cualquier partida, sin distincion de cargo.
//
// Varios endpoints reciben solo un id de presupuesto o de partida, sin el
// obraId: para autorizar por obra primero hay que resolverla con un join
// corto (obraDePresupuesto / obraDePartida) antes de correr la consulta
// grande. Mismo patron que en compras/index.ts.

import { db } from "../_shared/db.ts";
import { exigirAccesoObra, exigirPermiso, identificar, NoAutenticado, SinPermiso, type Identidad } from "../_shared/auth.ts";
import { error, json, manejar } from "../_shared/http.ts";

// ---------- resolver la obra de un id, para autorizar ----------

async function obraDePresupuesto(presupuestoId: string): Promise<string | null> {
  const { data } = await db().from("presupuestos").select("obra_id").eq("id", presupuestoId).maybeSingle();
  return data?.obra_id ?? null;
}

async function obraDePartida(presupuestoPartidaId: string): Promise<string | null> {
  const { data } = await db()
    .from("presupuesto_partidas")
    .select("area:areas ( presupuesto:presupuestos ( obra_id ) )")
    .eq("id", presupuestoPartidaId)
    .maybeSingle();
  if (!data) return null;
  const area = data.area as { presupuesto: { obra_id: string } | { obra_id: string }[] };
  const presupuesto = Array.isArray(area.presupuesto) ? area.presupuesto[0] : area.presupuesto;
  return presupuesto?.obra_id ?? null;
}

function sumarTotal(
  presupuestos: { areas: { presupuesto_partidas: { cantidad: number; precio_unitario_total: number }[] }[] }[],
): number {
  return presupuestos.reduce(
    (total, p) =>
      total +
      p.areas.reduce(
        (t, a) => t + a.presupuesto_partidas.reduce((tt, pp) => tt + Number(pp.cantidad) * Number(pp.precio_unitario_total), 0),
        0,
      ),
    0,
  );
}

// ---------- obras ----------

async function listarObras(identidad: Identidad, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");
  if (!identidad.empresaId) return error("El usuario no tiene una empresa asociada.", origen, 409);

  const { data, error: err } = await db()
    .from("obras")
    .select(`id, nombre, estado, presupuestos ( areas ( presupuesto_partidas ( cantidad, precio_unitario_total ) ) )`)
    .eq("empresa_id", identidad.empresaId)
    .order("nombre");
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);

  const conAcceso = [];
  for (const o of data as unknown as { id: string; nombre: string; estado: string; presupuestos: never[] }[]) {
    const { data: acceso } = await db().rpc("usuario_accede_obra", {
      p_auth_user_id: identidad.authUserId,
      p_obra_id: o.id,
    });
    if (acceso) conAcceso.push(o);
  }

  return json(
    conAcceso.map((o) => ({
      id: o.id,
      nombre: o.nombre,
      estado: o.estado,
      presupuestoTotal: o.estado === "en_planificacion" ? null : sumarTotal(o.presupuestos as never),
    })),
    origen,
  );
}

async function obtenerObraPorNombre(identidad: Identidad, nombre: string, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");
  if (!identidad.empresaId) return error("El usuario no tiene una empresa asociada.", origen, 409);

  const { data, error: err } = await db()
    .from("obras")
    .select("id, nombre, estado")
    .eq("nombre", nombre)
    .eq("empresa_id", identidad.empresaId)
    .maybeSingle();
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  if (!data) return error("Obra no encontrada", origen, 404);

  await exigirAccesoObra(identidad, data.id);
  return json(data, origen);
}

async function listarPresupuestos(identidad: Identidad, obraId: string, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");
  await exigirAccesoObra(identidad, obraId);

  const { data, error: err } = await db()
    .from("presupuestos")
    .select(
      `id, numero, nombre, vigente, carpeta_id,
       estado:presupuesto_estados ( nombre, es_aprobado ),
       areas ( presupuesto_partidas ( cantidad, precio_unitario_total ) )`,
    )
    .eq("obra_id", obraId)
    .order("numero");
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);

  const filas = (data as unknown as {
    id: string; numero: number; nombre: string; vigente: boolean; carpeta_id: string | null;
    estado: { nombre: string; es_aprobado: boolean };
    areas: { presupuesto_partidas: { cantidad: number; precio_unitario_total: number }[] }[];
  }[]).map((p) => ({
    id: p.id,
    numero: p.numero,
    nombre: p.nombre,
    estado: p.estado.nombre,
    estadoEsAprobado: p.estado.es_aprobado,
    vigente: p.vigente,
    carpeta_id: p.carpeta_id,
    total: sumarTotal([{ areas: p.areas }]),
  }));

  return json(filas, origen);
}

async function listarCarpetas(identidad: Identidad, obraId: string, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");
  await exigirAccesoObra(identidad, obraId);

  const { data, error: err } = await db()
    .from("presupuesto_carpetas")
    .select("id, nombre, parent_id")
    .eq("obra_id", obraId);
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  return json(data, origen);
}

// ---------- un presupuesto puntual ----------

async function obtenerPresupuestoDetalle(identidad: Identidad, id: string, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");

  const { data, error: err } = await db()
    .from("presupuestos")
    .select(
      `id, numero, nombre, vigente, descripcion, categoria, pie_firma, obra_id,
       imprevistos_pct, gastos_generales_pct, utilidad_pct, iva_pct, credito_iva_pct,
       incluir_pct_en_pu, presupuesto_original_id,
       estado:presupuesto_estados ( nombre, es_aprobado ),
       cliente:personas ( nombre_legal, nombre_comercial )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  if (!data) return error("Presupuesto no encontrado", origen, 404);

  await exigirAccesoObra(identidad, data.obra_id as string);

  const bruto = data as unknown as { estado: { nombre: string; es_aprobado: boolean }; [k: string]: unknown };
  return json({ ...bruto, estado: bruto.estado.nombre, estadoEsAprobado: bruto.estado.es_aprobado }, origen);
}

async function listarAreasYPartidas(identidad: Identidad, presupuestoId: string, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");

  const obraId = await obraDePresupuesto(presupuestoId);
  if (!obraId) return error("Presupuesto no encontrado", origen, 404);
  await exigirAccesoObra(identidad, obraId);

  const { data, error: err } = await db()
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
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);

  const filas = (data as unknown as {
    id: string; codigo: string; nombre: string; item: string | null; unidad: string; cantidad: number;
    grupos: { orden: number; [k: string]: unknown }[];
    presupuesto_partidas: { id: string; grupo_id: string | null; cantidad: number; precio_unitario_total: number; partida: unknown }[];
  }[]).map((a) => ({
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

  return json(filas, origen);
}

// ---------- comparacion Original-Trabajo ----------

async function cargarAreasParaComparacion(presupuestoId: string) {
  const { data, error: err } = await db()
    .from("areas")
    .select("codigo, nombre, unidad, cantidad, presupuesto_partidas ( cantidad, precio_unitario_total )")
    .eq("presupuesto_id", presupuestoId);
  if (err) throw new Error(err.message);

  const mapa = new Map<string, { nombre: string; unidad: string; cantidad: number; total: number }>();
  for (const area of data as unknown as {
    codigo: string; nombre: string; unidad: string; cantidad: number;
    presupuesto_partidas: { cantidad: number; precio_unitario_total: number }[];
  }[]) {
    const total = area.presupuesto_partidas.reduce((t, pp) => t + Number(pp.cantidad) * Number(pp.precio_unitario_total), 0);
    mapa.set(area.codigo, { nombre: area.nombre, unidad: area.unidad, cantidad: Number(area.cantidad), total });
  }
  return mapa;
}

async function obtenerComparacionOriginalTrabajo(
  identidad: Identidad,
  presupuestoTrabajoId: string,
  origen: string | null,
): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");

  const { data: trabajo, error: errTrabajo } = await db()
    .from("presupuestos")
    .select("id, numero, nombre, presupuesto_original_id, obra_id")
    .eq("id", presupuestoTrabajoId)
    .maybeSingle();
  if (errTrabajo) return error(`No se pudo leer: ${errTrabajo.message}`, origen, 500);
  if (!trabajo) return error("Presupuesto no encontrado", origen, 404);

  await exigirAccesoObra(identidad, trabajo.obra_id as string);

  if (!trabajo.presupuesto_original_id) {
    return error("Este presupuesto no tiene una version original asociada.", origen);
  }

  const { data: original, error: errOriginal } = await db()
    .from("presupuestos")
    .select("id, numero, nombre")
    .eq("id", trabajo.presupuesto_original_id)
    .single();
  if (errOriginal) return error(`No se pudo leer: ${errOriginal.message}`, origen, 500);

  const [mapaOriginal, mapaTrabajo] = await Promise.all([
    cargarAreasParaComparacion(original.id),
    cargarAreasParaComparacion(presupuestoTrabajoId),
  ]);

  const codigos = new Set([...mapaOriginal.keys(), ...mapaTrabajo.keys()]);
  const areas = [...codigos].sort().map((codigo) => {
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

  return json(
    {
      original: { id: original.id, numero: original.numero, nombre: original.nombre },
      trabajo: { id: trabajo.id, numero: trabajo.numero, nombre: trabajo.nombre },
      areas,
      totalOriginal: areas.reduce((t, a) => t + (a.totalOriginal ?? 0), 0),
      totalTrabajo: areas.reduce((t, a) => t + (a.totalTrabajo ?? 0), 0),
    },
    origen,
  );
}

// ---------- gate de Inicio de Partida ----------

async function obtenerEstadoInicioPartida(
  identidad: Identidad,
  presupuestoPartidaId: string,
  origen: string | null,
): Promise<Response | { resultado: Record<string, unknown> }> {
  await exigirPermiso(identidad, "presupuesto", "ver");

  const { data, error: err } = await db()
    .from("presupuesto_partidas")
    .select(
      `id, cantidad, precio_unitario_total, iniciada, iniciada_en, autorizacion_motivo, partida_id,
       area:areas ( codigo, presupuesto_id, presupuesto:presupuestos ( obra_id, presupuesto_original_id ) )`,
    )
    .eq("id", presupuestoPartidaId)
    .maybeSingle();
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);
  if (!data) return error("Partida no encontrada", origen, 404);

  const raw = data as unknown as {
    id: string; cantidad: number; precio_unitario_total: number; iniciada: boolean;
    iniciada_en: string | null; autorizacion_motivo: string | null; partida_id: string;
    area: { codigo: string; presupuesto_id: string; presupuesto: { obra_id: string; presupuesto_original_id: string | null } | { obra_id: string; presupuesto_original_id: string | null }[] };
  };
  const areaPresupuesto = Array.isArray(raw.area.presupuesto) ? raw.area.presupuesto[0] : raw.area.presupuesto;

  await exigirAccesoObra(identidad, areaPresupuesto.obra_id);

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
    return { resultado: { ...base, disponible: false, totalOriginal: null, sobrecosto: false } };
  }

  const { data: areaOriginal, error: errArea } = await db()
    .from("areas")
    .select("id")
    .eq("presupuesto_id", originalId)
    .eq("codigo", raw.area.codigo)
    .maybeSingle();
  if (errArea) return error(`No se pudo leer: ${errArea.message}`, origen, 500);

  let totalOriginal: number | null = null;
  if (areaOriginal) {
    const { data: ppOriginal, error: errPP } = await db()
      .from("presupuesto_partidas")
      .select("cantidad, precio_unitario_total")
      .eq("area_id", areaOriginal.id)
      .eq("partida_id", raw.partida_id)
      .maybeSingle();
    if (errPP) return error(`No se pudo leer: ${errPP.message}`, origen, 500);
    if (ppOriginal) totalOriginal = Number(ppOriginal.cantidad) * Number(ppOriginal.precio_unitario_total);
  }

  return {
    resultado: {
      ...base,
      disponible: totalOriginal !== null,
      totalOriginal,
      sobrecosto: totalOriginal !== null && totalTrabajo > totalOriginal,
    },
  };
}

// ---------- detalle de una partida (APU) ----------

async function obtenerPartidaDetalle(identidad: Identidad, id: string, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");

  const obraId = await obraDePartida(id);
  if (!obraId) return error("Partida no encontrada", origen, 404);
  await exigirAccesoObra(identidad, obraId);

  const { data, error: err } = await db()
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
    .eq("id", id)
    .single();
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);

  const bruto = data as unknown as {
    recursos: { tipo_porcentaje: { nombre: string } | null; recurso: { codigo: string; nombre: string; tipo_costo: string }; [k: string]: unknown }[];
    [k: string]: unknown;
  };

  return json(
    {
      ...bruto,
      recursos: bruto.recursos.map((r) => ({
        codigo: r.recurso.codigo,
        nombre: r.recurso.nombre,
        tipo_costo: r.recurso.tipo_costo,
        rendimiento: r.rendimiento,
        factor: Number(r.factor as number),
        cantidad: r.cantidad,
        precio_unitario: r.precio_unitario,
        porcentaje: r.porcentaje === null ? null : Number(r.porcentaje as number),
        tipo_porcentaje: r.tipo_porcentaje?.nombre ?? null,
        comentario: r.comentario,
        sugerido_por_agente: r.sugerido_por_agente,
        agente_meta: r.agente_meta,
      })),
    },
    origen,
  );
}

// ---------- iniciar partida (unica escritura del modulo) ----------

async function iniciarPartida(identidad: Identidad, req: Request, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "aprobar");

  const cuerpo = await req.json().catch(() => null);
  const presupuestoPartidaId = String(cuerpo?.presupuestoPartidaId ?? "");
  const motivo = String(cuerpo?.motivo ?? "").trim();
  if (!presupuestoPartidaId) return error("Falta presupuestoPartidaId", origen);

  const obraId = await obraDePartida(presupuestoPartidaId);
  if (!obraId) return error("Partida no encontrada", origen, 404);
  await exigirAccesoObra(identidad, obraId);

  const estado = await obtenerEstadoInicioPartida(identidad, presupuestoPartidaId, origen);
  if (estado instanceof Response) return estado;
  const sobrecosto = estado.resultado.sobrecosto as boolean;

  if (sobrecosto && !motivo) {
    return error(
      "Esta partida cuesta más en Trabajo que en el Original: se requiere un motivo de autorización antes de iniciarla.",
      origen,
    );
  }

  const { error: err } = await db()
    .from("presupuesto_partidas")
    .update({
      iniciada: true,
      iniciada_en: new Date().toISOString(),
      autorizacion_motivo: sobrecosto ? motivo : null,
    })
    .eq("id", presupuestoPartidaId);
  if (err) return error(`No se pudo iniciar la partida: ${err.message}`, origen, 500);

  return json({ ok: "Partida iniciada." }, origen);
}

// ---------- vistas obra-completa ----------

async function listarPartidasObra(identidad: Identidad, obraId: string, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");
  await exigirAccesoObra(identidad, obraId);

  const { data, error: err } = await db()
    .from("presupuestos")
    .select(
      `id, numero,
       areas ( codigo, nombre,
         presupuesto_partidas ( id, cantidad, precio_unitario_total,
           partida:partidas ( codigo, nombre, unidad ) ) )`,
    )
    .eq("obra_id", obraId)
    .order("numero");
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);

  const filas: Record<string, unknown>[] = [];
  for (const presupuesto of data as unknown as {
    id: string; numero: number;
    areas: { codigo: string; nombre: string; presupuesto_partidas: { id: string; cantidad: number; precio_unitario_total: number; partida: unknown }[] }[];
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
  return json(filas, origen);
}

async function listarPresupuestosConOriginal(
  identidad: Identidad,
  obraId: string,
  origen: string | null,
): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");
  await exigirAccesoObra(identidad, obraId);

  const { data, error: err } = await db()
    .from("presupuestos")
    .select("id, numero, nombre, original:presupuesto_original_id ( numero )")
    .eq("obra_id", obraId)
    .not("presupuesto_original_id", "is", null)
    .order("numero");
  if (err) return error(`No se pudo leer: ${err.message}`, origen, 500);

  const filas = (data as unknown as { id: string; numero: number; nombre: string; original: { numero: number } | null }[])
    .filter((p) => p.original !== null)
    .map((p) => ({ id: p.id, numero: p.numero, nombre: p.nombre, originalNumero: p.original!.numero }));

  return json(filas, origen);
}

async function listarAreasConPartidasGate(presupuestoId: string) {
  const { data, error: err } = await db()
    .from("areas")
    .select(
      `codigo,
       presupuesto_partidas ( id, partida_id, cantidad, precio_unitario_total, iniciada, iniciada_en,
         partida:partidas ( codigo, nombre ) )`,
    )
    .eq("presupuesto_id", presupuestoId);
  if (err) throw new Error(err.message);
  return data as unknown as {
    codigo: string;
    presupuesto_partidas: { id: string; partida_id: string; cantidad: number; precio_unitario_total: number; iniciada: boolean; iniciada_en: string | null; partida: unknown }[];
  }[];
}

async function listarEstadoInicioObra(identidad: Identidad, obraId: string, origen: string | null): Promise<Response> {
  await exigirPermiso(identidad, "presupuesto", "ver");
  await exigirAccesoObra(identidad, obraId);

  const respuestaTrabajos = await listarPresupuestosConOriginal(identidad, obraId, origen);
  const trabajos = (await respuestaTrabajos.json()) as { id: string; numero: number }[];
  if (trabajos.length === 0) return json([], origen);

  const { data: presupuestosTrabajo, error: errTrabajo } = await db()
    .from("presupuestos")
    .select("id, presupuesto_original_id")
    .in("id", trabajos.map((t) => t.id));
  if (errTrabajo) return error(`No se pudo leer: ${errTrabajo.message}`, origen, 500);

  const originalIdDe = new Map(
    (presupuestosTrabajo as { id: string; presupuesto_original_id: string }[]).map((p) => [p.id, p.presupuesto_original_id]),
  );

  const filas: Record<string, unknown>[] = [];

  for (const trabajo of trabajos) {
    const originalId = originalIdDe.get(trabajo.id);
    if (!originalId) continue;

    const [areasTrabajo, areasOriginal] = await Promise.all([
      listarAreasConPartidasGate(trabajo.id),
      listarAreasConPartidasGate(originalId),
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

  return json(filas, origen);
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
    const partes = url.pathname.replace(/^\/presupuesto/, "").split("/").filter(Boolean);

    try {
      // /obras...
      if (partes[0] === "obras" && partes.length === 1 && req.method === "GET") {
        return await listarObras(identidad, origen);
      }
      if (partes[0] === "obras" && partes[1] === "por-nombre" && partes.length === 3 && req.method === "GET") {
        return await obtenerObraPorNombre(identidad, decodeURIComponent(partes[2]), origen);
      }
      if (partes[0] === "obras" && partes.length === 3 && partes[2] === "presupuestos" && req.method === "GET") {
        return await listarPresupuestos(identidad, partes[1], origen);
      }
      if (partes[0] === "obras" && partes.length === 3 && partes[2] === "carpetas" && req.method === "GET") {
        return await listarCarpetas(identidad, partes[1], origen);
      }
      if (partes[0] === "obras" && partes.length === 3 && partes[2] === "partidas" && req.method === "GET") {
        return await listarPartidasObra(identidad, partes[1], origen);
      }
      if (partes[0] === "obras" && partes.length === 3 && partes[2] === "presupuestos-con-original" && req.method === "GET") {
        return await listarPresupuestosConOriginal(identidad, partes[1], origen);
      }
      if (partes[0] === "obras" && partes.length === 3 && partes[2] === "estado-inicio" && req.method === "GET") {
        return await listarEstadoInicioObra(identidad, partes[1], origen);
      }

      // /partidas/:id/...  (antes de /:id generico, para no confundir rutas)
      if (partes[0] === "partidas" && partes.length === 2 && req.method === "GET") {
        return await obtenerPartidaDetalle(identidad, partes[1], origen);
      }
      if (partes[0] === "partidas" && partes.length === 3 && partes[2] === "estado-inicio" && req.method === "GET") {
        const r = await obtenerEstadoInicioPartida(identidad, partes[1], origen);
        return r instanceof Response ? r : json(r.resultado, origen);
      }
      if (partes[0] === "partidas" && partes.length === 3 && partes[2] === "iniciar" && req.method === "PUT") {
        return await iniciarPartida(identidad, req, origen);
      }

      // /:id y /:id/...
      if (partes.length === 1 && req.method === "GET") {
        return await obtenerPresupuestoDetalle(identidad, partes[0], origen);
      }
      if (partes.length === 2 && partes[1] === "areas" && req.method === "GET") {
        return await listarAreasYPartidas(identidad, partes[0], origen);
      }
      if (partes.length === 2 && partes[1] === "comparacion" && req.method === "GET") {
        return await obtenerComparacionOriginalTrabajo(identidad, partes[0], origen);
      }
    } catch (e) {
      if (e instanceof SinPermiso) return error(e.message, origen, 403);
      throw e;
    }

    return error("Ruta no encontrada", origen, 404);
  })
);
