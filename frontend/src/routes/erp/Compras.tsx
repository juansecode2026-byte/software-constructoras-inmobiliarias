import { Link } from "react-router-dom";
import { listarOrdenesCompra, listarSolicitudesCotizacion, listarSolicitudesRecursos } from "@/lib/supabase/compras";
import { obtenerObraPorNombre } from "@/lib/supabase/presupuesto";
import { formatoMoneda } from "@/features/erp/format";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function ComprasPage() {
  const { datos, cargando, error } = useAsync(async () => {
    const obra = await obtenerObraPorNombre("Obra Miramar");
    const [solicitudes, cotizaciones, ordenes] = await Promise.all([
      listarSolicitudesRecursos(obra.id),
      listarSolicitudesCotizacion(obra.id),
      listarOrdenesCompra(obra.id),
    ]);
    return { obra, solicitudes, cotizaciones, ordenes };
  }, []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!datos) return null;
  const { obra, solicitudes, cotizaciones, ordenes } = datos;

  const totalComprado = ordenes.reduce((t, o) => t + o.total, 0);

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Compras</h1>
        <span className="erp-crumb">{obra.nombre}</span>
      </div>

      <div className="erp-totals-strip">
        <div className="erp-tstat">
          <div className="label">Solicitudes de Recursos</div>
          <div className="value num">{solicitudes.length}</div>
        </div>
        <div className="erp-tstat">
          <div className="label">Solicitudes de Cotización</div>
          <div className="value num">{cotizaciones.length}</div>
        </div>
        <div className="erp-tstat">
          <div className="label">Órdenes de Compra</div>
          <div className="value num">{ordenes.length}</div>
        </div>
        <div className="erp-tstat">
          <div className="label">Total comprado</div>
          <div className="value total num">{formatoMoneda(totalComprado)}</div>
        </div>
      </div>

      <p className="erp-note">
        Flujo: Solicitud de Recursos (03) → Solicitud de Cotización (04) → Cuadro Comparativo (05,
        calculado dentro de cada cotización) → Orden de Compra (06). Ver{" "}
        <Link to="/erp/presupuesto">Presupuesto</Link> para el origen de cada solicitud.
      </p>

      <div className="erp-list-layout">
        <div className="erp-panel">
          <div className="erp-panel-head">
            <h3>Solicitud de Recursos</h3>
            <Link to="/erp/compras/solicitud-recursos" className="erp-crumb">
              Ver todas
            </Link>
          </div>
          <div className="erp-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Descripción</th>
                  <th>Solicita</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.slice(0, 5).map((s) => (
                  <tr key={s.id}>
                    <td className="mono">
                      <Link to={`/erp/compras/solicitud-recursos/${s.id}`}>{s.numero}</Link>
                    </td>
                    <td>{s.descripcion ?? ""}</td>
                    <td>{s.solicita ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-head">
            <h3>Solicitud de Cotización</h3>
            <Link to="/erp/compras/solicitud-cotizacion" className="erp-crumb">
              Ver todas
            </Link>
          </div>
          <div className="erp-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Descripción</th>
                  <th>Solicita</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.slice(0, 5).map((c) => (
                  <tr key={c.id}>
                    <td className="mono">
                      <Link to={`/erp/compras/solicitud-cotizacion/${c.id}`}>{c.numero}</Link>
                    </td>
                    <td>{c.descripcion ?? ""}</td>
                    <td>{c.solicita ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="erp-panel">
        <div className="erp-panel-head">
          <h3>Órdenes de Compra</h3>
          <Link to="/erp/compras/orden-compra" className="erp-crumb">
            Ver todas
          </Link>
        </div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Proveedor</th>
                <th>Descripción</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td className="mono">
                    <Link to={`/erp/compras/orden-compra/${o.id}`}>{o.numero}</Link>
                  </td>
                  <td>{o.proveedor?.nombre_legal ?? o.proveedor?.nombre_comercial ?? ""}</td>
                  <td>{o.descripcion ?? ""}</td>
                  <td className="num">{formatoMoneda(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
