import { Link } from "react-router-dom";
import { listarEstadoInicioObra, obtenerObraPorNombre } from "@/lib/supabase/presupuesto";
import { formatoMoneda } from "@/features/erp/format";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function InicioPartidaPage() {
  const { datos, cargando, error } = useAsync(async () => {
    const obra = await obtenerObraPorNombre("Obra Miramar");
    const filas = await listarEstadoInicioObra(obra.id);
    return { obra, filas };
  }, []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!datos) return null;
  const { obra, filas } = datos;

  const pendientes = filas.filter((f) => !f.iniciada);
  const iniciadas = filas.filter((f) => f.iniciada);

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Inicio de Partida</h1>
        <span className="erp-crumb">
          <Link to="/erp/presupuesto">Presupuesto</Link> › Inicio de Partida · {obra.nombre}
        </span>
      </div>

      <p className="erp-note">
        Nodo de decisión del flujo de Control de Costos: antes de que una partida pase a Compras,
        se compara su costo de Trabajo contra el Original. Con sobrecosto, exige autorización — ver
        el panel dentro de cada partida.
      </p>

      <div className="erp-panel">
        <div className="erp-panel-head">
          <h3>Pendientes de iniciar</h3>
          <span className="erp-crumb">{pendientes.length}</span>
        </div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Presupuesto</th>
                <th>Área</th>
                <th>Partida</th>
                <th className="num">Original</th>
                <th className="num">Trabajo</th>
                <th className="num">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((f) => (
                <tr key={f.presupuestoPartidaId}>
                  <td className="mono">Nº {f.presupuestoNumero}</td>
                  <td>{f.areaCodigo}</td>
                  <td>
                    <Link to={`/erp/presupuesto/${f.presupuestoId}/partida/${f.presupuestoPartidaId}`}>
                      {f.partida.nombre}
                    </Link>
                    {f.sobrecosto && <span className="erp-pill rechazado" style={{ marginLeft: "0.5rem" }}>Sobrecosto</span>}
                  </td>
                  <td className="num">{f.totalOriginal !== null ? formatoMoneda(f.totalOriginal) : "—"}</td>
                  <td className="num">{formatoMoneda(f.totalTrabajo)}</td>
                  <td className={`num${f.sobrecosto ? " erp-negativo" : ""}`}>
                    {f.totalOriginal !== null ? formatoMoneda(f.totalTrabajo - f.totalOriginal) : "—"}
                  </td>
                </tr>
              ))}
              {pendientes.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--ink-soft)" }}>
                    No hay partidas pendientes de iniciar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="erp-panel">
        <div className="erp-panel-head">
          <h3>Ya iniciadas</h3>
          <span className="erp-crumb">{iniciadas.length}</span>
        </div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Presupuesto</th>
                <th>Área</th>
                <th>Partida</th>
                <th>Iniciada</th>
              </tr>
            </thead>
            <tbody>
              {iniciadas.map((f) => (
                <tr key={f.presupuestoPartidaId}>
                  <td className="mono">Nº {f.presupuestoNumero}</td>
                  <td>{f.areaCodigo}</td>
                  <td>
                    <Link to={`/erp/presupuesto/${f.presupuestoId}/partida/${f.presupuestoPartidaId}`}>
                      {f.partida.nombre}
                    </Link>
                  </td>
                  <td>{f.iniciadaEn ? new Date(f.iniciadaEn).toLocaleDateString("es-CL") : "—"}</td>
                </tr>
              ))}
              {iniciadas.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--ink-soft)" }}>
                    Ninguna partida se ha iniciado todavía.
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
