import { PresupuestoExplorer } from "@/features/erp/PresupuestoExplorer";
import { listarCarpetas, listarPresupuestos, obtenerObraPorNombre } from "@/lib/api/presupuesto";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function PresupuestoPage() {
  const { datos, cargando, error } = useAsync(async () => {
    const obra = await obtenerObraPorNombre("Obra Miramar");
    const [presupuestos, carpetas] = await Promise.all([
      listarPresupuestos(obra.id),
      listarCarpetas(obra.id),
    ]);
    return { obra, presupuestos, carpetas };
  }, []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!datos) return null;
  const { obra, presupuestos, carpetas } = datos;

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Presupuesto</h1>
        <span className="erp-crumb">{obra.nombre}</span>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn">+ Nuevo presupuesto</button>
        <button type="button" className="erp-btn ghost small">Nueva carpeta</button>
        <button type="button" className="erp-btn ghost small">Importar desde Excel</button>
      </div>

      <PresupuestoExplorer carpetas={carpetas} presupuestos={presupuestos} />
    </div>
  );
}
