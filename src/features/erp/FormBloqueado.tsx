"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

export interface ResultadoAccion {
  error?: string;
  ok?: string;
}

type Accion = (estado: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>;

const ESTADO_INICIAL: ResultadoAccion = {};

/**
 * Patron "bloqueado hasta Editar/Grabar" del ERP de referencia: el formulario
 * abre en solo lectura, Editar habilita los campos y Grabar guarda y vuelve a
 * bloquear. Evita modificar por accidente datos que salen impresos.
 *
 * Los campos se envuelven en un <fieldset disabled>, que deshabilita todos los
 * controles descendientes de forma nativa. Asi `children` es JSX normal y puede
 * venir de un Server Component (una funcion no cruzaria ese limite).
 */
export function FormBloqueado({
  accion,
  children,
  etiquetaGuardar = "Grabar",
}: {
  accion: Accion;
  children: ReactNode;
  etiquetaGuardar?: string;
}) {
  const [estado, ejecutar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const [bloqueado, setBloqueado] = useState(true);

  // tras un guardado correcto vuelve a solo lectura; si fallo, sigue editable
  // para no perder lo que la persona escribio
  useEffect(() => {
    if (estado.ok) setBloqueado(true);
  }, [estado.ok]);

  return (
    <form action={ejecutar}>
      <div className="erp-toolbar">
        <button
          type="button"
          className="erp-btn"
          onClick={() => setBloqueado(false)}
          disabled={!bloqueado || pendiente}
        >
          Editar
        </button>
        <button type="submit" className="erp-btn" disabled={bloqueado || pendiente}>
          {pendiente ? "Guardando…" : etiquetaGuardar}
        </button>
        {bloqueado && !pendiente && (
          <span className="erp-lock-hint">Solo lectura · pulsa Editar para modificar</span>
        )}
        {(estado.error || estado.ok) && (
          <span className={`erp-aviso ${estado.error ? "error" : "ok"}`}>
            {estado.error ?? estado.ok}
          </span>
        )}
      </div>

      <fieldset className="erp-fieldset" disabled={bloqueado || pendiente}>
        {children}
      </fieldset>
    </form>
  );
}

/** Subida de una imagen con vista previa, para logo o firma. */
export function SubirImagen({
  accion,
  nombreInput,
  etiqueta,
}: {
  accion: Accion;
  nombreInput: string;
  etiqueta: string;
}) {
  const [estado, ejecutar, pendiente] = useActionState(accion, ESTADO_INICIAL);

  return (
    <form action={ejecutar} className="erp-firma-form">
      <div className="field">
        <label htmlFor={nombreInput}>{etiqueta}</label>
        <input
          id={nombreInput}
          name={nombreInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
        />
        <span className="hint">PNG, JPG o WEBP · máximo 5 MB.</span>
      </div>
      {(estado.error || estado.ok) && (
        <p className={`erp-aviso ${estado.error ? "error" : "ok"}`}>{estado.error ?? estado.ok}</p>
      )}
      <button type="submit" className="erp-btn small" disabled={pendiente}>
        {pendiente ? "Subiendo…" : "Subir"}
      </button>
    </form>
  );
}
