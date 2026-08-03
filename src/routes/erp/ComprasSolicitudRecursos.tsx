import { Link } from "react-router-dom";
import { listarSolicitudesRecursos } from "@/lib/supabase/compras";
import { obtenerObraPorNombre } from "@/lib/supabase/presupuesto";
import { estadoAprobacionClase, estadoAprobacionLabel, estadoDocumentoClase, estadoDocumentoLabel } from "@/features/erp/format";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function SolicitudRecursosPage() {
  const { datos, cargando, error } = useAsync(async () => {
    const obra = await obtenerObraPorNombre("Obra Miramar");
    return listarSolicitudesRecursos(obra.id);
  }, []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  const solicitudes = datos ?? [];

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Solicitud de Recursos</h1>
        <span className="erp-crumb">
          <Link to="/erp/compras">Compras</Link> › Solicitud de Recursos
        </span>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn" disabled>
          + Nueva solicitud
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
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td className="mono">
                    <Link to={`/erp/compras/solicitud-recursos/${s.id}`}>{s.numero}</Link>
                  </td>
                  <td>{s.f_emision}</td>
                  <td>{s.descripcion ?? ""}</td>
                  <td>{s.solicita ?? ""}</td>
                  <td>
                    <span className={`erp-pill ${estadoDocumentoClase(s.estado)}`}>
                      {estadoDocumentoLabel(s.estado)}
                    </span>
                  </td>
                  <td>
                    <span className={`erp-pill ${estadoAprobacionClase(s.estado_aprobacion)}`}>
                      {estadoAprobacionLabel(s.estado_aprobacion)}
                    </span>
                  </td>
                </tr>
              ))}
              {solicitudes.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--ink-soft)" }}>
                    Todavía no hay solicitudes de recursos cargadas.
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
