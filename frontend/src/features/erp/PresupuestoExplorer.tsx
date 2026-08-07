
import { useMemo, useState } from "react";
import type { PresupuestoFila } from "@/lib/api/presupuesto";
import { BudgetTable } from "./BudgetTable";
import { CarpetaTree, idsDescendientes, type CarpetaTreeFila } from "./CarpetaTree";

/**
 * Combina el arbol de carpetas con la grilla de presupuestos: al seleccionar
 * una carpeta, la grilla se filtra a sus presupuestos + los de sus
 * subcarpetas (sin recargar la pagina) - igual al comportamiento real visto
 * en el video ("Carpeta raiz" agrega todo, una subcarpeta solo lo suyo). No
 * es un Excel ni datos hardcodeados: es un filtro normal sobre carpeta_id,
 * el mismo dato que ya trae cada presupuesto.
 */
export function PresupuestoExplorer({
  carpetas,
  presupuestos,
}: {
  carpetas: CarpetaTreeFila[];
  presupuestos: PresupuestoFila[];
}) {
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    if (!seleccionada) return presupuestos;
    const ids = idsDescendientes(carpetas, seleccionada);
    return presupuestos.filter((p) => p.carpeta_id !== null && ids.has(p.carpeta_id));
  }, [presupuestos, carpetas, seleccionada]);

  const carpetaActiva = carpetas.find((c) => c.id === seleccionada);

  return (
    <div className="erp-list-layout">
      <CarpetaTree carpetas={carpetas} seleccionada={seleccionada} onSeleccionar={setSeleccionada} />

      <div className="erp-panel">
        {seleccionada && (
          <div className="erp-panel-head">
            <h3>{carpetaActiva?.nombre ?? "Carpeta"}</h3>
            <span className="erp-crumb">
              {filtrados.length} presupuesto{filtrados.length === 1 ? "" : "s"} ·{" "}
              <button type="button" className="erp-linklike" onClick={() => setSeleccionada(null)}>
                ver todos
              </button>
            </span>
          </div>
        )}
        <BudgetTable presupuestos={filtrados} />
      </div>
    </div>
  );
}
