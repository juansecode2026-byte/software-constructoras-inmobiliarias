import Link from "next/link";
import { listarAreasYPartidas } from "@/lib/supabase/presupuesto";
import { formatoMoneda } from "@/features/erp/format";

export default async function AreasDelPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const areas = await listarAreasYPartidas(id);

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Áreas y partidas</h1>
        <span className="erp-crumb">
          <Link href="/erp/presupuesto">Presupuesto</Link>
        </span>
      </div>

      <div className="erp-panel">
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Área</th>
                <th>Partida</th>
                <th>Unidad</th>
                <th className="num">Cantidad</th>
                <th className="num">Total P.U.</th>
              </tr>
            </thead>
            <tbody>
              {areas.flatMap((area) =>
                area.partidas.length > 0 ? (
                  area.partidas.map((p) => (
                    <tr key={p.presupuestoPartidaId}>
                      <td>
                        {area.codigo} · {area.nombre}
                      </td>
                      <td>
                        <Link href={`/erp/presupuesto/${id}/partida/${p.presupuestoPartidaId}`}>
                          {p.partida.nombre}
                        </Link>
                      </td>
                      <td>{p.partida.unidad}</td>
                      <td className="num">{p.cantidad}</td>
                      <td className="num">{formatoMoneda(p.cantidad * p.precioUnitarioTotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr key={area.id}>
                    <td>
                      {area.codigo} · {area.nombre}
                    </td>
                    <td colSpan={4} style={{ color: "var(--ink-soft)" }}>
                      sin partidas cargadas
                    </td>
                  </tr>
                ),
              )}
              {areas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--ink-soft)" }}>
                    Este presupuesto todavía no tiene áreas cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
