// Acciones de la pantalla Mi perfil.
//
// Ya no tocan la base: llaman al backend (supabase/functions/perfil). Lo unico
// que sigue yendo directo a Supabase es la subida del archivo al bucket, que es
// almacenamiento y no expone el esquema; el backend registra la ruta resultante.

import {
  guardarPerfil as guardarPerfilApi,
  quitarFirmaPerfil,
  registrarFirma,
} from "@/lib/api/perfil";
import { borrarArchivo, subirArchivo, validarArchivo } from "@/lib/supabase/storage";

export interface ResultadoAccion {
  error?: string;
  ok?: string;
}

export async function guardarPerfil(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  try {
    const { ok } = await guardarPerfilApi({
      nombre: String(formData.get("nombre") ?? "").trim(),
      cargo: String(formData.get("cargo") ?? "").trim() || null,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      notas: String(formData.get("notas") ?? "").trim() || null,
    });
    return { ok };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function subirFirma(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  const archivo = formData.get("firma");
  if (!(archivo instanceof File)) return { error: "Selecciona un archivo." };

  const problema = validarArchivo(archivo);
  if (problema) return { error: problema };

  let ruta: string;
  try {
    ruta = await subirArchivo("usuario/firma", archivo);
  } catch (e) {
    return { error: `No se pudo subir el archivo: ${(e as Error).message}` };
  }

  try {
    // La firma anterior se borra despues de que la base apunta a la nueva, para
    // no quedarse sin ninguna si algo falla en el medio.
    const { ok, anterior } = await registrarFirma(ruta);
    if (anterior) await borrarArchivo(anterior).catch(() => {});
    return { ok };
  } catch (e) {
    await borrarArchivo(ruta).catch(() => {});
    return { error: (e as Error).message };
  }
}

export async function quitarFirma(): Promise<void> {
  try {
    const { anterior } = await quitarFirmaPerfil();
    if (anterior) await borrarArchivo(anterior).catch(() => {});
  } catch {
    // La pantalla se recarga igual; si fallo, la firma sigue visible.
  }
}
