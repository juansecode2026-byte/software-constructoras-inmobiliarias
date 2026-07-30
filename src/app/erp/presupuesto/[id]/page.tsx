import Link from "next/link";
import {
  listarAreasYPartidas,
  obtenerPresupuestoDetalle,
  type AreaConPartidas,
  type GrupoFila,
  type PartidaEnAreaFila,
} from "@/lib/supabase/presupuesto";
import { formatoMoneda, estadoPresupuestoLabel, estadoPresupuestoClase } from "@/features/erp/format";

interface FilaArbol {
  key: string;
  tipo: "area" | "grupo" | "titulo" | "partida";
  nivel: number;
  codigo: string | null;
  item: string | null;
  nombre: string;
  unidad: string | null;
  cantidad: number | null;
  total: number | null;
  href?: string;
}

// Aplana área → grupos anidados → partidas en filas con nivel de indentación.
// El subtotal de un grupo se calcula al vuelo sumando sus partidas (y las de
// sus subgrupos): los grupos son visuales, el control vive en área/partida.
function filasDeArea(area: AreaConPartidas, presupuestoId: string): FilaArbol[] {
  const filas: FilaArbol[] = [];

  const totalPartida = (p: PartidaEnAreaFila) => p.cantidad * p.precioUnitarioTotal;

  const totalGrupo = (grupoId: string): number => {
    const propio = area.partidas
      .filter((p) => p.grupoId === grupoId)
      .reduce((t, p) => t + totalPartida(p), 0);
    const hijos = area.grupos
      .filter((g) => g.parent_id === grupoId)
      .reduce((t, g) => t + totalGrupo(g.id), 0);
    return propio + hijos;
  };

  const filaPartida = (p: PartidaEnAreaFila, nivel: number): FilaArbol => ({
    key: p.presupuestoPartidaId,
    tipo: "partida",
    nivel,
    codigo: p.partida.codigo,
    item: null,
    nombre: p.partida.nombre,
    unidad: p.partida.unidad,
    cantidad: p.cantidad,
    total: totalPartida(p),
    href: `/erp/presupuesto/${presupuestoId}/partida/${p.presupuestoPartidaId}`,
  });

  const recorrerGrupo = (grupo: GrupoFila, nivel: number) => {
    filas.push({
      key: grupo.id,
      tipo: grupo.tipo,
      nivel,
      codigo: grupo.codigo,
      item: grupo.item,
      nombre: grupo.nombre,
      unidad: null,
      cantidad: null,
      total: grupo.tipo === "grupo" ? totalGrupo(grupo.id) : null,
    });
    for (const p of area.partidas.filter((x) => x.grupoId === grupo.id)) {
      filas.push(filaPartida(p, nivel + 1));
    }
    for (const sub of area.grupos.filter((g) => g.parent_id === grupo.id)) {
      recorrerGrupo(sub, nivel + 1);
    }
  };

  const totalArea =
    area.partidas.reduce((t, p) => t + totalPartida(p), 0);

  filas.push({
    key: area.id,
    tipo: "area",
    nivel: 0,
    codigo: area.codigo,
    item: area.item,
    nombre: area.nombre,
    unidad: area.unidad,
    cantidad: area.cantidad,
    total: totalArea,
  });

  for (const p of area.partidas.filter((x) => x.grupoId === null)) {
    filas.push(filaPartida(p, 1));
  }
  for (const g of area.grupos.filter((x) => x.parent_id === null)) {
    recorrerGrupo(g, 1);
  }

  return filas;
}

const TIPO_LABEL: Record<FilaArbol["tipo"], string> = {
  area: "ÁREA",
  grupo: "GRUPO",
  titulo: "TÍTULO",
  partida: "PARTIDA",
};

