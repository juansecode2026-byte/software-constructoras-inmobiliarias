import { Link, useParams } from "react-router-dom";
import { obtenerComparacionOriginalTrabajo } from "@/lib/api/presupuesto";
import { formatoMoneda } from "@/features/erp/format";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function ComparacionPage() {
  const { id } = useParams<{ id: string }>();
  const { datos: comparacion, cargando, error } = useAsync(
    () => obtenerComparacionOriginalTrabajo(id!),
    [id],
  );

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!comparacion) return null;

  const diferenciaTotal = comparacion.totalTrabajo - comparacion.totalOriginal;

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <div>
          <h1>Comparación de Presupuestos (Original-Trabajo)</h1>
          <span className="erp-crumb">
            <Link to="/erp/presupuesto">Presupuesto</Link> ›{" "}
            <Link to={`/erp/presupuesto/${id}`}>Nº {comparacion.trabajo.numero}</Link> › comparación
          </span>
        </div>
      </div>

      <p className="erp-note">
        Nivel Área. Original: Nº {comparacion.original.numero} · {comparacion.original.nombre} — Trabajo: Nº{" "}
        {comparacion.trabajo.numero} · {comparacion.trabajo.nombre}.
      </p>

      <div className="erp-panel">
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th rowSpan={2}>Código</th>
                <th rowSpan={2}>Área</th>
                <th rowSpan={2}>Unidad</th>
                <th colSpan={2} className="num">Presupuesto Original</th>
                <th colSpan={2} className="num">Presupuesto Trabajo</th>
                <th colSpan={2} className="num">Diferencia</th>
              </tr>
              <tr>
                <th className="num">Cantidad</th>
                <th className="num">Total</th>
                <th className="num">Cantidad</th>
                <th className="num">Total</th>
                <th className="num">Cantidad</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {comparacion.areas.map((area) => (
                <tr key={area.codigo}>
                  <td className="mono">{area.codigo}</td>
                  <td>{area.nombre}</td>
                  <td>{area.unidad}</td>
                  <td className="num">{area.cantidadOriginal ?? "—"}</td>
                  <td className="num">
                    {area.totalOriginal !== null ? formatoMoneda(area.totalOriginal) : "—"}
                  </td>
                  <td className="num">{area.cantidadTrabajo ?? "—"}</td>
                  <td className="num">
                    {area.totalTrabajo !== null ? formatoMoneda(area.totalTrabajo) : "—"}
                  </td>
                  <td className="num">{area.diferenciaCantidad ?? "—"}</td>
                  <td className={`num${(area.diferenciaTotal ?? 0) < 0 ? " erp-negativo" : ""}`}>
                    {area.diferenciaTotal !== null ? formatoMoneda(area.diferenciaTotal) : "—"}
                  </td>
                </tr>
              ))}
              {comparacion.areas.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ color: "var(--ink-soft)" }}>
                    Ninguno de los dos presupuestos tiene áreas cargadas todavía.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="num">TOTALES</td>
                <td className="num">{formatoMoneda(comparacion.totalOriginal)}</td>
                <td></td>
                <td className="num">{formatoMoneda(comparacion.totalTrabajo)}</td>
                <td></td>
                <td className={`num${diferenciaTotal < 0 ? " erp-negativo" : ""}`}>
                  {formatoMoneda(diferenciaTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
