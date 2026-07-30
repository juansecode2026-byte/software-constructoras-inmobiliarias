"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { borrarArchivo, subirArchivo, validarArchivo } from "@/lib/supabase/storage";

export interface ResultadoAccion {
  error?: string;
  ok?: string;
}

// Campos de texto libre: se guardan como null cuando quedan vacios para no
// arrastrar cadenas vacias a los documentos impresos.
const CAMPOS_TEXTO = [
  "nombre_comercial",
  "nombre_legal",
  "identificador",
  "giro",
  "direccion",
  "comuna",
  "provincia",
  "region",
  "telefono",
  "email",
  "web",
  "representante_legal_nombre",
  "representante_legal_identificador",
  "pie_de_firma",
  "textos_bienvenida",
] as const;

async function empresaId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("empresas").select("id").limit(1).maybeSingle();
  return data?.id ?? null;
}

export async function guardarEmpresa(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  const id = await empresaId();
  if (!id) return { error: "No se encontró la empresa." };

  const nombre = String(formData.get("nombre_comercial") ?? "").trim();
  if (!nombre) return { error: "El nombre comercial es obligatorio: identifica a la empresa en todo el sistema." };

  const cambios: Record<string, string | null> = {};
  for (const campo of CAMPOS_TEXTO) {
    cambios[campo] = String(formData.get(campo) ?? "").trim() || null;
  }
  // "nombre" es la columna original de la tabla; se mantiene alineada al comercial
  cambios.nombre = nombre;

  const supabase = await createClient();
  const { error } = await supabase.from("empresas").update(cambios).eq("id", id);
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/erp/empresa");
  revalidatePath("/erp");
  return { ok: "Datos de la empresa guardados." };
}

// Sube logo o firma institucional. El campo indica cual de los dos.
async function subirImagen(
  campo: "logo_url" | "firma_digital_url",
  carpeta: string,
  formData: FormData,
  nombreInput: string,
): Promise<ResultadoAccion> {
  const id = await empresaId();
  if (!id) return { error: "No se encontró la empresa." };

  const archivo = formData.get(nombreInput);
  if (!(archivo instanceof File)) return { error: "Selecciona un archivo." };

  const problema = validarArchivo(archivo);
  if (problema) return { error: problema };

  const supabase = await createClient();
  const { data: actual } = await supabase.from("empresas").select(campo).eq("id", id).maybeSingle();
  const anterior = (actual as Record<string, string | null> | null)?.[campo] ?? null;

  let ruta: string;
  try {
    ruta = await subirArchivo(carpeta, archivo);
  } catch (e) {
    return { error: `No se pudo subir el archivo: ${(e as Error).message}` };
  }

  const { error } = await supabase.from("empresas").update({ [campo]: ruta }).eq("id", id);
  if (error) {
    await borrarArchivo(ruta).catch(() => {});
    return { error: `No se pudo guardar la imagen: ${error.message}` };
  }

  if (anterior) await borrarArchivo(anterior).catch(() => {});

  revalidatePath("/erp/empresa");
  return { ok: "Imagen actualizada." };
}

export async function subirLogo(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  return subirImagen("logo_url", "empresa/logo", formData, "logo");
}

export async function subirFirmaEmpresa(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  return subirImagen("firma_digital_url", "empresa/firma", formData, "firma");
}

async function quitarImagen(campo: "logo_url" | "firma_digital_url"): Promise<void> {
  const id = await empresaId();
  if (!id) return;

  const supabase = await createClient();
  const { data: actual } = await supabase.from("empresas").select(campo).eq("id", id).maybeSingle();
  const anterior = (actual as Record<string, string | null> | null)?.[campo] ?? null;

  await supabase.from("empresas").update({ [campo]: null }).eq("id", id);
  if (anterior) await borrarArchivo(anterior).catch(() => {});

  revalidatePath("/erp/empresa");
}

export async function quitarLogo(): Promise<void> {
  return quitarImagen("logo_url");
}

export async function quitarFirmaEmpresa(): Promise<void> {
  return quitarImagen("firma_digital_url");
}
