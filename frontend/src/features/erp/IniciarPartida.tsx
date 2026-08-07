
import { useActionState, useState } from "react";
import { formatoMoneda } from "@/features/erp/format";

interface ResultadoAccion {
  error?: string;
  ok?: string;
}

type Accion = (estado: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>;

const ESTADO_INICIAL: ResultadoAccion = {};

/**
 * Gate "Inicio de Partida" (ver docs/proceso-control-costos.md): antes de que
 * una partida de un presupuesto de trabajo pueda pasar a Compras, se compara
 * su costo contra la version original. Si hay sobrecosto, exige un motivo de
 * autorizacion antes de dejarla iniciada.
 */
export function IniciarPartida({
  accion,
  presupuestoId,
  presupuestoPartidaId,
  disponible,
  iniciada,
  iniciadaEn,
  autorizacionMotivo,
  totalOriginal,
  totalTrabajo,
  sobrecosto,
}: {
  accion: Accion;
  presupuestoId: string;
  presupuestoPartidaId: string;
  disponible: boolean;
  iniciada: boolean;
  iniciadaEn: string | null;
  autorizacionMotivo: string | null;
  totalOriginal: number | null;
  totalTrabajo: number;
  sobrecosto: boolean;
}) {
  const [estado, ejecutar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const [motivo, setMotivo] = useState("");

  if (!disponible) {
    return (
      <div className="erp-panel erp-subpanel">
        <div className="erp-panel-head">
          <h3>Inicio de Partida</h3>
        </div>
        <p className="erp-note">
          Este presupuesto no tiene una versión original asociada (o el área no existe en ella), así
          que no hay costo con qué comparar.
        </p>
      </div>
    );
  }

  return (
    <div className="erp-panel erp-subpanel">
      <div className="erp-panel-head">
        <h3>Inicio de Partida</h3>
        {iniciada && <span className="erp-pill aprobado">Iniciada</span>}
      </div>

      <div className="erp-totals-strip">
        <div className="erp-tstat">
          <div className="label">Total Original</div>
          <div className="value num">{totalOriginal !== null ? formatoMoneda(totalOriginal) : "—"}</div>
        </div>
        <div className="erp-tstat">
          <div className="label">Total Trabajo</div>
          <div className="value num">{formatoMoneda(totalTrabajo)}</div>
        </div>
        <div className="erp-tstat">
          <div className="label">Diferencia</div>
          <div className={`value num${sobrecosto ? " erp-negativo" : ""}`}>
            {totalOriginal !== null ? formatoMoneda(totalTrabajo - totalOriginal) : "—"}
          </div>
        </div>
      </div>

      {iniciada ? (
        <p className="erp-note">
          Iniciada el {iniciadaEn ? new Date(iniciadaEn).toLocaleString("es-CL") : "—"}.
          {autorizacionMotivo && <> Motivo de autorización: “{autorizacionMotivo}”.</>}
        </p>
      ) : (
        <form action={ejecutar}>
          <input type="hidden" name="presupuestoId" value={presupuestoId} />
          <input type="hidden" name="presupuestoPartidaId" value={presupuestoPartidaId} />

          {sobrecosto && (
            <div className="field">
              <label htmlFor="motivo">
                Esta partida cuesta más en Trabajo que en el Original: motivo de autorización
              </label>
              <textarea
                id="motivo"
                name="motivo"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />
            </div>
          )}

          {(estado.error || estado.ok) && (
            <p className={`erp-aviso ${estado.error ? "error" : "ok"}`}>{estado.error ?? estado.ok}</p>
          )}

          <button type="submit" className="erp-btn" disabled={pendiente}>
            {pendiente ? "Iniciando…" : "Iniciar Partida"}
          </button>
        </form>
      )}
    </div>
  );
}
