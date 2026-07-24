"use client";

import { proyectos } from "./data";
import { useProyecto } from "./ErpShell";

export function ProjectCards() {
  const { proyectoActivo, setProyectoActivo } = useProyecto();

  return (
    <>
      <div className="erp-project-grid">
        {proyectos.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`erp-project-card${p.nombre === proyectoActivo ? " is-active" : ""}`}
            onClick={() => setProyectoActivo(p.nombre)}
          >
            <div className="prow">
              <h4>{p.nombre}</h4>
              <span className={`erp-pill ${p.estado === "En ejecución" ? "ejecucion" : "plan"}`}>
                {p.estado}
              </span>
            </div>
            <div className="erp-stat-line">
              <span>Avance</span>
              <b className="num">{p.avancePct !== null ? `${p.avancePct}%` : "—"}</b>
            </div>
            <div className="erp-track">
              <div className="erp-fill" style={{ width: `${p.avancePct ?? 0}%` }} />
            </div>
            <div className="erp-stat-line">
              <span>Presupuesto</span>
              <b className="num">{p.presupuesto ?? "por definir"}</b>
            </div>
          </button>
        ))}
      </div>
      <button type="button" className="erp-project-card add">
        + Agregar otro proyecto propio
      </button>
    </>
  );
}
