import Link from "next/link";
import { AgentCallout } from "@/features/erp/AgentCallout";
import { formatoMoneda } from "@/features/erp/format";
import { obtenerPartidaDetalle } from "@/lib/supabase/presupuesto";

export default async function PartidaDetallePage({
  params,
}: {
  params: Promise<{ id: string; partidaId: string }>;
}) {
  const { id, partidaId } = await params;
  const partida = await obtenerPartidaDetalle(partidaId);
  const sugerencia = partida.recursos.find((r) => r.sugerido_por_agente);

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>{partida.partida.nombre}</h1>
        <span className="erp-crumb">
          <Link href="/erp/presupuesto">Presupuesto</Link> /{" "}
          <Link href={`/erp/presupuesto/${id}`}>Áreas</Link> / Partida {partida.partida.codigo}
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
            <div className="label">Imprevistos</div>
            <div className="value num">{partida.imprevistos_pct}%</div>
          </div>
          <div className="erp-tstat">
            <div className="label">Gastos generales</div>
            <div className="value num">{partida.gastos_generales_pct}%</div>
          </div>
          <div className="erp-tstat">
            <div className="label">Utilidad</div>
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

      <div className="erp-panel">
        <div className="erp-panel-head">
          <h3>Recursos de la partida</h3>
          <span className="erp-crumb">{partida.recursos.length} líneas</span>
        </div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Código</th>
                <th>Nombre</th>
                <th className="num">Rend.</th>
                <th className="num">Cantidad</th>
                <th className="num">P. Unit.</th>
              </tr>
            </thead>
            <tbody>
              {partida.recursos.map((recurso) => (
                <tr key={recurso.codigo} className={recurso.sugerido_por_agente ? "suggested" : undefined}>
                  <td>{recurso.tipo_costo}</td>
                  <td className="mono">{recurso.codigo}</td>
                  <td>
                    {recurso.nombre}
                    {recurso.sugerido_por_agente && <span className="erp-tag-agent">agente</span>}
                  </td>
                  <td className="num">{recurso.rendimiento}</td>
                  <td className="num">{recurso.cantidad}</td>
                  <td className="num">{formatoMoneda(recurso.precio_unitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
