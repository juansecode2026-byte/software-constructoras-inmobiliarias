"use client";

import { useRouter } from "next/navigation";
import type { PresupuestoFila } from "@/lib/supabase/presupuesto";
import { estadoPresupuestoClase, estadoPresupuestoLabel, formatoMoneda } from "./format";

export function BudgetTable({ presupuestos }: { presupuestos: PresupuestoFila[] }) {
  const router = useRouter();

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
              onClick={() => router.push(`/erp/presupuesto/${p.id}`)}
            >
              <td className="num">{p.numero}</td>
              <td>{p.nombre}</td>
              <td>
                <span className={`erp-pill ${estadoPresupuestoClase(p.estado)}`}>
                  {estadoPresupuestoLabel(p.estado)}
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
