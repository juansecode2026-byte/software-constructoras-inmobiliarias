
import { useActionState } from "react";
import { guardarPerfil, subirFirma, type ResultadoAccion } from "./perfilActions";
import type { UsuarioPerfil } from "@/lib/supabase/perfil";

const ESTADO_INICIAL: ResultadoAccion = {};

function Aviso({ estado }: { estado: ResultadoAccion }) {
  if (!estado.error && !estado.ok) return null;
  return (
    <p className={`erp-aviso ${estado.error ? "error" : "ok"}`}>
      {estado.error ?? estado.ok}
    </p>
  );
}

export function DatosForm({ perfil }: { perfil: UsuarioPerfil }) {
  const [estado, accion, pendiente] = useActionState(guardarPerfil, ESTADO_INICIAL);

  return (
    <form action={accion}>
      <div className="erp-panel-body form-grid">
        <div className="field">
          <label htmlFor="nombre">Nombre completo</label>
          <input id="nombre" name="nombre" type="text" defaultValue={perfil.nombre} required />
          <span className="hint">Aparece como &ldquo;Aprobado por&rdquo; en los documentos.</span>
        </div>
        <div className="field">
          <label htmlFor="cargo">Cargo</label>
          <input id="cargo" name="cargo" type="text" defaultValue={perfil.cargo ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="telefono">Teléfono</label>
          <input id="telefono" name="telefono" type="text" defaultValue={perfil.telefono ?? ""} />
        </div>
        <div className="field span-2">
          <label htmlFor="notas">Notas</label>
          <textarea id="notas" name="notas" defaultValue={perfil.notas ?? ""} />
        </div>
      </div>
      <div className="erp-panel-foot">
        <Aviso estado={estado} />
        <button type="submit" className="erp-btn" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Grabar"}
        </button>
      </div>
    </form>
  );
}

export function FirmaForm({ tieneFirma }: { tieneFirma: boolean }) {
  const [estado, accion, pendiente] = useActionState(subirFirma, ESTADO_INICIAL);

  return (
    <form action={accion} className="erp-firma-form">
      <div className="field">
        <label htmlFor="firma">{tieneFirma ? "Reemplazar firma" : "Subir firma"}</label>
        <input
          id="firma"
          name="firma"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
        />
        <span className="hint">PNG, JPG o WEBP · máximo 5 MB. Fondo transparente recomendado.</span>
      </div>
      <Aviso estado={estado} />
      <button type="submit" className="erp-btn small" disabled={pendiente}>
        {pendiente ? "Subiendo…" : "Subir"}
      </button>
    </form>
  );
}
