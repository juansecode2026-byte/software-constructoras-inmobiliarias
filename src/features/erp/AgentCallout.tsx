"use client";

import { useState } from "react";

export function AgentCallout({
  recursoNombre,
  ahorroPct,
  proveedoresComparados,
}: {
  recursoNombre: string;
  ahorroPct?: number;
  proveedoresComparados?: number;
}) {
  const [aplicado, setAplicado] = useState(false);

  return (
    <div className="erp-agent-callout">
      <span className="erp-agent-badge">$</span>
      <div>
        <p>
          El agente de compras encontró <b>{recursoNombre}</b> más barato con un proveedor
          alternativo{ahorroPct !== undefined ? ` (${ahorroPct}% de ahorro)` : ""}.
        </p>
        <div className="meta">
          {proveedoresComparados !== undefined
            ? `Comparación entre ${proveedoresComparados} proveedores homologados`
            : "Sugerencia del agente de compras"}
        </div>
      </div>
      <button
        type="button"
        className="erp-btn small cta"
        disabled={aplicado}
        onClick={() => setAplicado(true)}
      >
        {aplicado ? "Aplicado ✓" : "Ver comparación"}
      </button>
    </div>
  );
}
