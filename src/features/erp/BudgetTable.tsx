"use client";

import { useRouter } from "next/navigation";
import { presupuestos } from "./data";

export function BudgetTable() {
  const router = useRouter();

  return (
    <div className="erp-table-wrap">
      <table>
        <thead>
          <tr>
            <th>N.º</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Vigente</th>
            <th>Proyecto</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {presupuestos.map((p) => (
            <tr
              key={p.numero}
              className="rowlink"
              onClick={() => router.push(`/erp/presupuesto/${p.numero}`)}
            >
              <td className="num">{p.numero}</td>
              <td>{p.nombre}</td>
              <td>
                <span className={`erp-pill ${p.estado === "Aprobado" ? "aprobado" : "proceso"}`}>
                  {p.estado}
                </span>
              </td>
              <td>{p.vigente ? "Sí" : "No"}</td>
              <td>{p.proyecto}</td>
              <td className="num">{p.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
