import { obtenerEmpresaDetalle } from "@/lib/api/configuraciones";
import { urlFirmada } from "@/lib/supabase/storage";
import { FormBloqueado, SubirImagen } from "@/features/erp/FormBloqueado";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";
import {
  guardarEmpresa,
  quitarFirmaEmpresa,
  quitarLogo,
  subirFirmaEmpresa,
  subirLogo,
} from "./empresaActions";

// El <fieldset disabled> de FormBloqueado deshabilita estos inputs; no necesitan
// saber si el formulario esta bloqueado.
function Campo({
  id,
  label,
  valor,
  ancho,
  hint,
  requerido,
}: {
  id: string;
  label: string;
  valor: string | null;
  ancho?: "span-2";
  hint?: string;
  requerido?: boolean;
}) {
  return (
    <div className={`field${ancho ? ` ${ancho}` : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} type="text" defaultValue={valor ?? ""} required={requerido} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export default function EmpresaPage() {
  const { datos, cargando, error, recargar } = useAsync(async () => {
    const empresa = await obtenerEmpresaDetalle();

    // el bucket es privado: las vistas previas usan URLs firmadas temporales
    const [logoUrl, firmaUrl] = await Promise.all([
      empresa.logo_url ? urlFirmada(empresa.logo_url) : null,
      empresa.firma_digital_url ? urlFirmada(empresa.firma_digital_url) : null,
    ]);
    return { empresa, logoUrl, firmaUrl };
  }, []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!datos) return null;
  const { empresa, logoUrl, firmaUrl } = datos;

  // Antes revalidatePath refrescaba el server component; ahora la pantalla
  // vuelve a consultar despues de subir o quitar una imagen.
  async function quitarLogoYRecargar() {
    await quitarLogo();
    recargar();
  }

  async function quitarFirmaEmpresaYRecargar() {
    await quitarFirmaEmpresa();
    recargar();
  }

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <div>
          <h1>Empresa</h1>
          <span className="erp-crumb">
            Identidad que se imprime en presupuestos y órdenes de compra
          </span>
        </div>
      </div>

      <FormBloqueado accion={guardarEmpresa}>
        <div className="erp-grid-2">
          <div className="erp-panel">
            <div className="erp-panel-head"><h3>Datos generales</h3></div>
            <div className="erp-panel-body form-grid">
              <Campo
                id="nombre_comercial"
                label="Nombre comercial"
                valor={empresa.nombre_comercial}
                requerido
              />
              <Campo id="nombre_legal" label="Razón social" valor={empresa.nombre_legal} />
              <Campo
                id="identificador"
                label="RUT / Identificador"
                valor={empresa.identificador}
              />
              <Campo id="giro" label="Giro" valor={empresa.giro} />
              <Campo id="direccion" label="Dirección" valor={empresa.direccion} ancho="span-2" />
              <Campo id="comuna" label="Comuna" valor={empresa.comuna} />
              <Campo id="provincia" label="Provincia" valor={empresa.provincia} />
              <Campo id="region" label="Región" valor={empresa.region} />
              <Campo id="telefono" label="Teléfono" valor={empresa.telefono} />
              <Campo id="email" label="Email" valor={empresa.email} />
              <Campo id="web" label="Sitio web" valor={empresa.web} />
              <Campo
                id="representante_legal_nombre"
                label="Representante legal"
                valor={empresa.representante_legal_nombre}
              />
              <Campo
                id="representante_legal_identificador"
                label="RUT del representante"
                valor={empresa.representante_legal_identificador}
              />
            </div>
          </div>

          <div className="erp-panel">
            <div className="erp-panel-head"><h3>Textos de documentos</h3></div>
            <div className="erp-panel-body form-grid">
              <Campo
                id="pie_de_firma"
                label="Pie de firma"
                valor={empresa.pie_de_firma}
                ancho="span-2"
                hint="Línea que acompaña la firma al pie de los documentos."
              />
              <div className="field span-2">
                <label htmlFor="textos_bienvenida">Texto de bienvenida</label>
                <textarea
                  id="textos_bienvenida"
                  name="textos_bienvenida"
                  defaultValue={empresa.textos_bienvenida ?? ""}
                />
                <span className="hint">Se muestra en la pantalla de Inicio.</span>
              </div>
            </div>
          </div>
        </div>
      </FormBloqueado>

      <div className="erp-grid-2" style={{ marginTop: "1.1rem" }}>
        <div className="erp-panel">
          <div className="erp-panel-head"><h3>Logo de empresa</h3></div>
          <div className="erp-panel-body">
            {logoUrl ? (
              <div className="erp-firma-preview">
                <img src={logoUrl} alt="Logo de la empresa" width={220} height={110} />
                <form action={quitarLogoYRecargar}>
                  <button type="submit" className="erp-btn ghost small">Quitar logo</button>
                </form>
              </div>
            ) : (
              <p className="erp-note" style={{ margin: "0 0 1rem" }}>
                Sin logo cargado. Aparecerá en la cabecera de los documentos impresos.
              </p>
            )}
            <SubirImagen
              accion={subirLogo}
              nombreInput="logo"
              etiqueta={logoUrl ? "Reemplazar logo" : "Subir logo"}
            />
          </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-head"><h3>Firma institucional</h3></div>
          <div className="erp-panel-body">
            {firmaUrl ? (
              <div className="erp-firma-preview">
                <img src={firmaUrl} alt="Firma institucional" width={220} height={110} />
                <form action={quitarFirmaEmpresaYRecargar}>
                  <button type="submit" className="erp-btn ghost small">Quitar firma</button>
                </form>
              </div>
            ) : (
              <p className="erp-note" style={{ margin: "0 0 1rem" }}>
                Sin firma cargada. Es distinta de tu firma personal en Mi perfil: esta representa
                a la empresa.
              </p>
            )}
            <SubirImagen
              accion={subirFirmaEmpresa}
              nombreInput="firma"
              etiqueta={firmaUrl ? "Reemplazar firma" : "Subir firma"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
