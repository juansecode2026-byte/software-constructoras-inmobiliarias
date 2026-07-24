import { BudgetTable } from "@/features/erp/BudgetTable";
import { carpetasPresupuesto } from "@/features/erp/data";

export default function PresupuestoPage() {
  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Presupuesto</h1>
        <span className="erp-crumb">Obra Miramar</span>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn">+ Nuevo presupuesto</button>
        <button type="button" className="erp-btn ghost small">Nueva carpeta</button>
        <button type="button" className="erp-btn ghost small">Importar desde Excel</button>
      </div>

      <div className="erp-list-layout">
        <div className="erp-tree">
          {carpetasPresupuesto.map((carpeta) => (
            <div
              key={carpeta.nombre}
              className={`erp-tree-item${carpeta.nivel > 0 ? " sub" : ""}${carpeta.activa ? " active" : ""}`}
            >
              📁 {carpeta.nombre}
            </div>
          ))}
        </div>

        <div className="erp-panel">
          <BudgetTable />
        </div>
      </div>
    </div>
  );
}
