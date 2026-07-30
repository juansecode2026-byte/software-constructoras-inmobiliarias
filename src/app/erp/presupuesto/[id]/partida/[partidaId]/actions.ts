"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerEstadoInicioPartida } from "@/lib/supabase/presupuesto";

export interface ResultadoAccion {
  error?: string;
  ok?: string;
}

export async function iniciarPartida(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  const presupuestoId = String(formData.get("presupuestoId") ?? "");
  const presupuestoPartidaId = String(formData.get("presupuestoPartidaId") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  const estado = await obtenerEstadoInicioPartida(presupuestoPartidaId);

  if (estado.sobrecosto && !motivo) {
    return {
      error:
        "Esta partida cuesta más en Trabajo que en el Original: se requiere un motivo de autorización antes de iniciarla.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("presupuesto_partidas")
    .update({
      iniciada: true,
      iniciada_en: new Date().toISOString(),
      autorizacion_motivo: estado.sobrecosto ? motivo : null,
    })
    .eq("id", presupuestoPartidaId);

  if (error) return { error: `No se pudo iniciar la partida: ${error.message}` };

  revalidatePath(`/erp/presupuesto/${presupuestoId}/partida/${presupuestoPartidaId}`);
  return { ok: "Partida iniciada." };
}
