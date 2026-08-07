// Acceso al bucket privado del ERP (ver supabase/migrations/0007_perfil_usuario_storage.sql).
// El bucket no es publico: las imagenes se muestran con URLs firmadas de corta duracion.

import { createClient } from "./client";

export const BUCKET = "erp-archivos";

const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB, igual que el limite del bucket

export function validarArchivo(archivo: File): string | null {
  if (archivo.size === 0) return "El archivo está vacío.";
  if (archivo.size > TAMANO_MAXIMO) return "El archivo supera el máximo de 5 MB.";
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return "Formato no admitido. Usa PNG, JPG, WEBP o PDF.";
  }
  return null;
}

// Nombre unico conservando la extension, para no pisar archivos con el mismo nombre.
function rutaUnica(carpeta: string, nombreOriginal: string): string {
  const extension = nombreOriginal.includes(".") ? nombreOriginal.split(".").pop() : "bin";
  return `${carpeta}/${crypto.randomUUID()}.${extension}`;
}

export async function subirArchivo(carpeta: string, archivo: File): Promise<string> {
  const supabase = await createClient();
  const ruta = rutaUnica(carpeta, archivo.name);

  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
    contentType: archivo.type,
    upsert: false,
  });

  if (error) throw error;
  return ruta;
}

// El bucket es privado: se firma la URL cada vez que se va a mostrar el archivo.
export async function urlFirmada(ruta: string, segundos = 3600): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(ruta, segundos);
  if (error) return null;
  return data.signedUrl;
}

export async function borrarArchivo(ruta: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([ruta]);
  if (error) throw error;
}
