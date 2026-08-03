import { Link, useParams } from "react-router-dom";
import { obtenerSolicitudRecursoDetalle } from "@/lib/supabase/compras";
import { estadoAprobacionClase, estadoAprobacionLabel, estadoDocumentoClase, estadoDocumentoLabel } from "@/features/erp/format";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function SolicitudRecursoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { datos: solicitud, cargando, error } = useAsync(
    () => obtenerSolicitudRecursoDetalle(id!),
    [id],
  );

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!solicitud) return null;

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <div>
          <h1>Solicitud de Recursos N° {solicitud.numero}</h1>
          <span className="erp-crumb">
            <Link to="/erp/compras">Compras</Link> ›{" "}
            <Link to="/erp/compras/solicitud-recursos">Solicitud de Recursos</Link> › {solicitud.numero}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className={`erp-pill ${estadoDocumentoClase(solicitud.estado)}`}>
            {estadoDocumentoLabel(solicitud.estado)}
          </span>
          <span className={`erp-pill ${estadoAprobacionClase(solicitud.estado_aprobacion)}`}>
            {estadoAprobacionLabel(solicitud.estado_aprobacion)}
          </span>
        </div>
      </div>

      <div className="erp-apu-head">
        <div className="erp-apu-title">
          <h2>{solicitud.descripcion ?? "Sin descripción"}</h2>
          <span className="erp-apu-code">
            Solicita: {solicitud.solicita ?? "—"} · Emitida el {solicitud.f_emision}
            {solicitud.f_esperada_recepcion ? ` · Esperada el ${solicitud.f_esperada_recepcion}` : ""}
          </span>
        </div>
      </div>

      <div className="erp-panel">
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Unidad</th>
                <th className="num">Cantidad</th>
                <th>Área / Partida</th>
                <th>Urgencia</th>
                <th>Estado</th>
                <th className="num">Cotizado</th>
                <th className="num">Comprado</th>
              </tr>
            </thead>
            <tbody>
              {solicitud.lineas.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.recurso.codigo}</td>
                  <td>{l.recurso.nombre}</td>
                  <td>{l.recurso.unidad_compra}</td>
                  <td className="num">{l.cantidad}</td>
                  <td>
                    {l.area ? `${l.area.codigo} · ${l.partida?.nombre ?? ""}` : "—"}
                  </td>
                  <td>{l.urgencia?.nombre ?? "—"}</td>
                  <td>
                    <span className={`erp-pill ${l.estado === "terminada" ? "aprobado" : "plan"}`}>
                      {l.estado === "terminada" ? "Terminada" : "Pendiente"}
                    </span>
                  </td>
                  <td className="num">{l.cantidad_cotizada}</td>
                  <td className="num">{l.cantidad_comprada}</td>
                </tr>
              ))}
              {solicitud.lineas.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ color: "var(--ink-soft)" }}>
                    Esta solicitud todavía no tiene recursos agregados.
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
