// Acciones de la pantalla Empresa.
//
// Ya no tocan la base: llaman al backend (supabase/functions/configuraciones).
// La subida de archivos sigue yendo directo al bucket, igual que en Perfil.

import {
  guardarEmpresa as guardarEmpresaApi,
  quitarFirmaEmpresaApi,
  quitarLogoEmpresa,
  registrarFirmaEmpresa,
  registrarLogoEmpresa,
  type DatosEmpresa,
} from "@/lib/api/configuraciones";
import { borrarArchivo, subirArchivo, validarArchivo } from "@/lib/supabase/storage";

export interface ResultadoAccion {
  error?: string;
  ok?: string;
}

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
] as const satisfies readonly (keyof DatosEmpresa)[];

export async function guardarEmpresa(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  const datos = {} as DatosEmpresa;
  for (const campo of CAMPOS_TEXTO) {
    datos[campo] = String(formData.get(campo) ?? "").trim() || null;
  }

  try {
    const { ok } = await guardarEmpresaApi(datos);
    return { ok };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function subirImagen(
  registrar: (ruta: string) => Promise<{ ok: string; anterior: string | null }>,
  carpeta: string,
  formData: FormData,
  nombreInput: string,
): Promise<ResultadoAccion> {
  const archivo = formData.get(nombreInput);
  if (!(archivo instanceof File)) return { error: "Selecciona un archivo." };

  const problema = validarArchivo(archivo);
  if (problema) return { error: problema };

  let ruta: string;
  try {
    ruta = await subirArchivo(carpeta, archivo);
  } catch (e) {
    return { error: `No se pudo subir el archivo: ${(e as Error).message}` };
  }

  try {
    const { ok, anterior } = await registrar(ruta);
    if (anterior) await borrarArchivo(anterior).catch(() => {});
    return { ok };
  } catch (e) {
    await borrarArchivo(ruta).catch(() => {});
    return { error: (e as Error).message };
  }
}

export function subirLogo(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  return subirImagen(registrarLogoEmpresa, "empresa/logo", formData, "logo");
}

export function subirFirmaEmpresa(
  _estadoPrevio: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  return subirImagen(registrarFirmaEmpresa, "empresa/firma", formData, "firma");
}

export async function quitarLogo(): Promise<void> {
  try {
    const { anterior } = await quitarLogoEmpresa();
    if (anterior) await borrarArchivo(anterior).catch(() => {});
  } catch {
    // La pantalla se recarga igual; si fallo, la imagen sigue visible.
  }
}

export async function quitarFirmaEmpresa(): Promise<void> {
  try {
    const { anterior } = await quitarFirmaEmpresaApi();
    if (anterior) await borrarArchivo(anterior).catch(() => {});
  } catch {
    // idem
  }
}
