
import type { ObraFila } from "@/lib/supabase/presupuesto";
import { estadoObraClase, estadoObraLabel, formatoMoneda } from "./format";
import { useProyecto } from "./ErpShell";

export function ProjectCards({ obras }: { obras: ObraFila[] }) {
  const { proyectoActivo, setProyectoActivo } = useProyecto();

  return (
    <>
      <div className="erp-project-grid">
        {obras.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`erp-project-card${o.nombre === proyectoActivo ? " is-active" : ""}`}
            onClick={() => setProyectoActivo(o.nombre)}
          >
            <div className="prow">
              <h4>{o.nombre}</h4>
              <span className={`erp-pill ${estadoObraClase(o.estado)}`}>{estadoObraLabel(o.estado)}</span>
            </div>
            <div className="erp-stat-line">
              <span>Presupuesto</span>
              <b className="num">
                {o.presupuestoTotal !== null ? formatoMoneda(o.presupuestoTotal) : "por definir"}
              </b>
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
