// Cierre de sesion por inactividad: 10 minutos sin actividad del usuario.
//
// En SPA no hay proxy de servidor ni cookie httpOnly: la marca de actividad
// vive en localStorage y se revisa al arrancar la app y en cada tick del
// temporizador. Si el equipo se apago sin cerrar sesion, al volver a abrir la
// marca ya esta vencida y se cierra la sesion antes de mostrar nada.
export const ACTIVITY_STORAGE_KEY = "erp-last-activity";
export const IDLE_TIMEOUT_SECONDS = 10 * 60;
export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_SECONDS * 1000;

export function marcarActividad() {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(Date.now()));
  } catch {
    // Modo privado o storage lleno: la sesion sigue viva, solo se pierde el
    // corte por inactividad entre recargas.
  }
}

export function limpiarActividad() {
  try {
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  } catch {
    // sin storage no hay nada que limpiar
  }
}

// true cuando pasaron mas de 10 minutos desde la ultima actividad registrada.
// Sin marca previa se considera vencida: es una sesion que quedo de una visita
// anterior sin rastro de actividad.
export function estaVencidaPorInactividad(): boolean {
  try {
    const marca = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!marca) return true;
    return Date.now() - Number(marca) > IDLE_TIMEOUT_MS;
  } catch {
    return false;
  }
}
