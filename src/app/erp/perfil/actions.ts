"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { borrarArchivo, subirArchivo, validarArchivo } from "@/lib/supabase/storage";

export interface ResultadoAccion {
  error?: string;
  ok?: string;
}

export async function guardarPerfil(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida. Vuelve a iniciar sesión." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio: aparece en los documentos firmados." };

  const { error } = await supabase
    .from("usuario_perfil")
    .update({
      nombre,
      cargo: String(formData.get("cargo") ?? "").trim() || null,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      notas: String(formData.get("notas") ?? "").trim() || null,
    })
    .eq("auth_user_id", user.id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/erp/perfil");
  return { ok: "Perfil guardado." };
}

export async function subirFirma(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida. Vuelve a iniciar sesión." };

  const archivo = formData.get("firma");
  if (!(archivo instanceof File)) return { error: "Selecciona un archivo." };

  const problema = validarArchivo(archivo);
  if (problema) return { error: problema };

  // la firma anterior se borra despues de subir la nueva, para no perderla si falla
  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("firma_digital_url")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  let ruta: string;
  try {
    ruta = await subirArchivo("usuario/firma", archivo);
  } catch (e) {
    return { error: `No se pudo subir el archivo: ${(e as Error).message}` };
  }

  const { error } = await supabase
    .from("usuario_perfil")
    .update({ firma_digital_url: ruta })
    .eq("auth_user_id", user.id);

  if (error) {
    await borrarArchivo(ruta).catch(() => {});
    return { error: `No se pudo guardar la firma: ${error.message}` };
  }

  if (perfil?.firma_digital_url) {
    await borrarArchivo(perfil.firma_digital_url).catch(() => {});
  }

  revalidatePath("/erp/perfil");
  return { ok: "Firma actualizada." };
}

export async function quitarFirma(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("firma_digital_url")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  await supabase
    .from("usuario_perfil")
    .update({ firma_digital_url: null })
    .eq("auth_user_id", user.id);

  if (perfil?.firma_digital_url) {
    await borrarArchivo(perfil.firma_digital_url).catch(() => {});
  }

  revalidatePath("/erp/perfil");
}