export default async function PresupuestoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [presupuesto, areas] = await Promise.all([
    obtenerPresupuestoDetalle(id),
    listarAreasYPartidas(id),
  ]);

  const filas = areas.flatMap((a) => filasDeArea(a, id));

  const suma = filas
    .filter((f) => f.tipo === "area")
    .reduce((t, f) => t + (f.total ?? 0), 0);
  const imprevistos = (suma * presupuesto.imprevistos_pct) / 100;
  const gastosGenerales = (suma * presupuesto.gastos_generales_pct) / 100;
  const utilidad = (suma * presupuesto.utilidad_pct) / 100;
  const neto = suma + imprevistos + gastosGenerales + utilidad;
  const iva = (neto * presupuesto.iva_pct) / 100;
  const total = neto + iva;

  const clienteNombre =
    presupuesto.cliente?.nombre_comercial ?? presupuesto.cliente?.nombre_legal ?? null;

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <div>
          <h1>
            Nº {presupuesto.numero} · {presupuesto.nombre}
          </h1>
          <span className="erp-crumb">
            <Link href="/erp/presupuesto">Presupuesto</Link> › detalle
          </span>
        </div>
        <span className={`erp-pill ${estadoPresupuestoClase(presupuesto.estado)}`}>
          {estadoPresupuestoLabel(presupuesto.estado)}
        </span>
      </div>

      <div className="erp-apu-head">
        <div className="erp-apu-title">
          <h2>Totales del presupuesto</h2>
          <span className="erp-apu-code">
            {clienteNombre ? `Cliente: ${clienteNombre}` : "Sin cliente asignado"}
            {presupuesto.categoria ? ` · ${presupuesto.categoria}` : ""}
          </span>
        </div>
        <div className="erp-totals-strip">
          <div className="erp-tstat">
            <div className="label">Suma</div>
            <div className="value num">{formatoMoneda(suma)}</div>
          </div>
          <div className="erp-tstat">
            <div className="label">Imprevistos {presupuesto.imprevistos_pct}%</div>
            <div className="value num">{formatoMoneda(imprevistos)}</div>
          </div>
          <div className="erp-tstat">
            <div className="label">G. generales {presupuesto.gastos_generales_pct}%</div>
            <div className="value num">{formatoMoneda(gastosGenerales)}</div>
          </div>
          <div className="erp-tstat">
            <div className="label">Utilidad {presupuesto.utilidad_pct}%</div>
            <div className="value num">{formatoMoneda(utilidad)}</div>
          </div>
          <div className="erp-tstat">
            <div className="label">IVA {presupuesto.iva_pct}%</div>
            <div className="value num">{formatoMoneda(iva)}</div>
          </div>
          <div className="erp-tstat">
            <div className="label">Total</div>
            <div className="value total num">{formatoMoneda(total)}</div>
          </div>
        </div>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn ghost small">+ Área</button>
        <button type="button" className="erp-btn ghost small">+ Grupo</button>
        <button type="button" className="erp-btn ghost small">+ Partida</button>
        <button type="button" className="erp-btn ghost small">Importar desde Excel</button>
        <button type="button" className="erp-btn" disabled>Grabar todos</button>
      </div>

      <div className="erp-panel">
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Ítem</th>
                <th>Nombre</th>
                <th>Unidad</th>
                <th className="num">Cantidad</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.key} className={`arbol-${fila.tipo}`}>
                  <td className="mono">{fila.codigo ?? ""}</td>
                  <td className="arbol-tipo">{TIPO_LABEL[fila.tipo]}</td>
                  <td className="mono">{fila.item ?? ""}</td>
                  <td style={{ paddingLeft: `${0.7 + fila.nivel * 1.2}rem` }}>
                    {fila.href ? <Link href={fila.href}>{fila.nombre}</Link> : fila.nombre}
                  </td>
                  <td>{fila.unidad ?? ""}</td>
                  <td className="num">{fila.cantidad ?? ""}</td>
                  <td className="num">{fila.total !== null ? formatoMoneda(fila.total) : ""}</td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: "var(--ink-soft)" }}>
                    Este presupuesto todavía no tiene áreas cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="erp-note">
        Solo área, partida y recurso son niveles controlables; los grupos y títulos ordenan la
        vista y sus subtotales se calculan al momento. Los botones de edición se habilitarán con
        el flujo Editar/Grabar.
      </p>
    </div>
  );
}
