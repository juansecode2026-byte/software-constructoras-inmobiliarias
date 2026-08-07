// Perfil del usuario. Mismas firmas que tenia lib/supabase/perfil.ts, para que
// las pantallas no se enteren de que ahora los datos vienen por HTTP.

import { api } from "./client";

export interface UsuarioPerfil {
  id: string;
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  firma_digital_url: string | null;
  notas: string | null;
}

export function obtenerPerfil(): Promise<UsuarioPerfil | null> {
  return api.get<UsuarioPerfil | null>("perfil");
}

export interface DatosPerfil {
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  notas: string | null;
}

export function guardarPerfil(datos: DatosPerfil): Promise<{ ok: string }> {
  return api.put<{ ok: string }>("perfil", datos);
}

// "anterior" es la firma que habia antes: el frontend la borra del bucket
// recien cuando la base ya apunta a la nueva.
export function registrarFirma(ruta: string): Promise<{ ok: string; anterior: string | null }> {
  return api.put<{ ok: string; anterior: string | null }>("perfil/firma", { ruta });
}

export function quitarFirmaPerfil(): Promise<{ ok: string; anterior: string | null }> {
  return api.borrar<{ ok: string; anterior: string | null }>("perfil/firma");
}
