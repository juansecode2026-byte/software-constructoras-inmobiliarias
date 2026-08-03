import { obtenerPerfil } from "@/lib/supabase/perfil";
import { urlFirmada } from "@/lib/supabase/storage";
import { quitarFirma } from "./perfilActions";
import { DatosForm, FirmaForm } from "./PerfilForm";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function PerfilPage() {
  const { datos, cargando, error, recargar } = useAsync(async () => {
    const perfil = await obtenerPerfil();
    // el bucket es privado: la vista previa usa una URL firmada temporal
    const firmaUrl = perfil?.firma_digital_url ? await urlFirmada(perfil.firma_digital_url) : null;
    return { perfil, firmaUrl };
  }, []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;

  const perfil = datos?.perfil ?? null;
  const firmaUrl = datos?.firmaUrl ?? null;

  async function quitarFirmaYRecargar() {
    await quitarFirma();
    recargar();
  }

  if (!perfil) {
    return (
      <div className="erp-view">
        <div className="erp-view-head">
          <h1>Mi perfil</h1>
        </div>
        <p className="erp-note">
          Todavía no hay un perfil asociado a esta cuenta. Se crea junto con el usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <div>
          <h1>Mi perfil</h1>
          <span className="erp-crumb">Datos que aparecen en los documentos que firmas</span>
        </div>
      </div>

      <div className="erp-grid-2">
        <div className="erp-panel">
          <div className="erp-panel-head"><h3>Datos personales</h3></div>
          <DatosForm perfil={perfil} />
        </div>

        <div className="erp-panel">
          <div className="erp-panel-head"><h3>Firma digital</h3></div>
          <div className="erp-panel-body">
            {firmaUrl ? (
              <div className="erp-firma-preview">
                <img src={firmaUrl} alt="Firma digital" width={280} height={120} />
                <form action={quitarFirmaYRecargar}>
                  <button type="submit" className="erp-btn ghost small">Quitar firma</button>
                </form>
              </div>
            ) : (
              <p className="erp-note" style={{ margin: "0 0 1rem" }}>
                Sin firma cargada. Se usará en la impresión de documentos aprobados.
              </p>
            )}
            <FirmaForm tieneFirma={Boolean(firmaUrl)} />
          </div>
        </div>
      </div>
    </div>
  );
}
