import { Link } from "react-router-dom";
import { listarOrdenesCompra } from "@/lib/supabase/compras";
import { obtenerObraPorNombre } from "@/lib/supabase/presupuesto";
import { estadoAprobacionClase, estadoAprobacionLabel, estadoDocumentoClase, estadoDocumentoLabel, formatoMoneda } from "@/features/erp/format";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function OrdenCompraPage() {
  const { datos, cargando, error } = useAsync(async () => {
    const obra = await obtenerObraPorNombre("Obra Miramar");
    return listarOrdenesCompra(obra.id);
  }, []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  const ordenes = datos ?? [];

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Orden de Compra</h1>
        <span className="erp-crumb">
          <Link to="/erp/compras">Compras</Link> › Orden de Compra
        </span>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn" disabled>
          + Nueva orden
        </button>
      </div>

      <div className="erp-panel">
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>F. Emisión</th>
                <th>Proveedor</th>
                <th>Descripción</th>
                <th>Enviado Prov.</th>
                <th>Estado</th>
                <th>Estado Aprob.</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id}>
                  <td className="mono">
                    <Link to={`/erp/compras/orden-compra/${o.id}`}>{o.numero}</Link>
                  </td>
                  <td>{o.f_emision}</td>
                  <td>{o.proveedor?.nombre_legal ?? o.proveedor?.nombre_comercial ?? ""}</td>
                  <td>{o.descripcion ?? ""}</td>
                  <td>
                    <span className={`erp-pill ${o.enviado_proveedor ? "aprobado" : "plan"}`}>
                      {o.enviado_proveedor ? "Sí" : "No"}
                    </span>
                  </td>
                  <td>
                    <span className={`erp-pill ${estadoDocumentoClase(o.estado)}`}>
                      {estadoDocumentoLabel(o.estado)}
                    </span>
                  </td>
                  <td>
                    <span className={`erp-pill ${estadoAprobacionClase(o.estado_aprobacion)}`}>
                      {estadoAprobacionLabel(o.estado_aprobacion)}
                    </span>
                  </td>
                  <td className="num">{formatoMoneda(o.total)}</td>
                </tr>
              ))}
              {ordenes.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--ink-soft)" }}>
                    Todavía no hay órdenes de compra cargadas.
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
