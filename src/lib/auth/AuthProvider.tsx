import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import {
  IDLE_TIMEOUT_MS,
  estaVencidaPorInactividad,
  limpiarActividad,
  marcarActividad,
} from "@/lib/supabase/idle";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  cargando: boolean;
  /** Motivo del ultimo cierre de sesion automatico, para mostrarlo en /login. */
  avisoSesion: string | null;
  limpiarAviso: () => void;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AVISO_INACTIVIDAD = "Tu sesión se cerró por 10 minutos de inactividad";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [avisoSesion, setAvisoSesion] = useState<string | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sesion inicial: si la marca de actividad ya vencio (por ejemplo el equipo
  // se apago sin cerrar sesion), se cierra antes de dejar entrar.
  useEffect(() => {
    let activo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!activo) return;

      if (data.session && estaVencidaPorInactividad()) {
        await supabase.auth.signOut();
        limpiarActividad();
        if (!activo) return;
        setAvisoSesion(AVISO_INACTIVIDAD);
        setSession(null);
      } else {
        if (data.session) marcarActividad();
        setSession(data.session);
      }
      setCargando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((evento, nuevaSesion) => {
      setSession(nuevaSesion);
      if (evento === "SIGNED_IN") marcarActividad();
      if (evento === "SIGNED_OUT") limpiarActividad();
    });

    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Corte por inactividad mientras la pestana esta abierta. Sustituye al proxy
  // de Next y al heartbeat contra /api/heartbeat.
  useEffect(() => {
    if (!session) return;

    function cerrarPorInactividad() {
      limpiarActividad();
      setAvisoSesion(AVISO_INACTIVIDAD);
      void supabase.auth.signOut();
    }

    function reiniciar() {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(cerrarPorInactividad, IDLE_TIMEOUT_MS);
    }

    function alDetectarActividad() {
      marcarActividad();
      reiniciar();
    }

    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventos.forEach((evento) => window.addEventListener(evento, alDetectarActividad));
    alDetectarActividad();

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, alDetectarActividad));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [session]);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    limpiarActividad();
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        cargando,
        avisoSesion,
        limpiarAviso: () => setAvisoSesion(null),
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return contexto;
}
