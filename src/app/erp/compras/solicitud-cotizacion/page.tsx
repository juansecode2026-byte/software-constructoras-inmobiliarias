import Link from "next/link";
import { listarSolicitudesCotizacion } from "@/lib/supabase/compras";
import { obtenerObraPorNombre } from "@/lib/supabase/presupuesto";
import { estadoAprobacionClase, estadoAprobacionLabel, estadoDocumentoClase, estadoDocumentoLabel } from "@/features/erp/format";

export default async function SolicitudCotizacionPage() {
  const obra = await obtenerObraPorNombre("Obra Miramar");
  const cotizaciones = await listarSolicitudesCotizacion(obra.id);

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Solicitud de Cotización</h1>
        <span className="erp-crumb">
          <Link href="/erp/compras">Compras</Link> › Solicitud de Cotización
        </span>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn" disabled>
          + Nueva cotización
        </button>
      </div>

      <div className="erp-panel">
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>F. Emisión</th>
                <th>Descripción</th>
                <th>Solicita</th>
                <th>Estado</th>
                <th>Estado Aprob.</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c) => (
                <tr key={c.id}>
                  <td className="mono">
                    <Link href={`/erp/compras/solicitud-cotizacion/${c.id}`}>{c.numero}</Link>
                  </td>
                  <td>{c.f_emision}</td>
                  <td>{c.descripcion ?? ""}</td>
                  <td>{c.solicita ?? ""}</td>
                  <td>
                    <span className={`erp-pill ${estadoDocumentoClase(c.estado)}`}>
                      {estadoDocumentoLabel(c.estado)}
                    </span>
                  </td>
                  <td>
                    <span className={`erp-pill ${estadoAprobacionClase(c.estado_aprobacion)}`}>
                      {estadoAprobacionLabel(c.estado_aprobacion)}
                    </span>
                  </td>
                </tr>
              ))}
              {cotizaciones.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--ink-soft)" }}>
                    Todavía no hay solicitudes de cotización cargadas.
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
