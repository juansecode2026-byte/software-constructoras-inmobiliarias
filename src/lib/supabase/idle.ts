import { cookies } from "next/headers";

// Cierre de sesion por inactividad: 10 minutos sin actividad del usuario.
// La cookie se renueva en cada request al proxy y en cada "heartbeat" del
// cliente; si falta (expiro, o el equipo se apago sin cerrar sesion), el
// proxy fuerza el cierre de sesion en la siguiente visita.
export const ACTIVITY_COOKIE_NAME = "erp-last-activity";
export const IDLE_TIMEOUT_SECONDS = 10 * 60;

// Se llama justo despues de iniciar sesion (login o canje de codigo de
// recuperacion): sin esto, la PRIMERA request tras el login no tendria la
// cookie todavia y el proxy la confundiria con una sesion vencida por
// inactividad, cerrandola de inmediato.
export async function marcarActividad() {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVITY_COOKIE_NAME, String(Date.now()), {
    maxAge: IDLE_TIMEOUT_SECONDS,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}
