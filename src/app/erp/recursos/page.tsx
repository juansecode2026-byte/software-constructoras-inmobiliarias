import { listarClasesRecurso, listarRecursos, type ClaseRecursoFila } from "@/lib/supabase/configuraciones";
import { obtenerEmpresaId } from "@/lib/supabase/presupuesto";

const TIPO_COSTO_LABEL: Record<string, string> = {
  material: "Material",
  mano_de_obra: "Mano de obra",
  subcontrato: "Subcontrato",
  maquinaria: "Maquinaria",
  servicio: "Servicio",
};

// Aplana el arbol de clases (3 niveles: Clase > Subclase > Sub-subclase) en
// orden jerarquico, con la profundidad de cada nodo para indentar.
function aplanarArbol(clases: ClaseRecursoFila[]): { clase: ClaseRecursoFila; nivel: number }[] {
  const resultado: { clase: ClaseRecursoFila; nivel: number }[] = [];
  const recorrer = (parentId: string | null, nivel: number) => {
    for (const clase of clases.filter((c) => c.parent_id === parentId)) {
      resultado.push({ clase, nivel });
      recorrer(clase.id, nivel + 1);
    }
  };
  recorrer(null, 0);
  return resultado;
}

export default async function RecursosPage() {
  const empresaId = await obtenerEmpresaId();
  const [clases, recursos] = await Promise.all([
    listarClasesRecurso(empresaId),
    listarRecursos(empresaId),
  ]);
  const arbol = aplanarArbol(clases);

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Recursos</h1>
        <span className="erp-crumb">Configuraciones básicas</span>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn">+ Nuevo recurso</button>
        <button type="button" className="erp-btn ghost small">Exportar Excel</button>
        <button type="button" className="erp-btn ghost small">Importar Excel</button>
      </div>

      <div className="erp-list-layout">
        <div>
          <p className="erp-section-label">Clasificación</p>
          <div className="erp-tree">
            {arbol.map(({ clase, nivel }) => (
              <div key={clase.id} className={`erp-tree-item${nivel === 1 ? " sub" : nivel >= 2 ? " sub2" : ""}`}>
                <span className="mono erp-tree-cod">{clase.codigo}</span> {clase.nombre}
              </div>
            ))}
          </div>
        </div>

        <div className="erp-panel">
          <div className="erp-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Clase</th>
                  <th>Unidad</th>
                  <th>Tipo costo</th>
                  <th>Embalaje</th>
                  <th>Stock</th>
                  <th>Vigente</th>
                </tr>
              </thead>
              <tbody>
                {recursos.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.codigo}</td>
                    <td>{r.nombre}</td>
                    <td>{r.clase?.nombre ?? "Sin clasificar"}</td>
                    <td>{r.unidad_compra}</td>
                    <td>{TIPO_COSTO_LABEL[r.tipo_costo] ?? r.tipo_costo}</td>
                    <td>
                      {r.unidades_embalaje.length > 0
                        ? r.unidades_embalaje.map((u) => `${u.unidad} ×${Number(u.factor)}`).join(", ")
                        : "—"}
                    </td>
                    <td>
                      <span className={`erp-pill ${r.con_stock ? "aprobado" : "plan"}`}>
                        {r.con_stock ? "Con stock" : "Sin stock"}
                      </span>
                    </td>
                    <td>
                      <span className={`erp-pill ${r.vigente ? "aprobado" : "plan"}`}>
                        {r.vigente ? "Sí" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="erp-panel erp-subpanel">
        <div className="erp-panel-head"><h3>Clases de recurso — vínculos contables</h3></div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Clase</th>
                <th>Cuenta inventario</th>
                <th>Cuenta venta</th>
                <th>Cuenta costo de venta</th>
                <th>Imputable</th>
              </tr>
            </thead>
            <tbody>
              {arbol.map(({ clase, nivel }) => (
                <tr key={clase.id}>
                  <td className="mono">{clase.codigo ?? "—"}</td>
                  <td style={{ paddingLeft: `${0.7 + nivel * 1.1}rem` }}>{clase.nombre}</td>
                  <td className="mono">{clase.cuenta_inventario?.codigo ?? "—"}</td>
                  <td className="mono">{clase.cuenta_venta?.codigo ?? "—"}</td>
                  <td className="mono">{clase.cuenta_costo_venta?.codigo ?? "—"}</td>
                  <td>
                    <span className={`erp-pill ${clase.imputable ? "aprobado" : "plan"}`}>
                      {clase.imputable ? "Sí" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="erp-note">
        Cada clase enlaza hasta 3 cuentas contables (inventario, venta y costo de venta) para que
        las compras y consumos se imputen solos al plan de cuentas cuando exista Contabilidad.
      </p>
    </div>
  );
}
