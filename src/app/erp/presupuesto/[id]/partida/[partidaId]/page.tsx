import Link from "next/link";
import { AgentCallout } from "@/features/erp/AgentCallout";
import { IniciarPartida } from "@/features/erp/IniciarPartida";
import { formatoMoneda } from "@/features/erp/format";
import { obtenerEstadoInicioPartida, obtenerPartidaDetalle } from "@/lib/supabase/presupuesto";
import { iniciarPartida } from "./actions";

const TIPO_COSTO_LABEL: Record<string, string> = {
  material: "Material",
  mano_de_obra: "Mano de obra",
  subcontrato: "Subcontrato",
  maquinaria: "Maquinaria",
  servicio: "Servicio",
  herramienta: "Herramienta",
  otros: "Otros",
};

export default async function PartidaDetallePage({
  params,
}: {
  params: Promise<{ id: string; partidaId: string }>;
}) {
  const { id, partidaId } = await params;
  const [partida, estadoInicio] = await Promise.all([
    obtenerPartidaDetalle(partidaId),
    obtenerEstadoInicioPartida(partidaId),
  ]);
  const sugerencia = partida.recursos.find((r) => r.sugerido_por_agente);

  // desglose de costo por tipo de recurso (patrón "Totales" del APU de referencia)
  const totalLinea = (r: (typeof partida.recursos)[number]) =>
    Number(r.cantidad) * Number(r.precio_unitario) * (1 + (r.porcentaje ?? 0) / 100);
  const sumaApu = partida.recursos.reduce((t, r) => t + totalLinea(r), 0);
  const porTipo = [...new Set(partida.recursos.map((r) => r.tipo_costo))].map((tipo) => {
    const total = partida.recursos
      .filter((r) => r.tipo_costo === tipo)
      .reduce((t, r) => t + totalLinea(r), 0);
    return { tipo, total, pct: sumaApu > 0 ? (total / sumaApu) * 100 : 0 };
  });

  const etiquetaPct = (manual: boolean) => (manual ? " (manual)" : "");

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>{partida.partida.nombre}</h1>
        <span className="erp-crumb">
          <Link href="/erp/presupuesto">Presupuesto</Link> /{" "}
          <Link href={`/erp/presupuesto/${id}`}>Detalle</Link> / Partida {partida.partida.codigo}
        </span>
      </div>

      <div className="erp-apu-head">
        <div className="erp-apu-title">
          <h2>Análisis de precio unitario</h2>
          <span className="erp-apu-code">
            Código {partida.partida.codigo} · Unidad {partida.partida.unidad}
          </span>
        </div>
        <div className="erp-totals-strip">
          <div className="erp-tstat">
            <div className="label">Imprevistos{etiquetaPct(partida.imprevistos_manual)}</div>
            <div className="value num">{partida.imprevistos_pct}%</div>
          </div>
          <div className="erp-tstat">
            <div className="label">G. generales{etiquetaPct(partida.gastos_generales_manual)}</div>
            <div className="value num">{partida.gastos_generales_pct}%</div>
          </div>
          <div className="erp-tstat">
            <div className="label">Utilidad{etiquetaPct(partida.utilidad_manual)}</div>
            <div className="value num">{partida.utilidad_pct}%</div>
          </div>
          <div className="erp-tstat">
            <div className="label">Cantidad</div>
            <div className="value num">{partida.cantidad}</div>
          </div>
          <div className="erp-tstat">
            <div className="label">Total P.U.</div>
            <div className="value total num">{formatoMoneda(partida.precio_unitario_total)}</div>
          </div>
        </div>
      </div>

      {sugerencia && (
        <AgentCallout
          recursoNombre={sugerencia.nombre}
          ahorroPct={
            typeof sugerencia.agente_meta?.ahorro_pct === "number"
              ? sugerencia.agente_meta.ahorro_pct
              : undefined
          }
          proveedoresComparados={
            typeof sugerencia.agente_meta?.proveedores_comparados === "number"
              ? sugerencia.agente_meta.proveedores_comparados
              : undefined
          }
        />
      )}

      <IniciarPartida
        accion={iniciarPartida}
        presupuestoId={id}
        presupuestoPartidaId={partidaId}
        disponible={estadoInicio.disponible}
        iniciada={estadoInicio.iniciada}
        iniciadaEn={estadoInicio.iniciadaEn}
        autorizacionMotivo={estadoInicio.autorizacionMotivo}
        totalOriginal={estadoInicio.totalOriginal}
        totalTrabajo={estadoInicio.totalTrabajo}
        sobrecosto={estadoInicio.sobrecosto}
      />

      <div className="erp-panel erp-subpanel">
        <div className="erp-panel-head">
          <h3>Recursos de la partida</h3>
          <span className="erp-crumb">{partida.recursos.length} líneas</span>
        </div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo costo</th>
                <th>Código</th>
                <th>Nombre</th>
                <th className="num">Rend.</th>
                <th className="num">Factor</th>
                <th className="num">Cantidad</th>
                <th className="num">P. Unit.</th>
                <th>Tipo %</th>
                <th className="num">%</th>
              </tr>
            </thead>
            <tbody>
              {partida.recursos.map((recurso) => (
                <tr key={recurso.codigo} className={recurso.sugerido_por_agente ? "suggested" : undefined}>
                  <td>{TIPO_COSTO_LABEL[recurso.tipo_costo] ?? recurso.tipo_costo}</td>
                  <td className="mono">{recurso.codigo}</td>
                  <td>
                    {recurso.nombre}
                    {recurso.comentario && (
                      <span className="erp-crumb"> — {recurso.comentario}</span>
                    )}
                    {recurso.sugerido_por_agente && <span className="erp-tag-agent">agente</span>}
                  </td>
                  <td className="num">{recurso.rendimiento}</td>
                  <td className="num">{recurso.factor}</td>
                  <td className="num">{recurso.cantidad}</td>
                  <td className="num">{formatoMoneda(recurso.precio_unitario)}</td>
                  <td>{recurso.tipo_porcentaje ?? ""}</td>
                  <td className="num">{recurso.porcentaje !== null ? `${recurso.porcentaje}%` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="erp-panel">
        <div className="erp-panel-head">
          <h3>Totales por tipo de costo</h3>
        </div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo de costo</th>
                <th className="num">Total</th>
                <th className="num">%</th>
              </tr>
            </thead>
            <tbody>
              {porTipo.map(({ tipo, total, pct }) => (
                <tr key={tipo}>
                  <td>{TIPO_COSTO_LABEL[tipo] ?? tipo}</td>
                  <td className="num">{formatoMoneda(total)}</td>
                  <td className="num">{pct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
