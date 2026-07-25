import { BudgetTable } from "@/features/erp/BudgetTable";
import { listarCarpetas, listarPresupuestos, obtenerObraPorNombre } from "@/lib/supabase/presupuesto";

export default async function PresupuestoPage() {
  const obra = await obtenerObraPorNombre("Obra Miramar");
  const [presupuestos, carpetas] = await Promise.all([
    listarPresupuestos(obra.id),
    listarCarpetas(obra.id),
  ]);

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Presupuesto</h1>
        <span className="erp-crumb">{obra.nombre}</span>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn">+ Nuevo presupuesto</button>
        <button type="button" className="erp-btn ghost small">Nueva carpeta</button>
        <button type="button" className="erp-btn ghost small">Importar desde Excel</button>
      </div>

      <div className="erp-list-layout">
        <div className="erp-tree">
          {carpetas.map((carpeta) => (
            <div key={carpeta.id} className={`erp-tree-item${carpeta.parent_id ? " sub" : ""}`}>
              📁 {carpeta.nombre}
            </div>
          ))}
        </div>

        <div className="erp-panel">
          <BudgetTable presupuestos={presupuestos} />
        </div>
      </div>
    </div>
  );
}
