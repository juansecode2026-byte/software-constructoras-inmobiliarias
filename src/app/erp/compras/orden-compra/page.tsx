import Link from "next/link";
import { listarOrdenesCompra } from "@/lib/supabase/compras";
import { obtenerObraPorNombre } from "@/lib/supabase/presupuesto";
import { estadoAprobacionClase, estadoAprobacionLabel, estadoDocumentoClase, estadoDocumentoLabel, formatoMoneda } from "@/features/erp/format";

export default async function OrdenCompraPage() {
  const obra = await obtenerObraPorNombre("Obra Miramar");
  const ordenes = await listarOrdenesCompra(obra.id);

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Orden de Compra</h1>
        <span className="erp-crumb">
          <Link href="/erp/compras">Compras</Link> › Orden de Compra
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
                    <Link href={`/erp/compras/orden-compra/${o.id}`}>{o.numero}</Link>
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
