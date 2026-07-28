import { obtenerEmpresaDetalle } from "@/lib/supabase/configuraciones";

function Dato({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="erp-dato">
      <span className="label">{label}</span>
      <span className="valor">{valor ?? "—"}</span>
    </div>
  );
}

export default async function EmpresaPage() {
  const empresa = await obtenerEmpresaDetalle();

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Empresa</h1>
        <span className="erp-crumb">Configuraciones básicas</span>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn ghost">Editar</button>
        <button type="button" className="erp-btn" disabled>Grabar</button>
      </div>

      <div className="erp-grid-2">
        <div className="erp-panel">
          <div className="erp-panel-head"><h3>Datos generales</h3></div>
          <div className="erp-panel-body erp-dato-grid">
            <Dato label="Nombre comercial" valor={empresa.nombre_comercial} />
            <Dato label="Razón social" valor={empresa.nombre_legal} />
            <Dato label="RUT / Identificador" valor={empresa.identificador} />
            <Dato label="Giro" valor={empresa.giro} />
            <Dato label="Dirección" valor={empresa.direccion} />
            <Dato label="Comuna" valor={empresa.comuna} />
            <Dato label="Región" valor={empresa.region} />
            <Dato label="Teléfono" valor={empresa.telefono} />
            <Dato label="Email" valor={empresa.email} />
            <Dato label="Sitio web" valor={empresa.web} />
            <Dato
              label="Representante legal"
              valor={
                empresa.representante_legal_nombre
                  ? `${empresa.representante_legal_nombre} — ${empresa.representante_legal_identificador ?? "sin RUT"}`
                  : null
              }
            />
          </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-head"><h3>Documentos</h3></div>
          <div className="erp-panel-body erp-dato-grid uno">
            <Dato label="Logo de empresa" valor={empresa.logo_url ?? "Sin cargar"} />
            <Dato label="Firma digital" valor={empresa.firma_digital_url ?? "Sin cargar"} />
            <Dato label="Pie de firma" valor={empresa.pie_de_firma} />
            <Dato label="Texto de bienvenida (Inicio)" valor={empresa.textos_bienvenida} />
          </div>
        </div>
      </div>

      <p className="erp-note">
        Los datos de esta pantalla se usan para generar documentos (presupuestos, órdenes de
        compra) con la identidad de la empresa. La edición se habilitará junto con el flujo
        Editar/Grabar.
      </p>
    </div>
  );
}
