import { Outlet } from "react-router-dom";
import { ErpShell } from "@/features/erp/ErpShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAsync, PantallaError } from "@/hooks/useAsync";
import { listarObras } from "@/lib/api/presupuesto";
import "@/styles/erp.css";

export default function ErpLayout() {
  const { user } = useAuth();
  const { datos, cargando, error } = useAsync(() => listarObras(), []);

  // El shell necesita la lista de obras para el selector de proyecto, asi que se
  // espera antes de pintarlo (antes lo resolvia el layout en el servidor).
  if (cargando) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-sm text-slate-500">
        Cargando el ERP…
      </div>
    );
  }
  if (error) return <PantallaError error={error} />;

  return (
    <ErpShell userEmail={user?.email ?? "—"} obras={datos ?? []}>
      <Outlet />
    </ErpShell>
  );
}
