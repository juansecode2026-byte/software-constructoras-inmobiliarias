import { api, ErrorApi } from "@/lib/api/client";

export interface ResultadoAccion {
  error?: string;
  ok?: string;
}

// El backend vuelve a calcular el sobrecosto y decide si exige motivo — el
// frontend ya no consulta obtenerEstadoInicioPartida antes de decidir, solo
// manda lo que el usuario escribio y confia en la respuesta.
export async function iniciarPartida(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  const presupuestoPartidaId = String(formData.get("presupuestoPartidaId") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  try {
    const { ok } = await api.put<{ ok: string }>(`presupuesto/partidas/${presupuestoPartidaId}/iniciar`, {
      presupuestoPartidaId,
      motivo,
    });
    return { ok };
  } catch (e) {
    if (e instanceof ErrorApi) return { error: e.message };
    return { error: "No se pudo iniciar la partida." };
  }
}
