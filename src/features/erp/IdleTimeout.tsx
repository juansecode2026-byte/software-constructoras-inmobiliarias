"use client";

import { useEffect, useRef } from "react";
import { logout } from "@/app/login/actions";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const PING_THROTTLE_MS = 60 * 1000;

// Cierra la sesion despues de 10 minutos sin actividad real del usuario
// (mouse, teclado, scroll). Ademas manda un "heartbeat" al servidor para que,
// si el equipo se apaga sin cerrar sesion, el proxy detecte la inactividad la
// proxima vez que alguien intente entrar.
export function IdleTimeout() {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoPing = useRef(0);

  useEffect(() => {
    function reiniciarTemporizador() {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT_MS);
    }

    function alDetectarActividad() {
      reiniciarTemporizador();

      const ahora = Date.now();
      if (ahora - ultimoPing.current > PING_THROTTLE_MS) {
        ultimoPing.current = ahora;
        fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
      }
    }

    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventos.forEach((evento) => window.addEventListener(evento, alDetectarActividad));
    alDetectarActividad();

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, alDetectarActividad));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  return null;
}
