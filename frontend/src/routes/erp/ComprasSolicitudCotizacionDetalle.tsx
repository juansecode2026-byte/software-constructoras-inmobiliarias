import { Link, useParams } from "react-router-dom";
import { obtenerSolicitudCotizacionDetalle } from "@/lib/api/compras";
import { estadoAprobacionClase, estadoAprobacionLabel, estadoDocumentoClase, estadoDocumentoLabel, formatoMoneda } from "@/features/erp/format";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function SolicitudCotizacionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { datos: cotizacion, cargando, error } = useAsync(
    () => obtenerSolicitudCotizacionDetalle(id!),
    [id],
  );

  // el proveedor con el subtotal mas bajo por linea, para resaltarlo en el
  // Cuadro Comparativo (igual que el reporte PDF del video de referencia)
  const mejorIndice = (subtotales: (number | null)[]) => {
    let mejor = -1;
    let mejorValor = Infinity;
    subtotales.forEach((v, i) => {
      if (v !== null && v < mejorValor) {
        mejorValor = v;
        mejor = i;
      }
    });
    return mejor;
  };

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!cotizacion) return null;

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <div>
          <h1>Solicitud de Cotización N° {cotizacion.numero}</h1>
          <span className="erp-crumb">
            <Link to="/erp/compras">Compras</Link> ›{" "}
            <Link to="/erp/compras/solicitud-cotizacion">Solicitud de Cotización</Link> › {cotizacion.numero}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className={`erp-pill ${estadoDocumentoClase(cotizacion.estado)}`}>
            {estadoDocumentoLabel(cotizacion.estado)}
          </span>
          <span className={`erp-pill ${estadoAprobacionClase(cotizacion.estado_aprobacion)}`}>
            {estadoAprobacionLabel(cotizacion.estado_aprobacion)}
          </span>
        </div>
      </div>

      <div className="erp-apu-head">
        <div className="erp-apu-title">
          <h2>{cotizacion.descripcion ?? "Sin descripción"}</h2>
          <span className="erp-apu-code">
            Solicita: {cotizacion.solicita ?? "—"} · Moneda {cotizacion.moneda} · Emitida el{" "}
            {cotizacion.f_emision}
          </span>
        </div>
      </div>

      <div className="erp-panel erp-subpanel">
        <div className="erp-panel-head">
          <h3>Proveedores</h3>
          <span className="erp-crumb">{cotizacion.proveedores.length} invitados</span>
        </div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Atiende</th>
                <th>Forma de pago</th>
                <th>Enviado</th>
              </tr>
            </thead>
            <tbody>
              {cotizacion.proveedores.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.atiende ?? "—"}</td>
                  <td>{p.formaPago ?? "—"}</td>
                  <td>
                    <span className={`erp-pill ${p.enviado ? "aprobado" : "plan"}`}>
                      {p.enviado ? "Sí" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="erp-panel">
        <div className="erp-panel-head">
          <h3>Cuadro Comparativo</h3>
          <span className="erp-crumb">
            Vista calculada — cruza cada recurso contra el precio de cada proveedor
          </span>
        </div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Recurso</th>
                <th>Unidad</th>
                <th className="num">Cantidad</th>
                {cotizacion.proveedores.map((p) => (
                  <th key={p.id} className="num">
                    {p.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cotizacion.cuadroComparativo.map((fila) => {
                const indiceMejor = mejorIndice(fila.subtotales);
                return (
                  <tr key={fila.lineaId}>
                    <td className="mono">{fila.recurso.codigo}</td>
                    <td>{fila.recurso.nombre}</td>
                    <td>{fila.recurso.unidad_compra}</td>
                    <td className="num">{fila.cantidad}</td>
                    {fila.subtotales.map((subtotal, i) => (
                      <td key={i} className="num" style={i === indiceMejor ? { fontWeight: 700 } : undefined}>
                        {subtotal !== null ? formatoMoneda(subtotal) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {cotizacion.cuadroComparativo.length === 0 && (
                <tr>
                  <td colSpan={4 + cotizacion.proveedores.length} style={{ color: "var(--ink-soft)" }}>
                    Esta cotización todavía no tiene recursos agregados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="erp-note">
        El proveedor con el subtotal más bajo por recurso queda en negrita — es la referencia para
        decidir a quién generar la Orden de Compra.
      </p>
    </div>
  );
}
