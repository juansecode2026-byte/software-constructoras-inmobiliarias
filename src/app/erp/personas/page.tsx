import Link from "next/link";
import { listarPersonas, nombrePersona, rolesPersona } from "@/lib/supabase/configuraciones";
import { obtenerEmpresaId } from "@/lib/supabase/presupuesto";

export default async function PersonasPage() {
  const empresaId = await obtenerEmpresaId();
  const personas = await listarPersonas(empresaId);

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Personas</h1>
        <span className="erp-crumb">Configuraciones básicas</span>
      </div>

      <p className="erp-note">
        Directorio de terceros: proveedores, clientes, empleados, contratistas y transportistas.
        Una persona puede tener varios roles a la vez; los demás módulos (Compras, Subcontratos,
        Venta inmobiliaria) referencian estos registros.
      </p>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn">+ Nueva persona</button>
        <button type="button" className="erp-btn ghost small">Exportar Excel</button>
        <button type="button" className="erp-btn ghost small">Importar Excel</button>
      </div>

      <div className="erp-panel">
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Roles</th>
                <th>Giro</th>
                <th>Vigente</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.identificador}</td>
                  <td>
                    <Link href={`/erp/personas/${p.id}`}>{nombrePersona(p)}</Link>
                  </td>
                  <td>{p.tipo_persona === "empresa" ? "Empresa" : "Persona natural"}</td>
                  <td>
                    {rolesPersona(p).map((rol) => (
                      <span key={rol} className="erp-pill aprobado erp-rol">{rol}</span>
                    ))}
                  </td>
                  <td>{p.giro ?? "—"}</td>
                  <td>
                    <span className={`erp-pill ${p.vigente ? "aprobado" : "plan"}`}>
                      {p.vigente ? "Sí" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
