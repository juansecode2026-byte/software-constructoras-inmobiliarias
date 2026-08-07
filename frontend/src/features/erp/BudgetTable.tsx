
import { useNavigate } from "react-router-dom";
import type { PresupuestoFila } from "@/lib/api/presupuesto";
import { estadoPresupuestoClase, formatoMoneda } from "./format";

export function BudgetTable({ presupuestos }: { presupuestos: PresupuestoFila[] }) {
  const navigate = useNavigate();

  if (presupuestos.length === 0) {
    return <p className="erp-note" style={{ padding: "1.1rem" }}>Esta obra todavía no tiene presupuestos cargados.</p>;
  }

  return (
    <div className="erp-table-wrap">
      <table>
        <thead>
          <tr>
            <th>N.º</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Vigente</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {presupuestos.map((p) => (
            <tr
              key={p.id}
              className="rowlink"
              onClick={() => navigate(`/erp/presupuesto/${p.id}`)}
            >
              <td className="num">{p.numero}</td>
              <td>{p.nombre}</td>
              <td>
                <span className={`erp-pill ${estadoPresupuestoClase(p.estadoEsAprobado)}`}>
                  {p.estado}
                </span>
              </td>
              <td>{p.vigente ? "Sí" : "No"}</td>
              <td className="num">{formatoMoneda(p.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
