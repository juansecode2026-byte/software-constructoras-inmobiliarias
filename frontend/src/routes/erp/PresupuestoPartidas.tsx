import { Link } from "react-router-dom";
import { listarPartidasObra, obtenerObraPorNombre } from "@/lib/api/presupuesto";
import { formatoMoneda } from "@/features/erp/format";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function PartidasObraPage() {
  const { datos, cargando, error } = useAsync(async () => {
    const obra = await obtenerObraPorNombre("Obra Miramar");
    const partidas = await listarPartidasObra(obra.id);
    return { obra, partidas };
  }, []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!datos) return null;
  const { obra, partidas } = datos;

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Partidas</h1>
        <span className="erp-crumb">
          <Link to="/erp/presupuesto">Presupuesto</Link> › Partidas · {obra.nombre}
        </span>
      </div>

      <p className="erp-note">
        Vista plana de todas las partidas de todos los presupuestos de la obra — el mismo dato que
        se ve dentro de cada presupuesto, pero sin entrar uno por uno.
      </p>

      <div className="erp-panel">
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Presupuesto</th>
                <th>Área</th>
                <th>Código</th>
                <th>Partida</th>
                <th>Unidad</th>
                <th className="num">Cantidad</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((p) => (
                <tr key={p.presupuestoPartidaId}>
                  <td className="mono">Nº {p.presupuestoNumero}</td>
                  <td>
                    {p.areaCodigo} · {p.areaNombre}
                  </td>
                  <td className="mono">{p.partida.codigo}</td>
                  <td>
                    <Link to={`/erp/presupuesto/${p.presupuestoId}/partida/${p.presupuestoPartidaId}`}>
                      {p.partida.nombre}
                    </Link>
                  </td>
                  <td>{p.partida.unidad}</td>
                  <td className="num">{p.cantidad}</td>
                  <td className="num">{formatoMoneda(p.total)}</td>
                </tr>
              ))}
              {partidas.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: "var(--ink-soft)" }}>
                    Esta obra todavía no tiene partidas cargadas.
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
