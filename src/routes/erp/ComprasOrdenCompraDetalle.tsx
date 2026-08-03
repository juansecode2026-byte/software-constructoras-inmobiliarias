import { Link, useParams } from "react-router-dom";
import { obtenerOrdenCompraDetalle } from "@/lib/supabase/compras";
import { estadoAprobacionClase, estadoAprobacionLabel, estadoDocumentoClase, estadoDocumentoLabel, formatoMoneda } from "@/features/erp/format";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function OrdenCompraDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { datos: orden, cargando, error } = useAsync(
    () => obtenerOrdenCompraDetalle(id!),
    [id],
  );

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!orden) return null;

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <div>
          <h1>Orden de Compra N° {orden.numero}</h1>
          <span className="erp-crumb">
            <Link to="/erp/compras">Compras</Link> ›{" "}
            <Link to="/erp/compras/orden-compra">Orden de Compra</Link> › {orden.numero}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className={`erp-pill ${estadoDocumentoClase(orden.estado)}`}>
            {estadoDocumentoLabel(orden.estado)}
          </span>
          <span className={`erp-pill ${estadoAprobacionClase(orden.estado_aprobacion)}`}>
            {estadoAprobacionLabel(orden.estado_aprobacion)}
          </span>
        </div>
      </div>

      <div className="erp-apu-head">
        <div className="erp-apu-title">
          <h2>{orden.proveedor?.nombre_legal ?? orden.proveedor?.nombre_comercial ?? "Sin proveedor"}</h2>
          <span className="erp-apu-code">
            {orden.descripcion ?? "Sin descripción"} · Forma de pago: {orden.formaPago ?? "—"} · Emitida el{" "}
            {orden.f_emision}
            {orden.f_vencimiento ? ` · Vence el ${orden.f_vencimiento}` : ""}
          </span>
        </div>
        <div className="erp-totals-strip">
          <div className="erp-tstat">
            <div className="label">Subtotal</div>
            <div className="value num">{formatoMoneda(orden.subtotal)}</div>
          </div>
          <div className="erp-tstat">
            <div className="label">IVA {orden.iva_pct}%</div>
            <div className="value num">{formatoMoneda(orden.iva)}</div>
          </div>
          <div className="erp-tstat">
            <div className="label">Total</div>
            <div className="value total num">{formatoMoneda(orden.total)}</div>
          </div>
        </div>
      </div>

      <div className="erp-panel">
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Área</th>
                <th className="num">Cantidad</th>
                <th className="num">Precio</th>
                <th className="num">Desc. %</th>
                <th className="num">Subtotal</th>
                <th className="num">Recibido</th>
              </tr>
            </thead>
            <tbody>
              {orden.lineas.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.recurso.codigo}</td>
                  <td>{l.recurso.nombre}</td>
                  <td>{l.area?.codigo ?? "—"}</td>
                  <td className="num">{l.cantidad}</td>
                  <td className="num">{formatoMoneda(l.precio_unitario)}</td>
                  <td className="num">{l.descuento_pct}%</td>
                  <td className="num">{formatoMoneda(l.subtotal)}</td>
                  <td className="num">
                    {l.cantidad_recibida} / {l.cantidad}
                  </td>
                </tr>
              ))}
              {orden.lineas.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--ink-soft)" }}>
                    Esta orden todavía no tiene recursos agregados.
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
