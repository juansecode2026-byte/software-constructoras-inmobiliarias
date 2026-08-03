import { Link } from "react-router-dom";
import { listarPresupuestosConOriginal, obtenerObraPorNombre } from "@/lib/supabase/presupuesto";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function InformesPresupuestoPage() {
  const { datos, cargando, error } = useAsync(async () => {
    const obra = await obtenerObraPorNombre("Obra Miramar");
    const presupuestos = await listarPresupuestosConOriginal(obra.id);
    return { obra, presupuestos };
  }, []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!datos) return null;
  const { obra, presupuestos } = datos;

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Informes</h1>
        <span className="erp-crumb">
          <Link to="/erp/presupuesto">Presupuesto</Link> › Informes · {obra.nombre}
        </span>
      </div>

      <p className="erp-note">
        Reportes calculados sobre el Presupuesto — no viven en tablas propias, se arman al vuelo a
        partir de los datos ya cargados.
      </p>

      <div className="erp-panel">
        <div className="erp-panel-head">
          <h3>Comparación de Presupuestos (Original-Trabajo)</h3>
        </div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Presupuesto de Trabajo</th>
                <th>Original</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((p) => (
                <tr key={p.id}>
                  <td className="mono">
                    Nº {p.numero} · {p.nombre}
                  </td>
                  <td className="mono">Nº {p.originalNumero}</td>
                  <td>
                    <Link to={`/erp/presupuesto/${p.id}/comparacion`} className="erp-btn ghost small">
                      Ver comparación
                    </Link>
                  </td>
                </tr>
              ))}
              {presupuestos.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "var(--ink-soft)" }}>
                    No hay presupuestos de trabajo con una versión original asociada.
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
