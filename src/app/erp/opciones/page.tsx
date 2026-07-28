import { listarConfiguraciones } from "@/lib/supabase/configuraciones";
import { obtenerEmpresaId } from "@/lib/supabase/presupuesto";

const MODULO_LABEL: Record<string, string> = {
  general: "General",
  presupuesto: "Presupuesto y partidas",
  recursos: "Recursos",
  compras: "Compras",
};

function formatoValor(valor: string): string {
  if (valor === "true") return "Sí";
  if (valor === "false") return "No";
  return valor;
}

export default async function OpcionesPage() {
  const empresaId = await obtenerEmpresaId();
  const configuraciones = await listarConfiguraciones(empresaId);

  const modulos = [...new Set(configuraciones.map((c) => c.modulo))];

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Opciones</h1>
        <span className="erp-crumb">Configuraciones básicas</span>
      </div>

      <p className="erp-note">
        Parámetros que gobiernan el comportamiento de cada módulo. La tabla es plana
        (módulo / clave / valor); aquí se agrupan por módulo para leerlos con contexto.
      </p>

      {modulos.map((modulo) => (
        <div key={modulo} className="erp-panel erp-opciones-panel">
          <div className="erp-panel-head">
            <h3>{MODULO_LABEL[modulo] ?? modulo}</h3>
          </div>
          <div className="erp-panel-body">
            {configuraciones
              .filter((c) => c.modulo === modulo)
              .map((c) => (
                <div key={c.id} className="erp-config-row">
                  <div className="txt">
                    <strong>{c.descripcion ?? c.clave}</strong>
                    <span className="mono">{c.clave}</span>
                  </div>
                  <span className="valor">{formatoValor(c.valor)}</span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
