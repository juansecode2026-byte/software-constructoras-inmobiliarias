import { avancePorArea, insightsAgente, kpisInicio } from "@/features/erp/data";
import { ProjectCards } from "@/features/erp/ProjectCards";
import { listarObras } from "@/lib/api/presupuesto";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

export default function InicioPage() {
  const { datos, cargando, error } = useAsync(() => listarObras(), []);

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  const obras = datos ?? [];

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <h1>Inicio</h1>
        <span className="erp-crumb">Constructora Andes · instancia exclusiva</span>
      </div>

      <p className="erp-section-label">Tus proyectos</p>
      <ProjectCards obras={obras} />

      <p className="erp-section-label">Obra Miramar — detalle</p>
      <div className="erp-kpi-row">
        {kpisInicio.map((kpi) => (
          <div key={kpi.label} className={`erp-kpi${kpi.esAgente ? " agent" : ""}`}>
            <div className="label">
              {kpi.esAgente && <span className="erp-agent-dot" />}
              {kpi.label}
            </div>
            <div className="value num">{kpi.valor}</div>
            <div className={`delta ${kpi.tono}`}>{kpi.delta}</div>
          </div>
        ))}
      </div>
      <p className="erp-note">
        Los proyectos de arriba ya son datos reales de Supabase. Los KPIs, el avance por área y los
        insights de agente de aquí abajo siguen siendo ilustrativos — dependen de los módulos de
        Costos Obra/Avance y de la capa de agentes, que todavía no se construyen.
      </p>

      <div className="erp-grid-2">
        <div className="erp-panel">
          <div className="erp-panel-head">
            <h3>Avance por área</h3>
            <span className="erp-crumb">nivel área</span>
          </div>
          <div className="erp-panel-body">
            {avancePorArea.map((area) => (
              <div key={area.nombre} className="erp-avance-row">
                <span className="name">{area.nombre}</span>
                <div className="erp-track">
                  <div className="erp-fill" style={{ width: `${area.pct}%` }} />
                </div>
                <span className="pct num">{area.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-head">
            <h3>Insights del agente</h3>
          </div>
          <div className="erp-panel-body">
            {insightsAgente.map((insight) => (
              <div key={insight.texto} className="erp-insight">
                <span className="erp-agent-badge">{insight.icono}</span>
                <div>
                  <p>{insight.texto}</p>
                  <div className="meta">{insight.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
