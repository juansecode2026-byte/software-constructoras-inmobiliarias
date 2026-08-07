import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

// Pantalla neutra mientras se resuelve la sesion. Sin esto se veria un parpadeo
// hacia /login en cada recarga, porque getSession() es asincrono.
function Cargando() {
  return (
    <div className="flex flex-1 items-center justify-center p-12 text-sm text-slate-500">
      Cargando…
    </div>
  );
}

// Reemplaza la proteccion de /erp que hacia el proxy de Next. La barrera real
// de seguridad siguen siendo las politicas RLS de Supabase: esto solo evita
// mostrar pantallas vacias a quien no tiene sesion.
export function RequireAuth() {
  const { session, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando />;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Equivalente a la regla del proxy: con sesion activa, /login manda al ERP.
export function RedirectIfAuth() {
  const { session, cargando } = useAuth();

  if (cargando) return <Cargando />;
  if (session) return <Navigate to="/erp" replace />;
  return <Outlet />;
}
