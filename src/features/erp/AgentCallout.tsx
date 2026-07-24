"use client";

import { useState } from "react";

export function AgentCallout() {
  const [aplicado, setAplicado] = useState(false);

  return (
    <div className="erp-agent-callout">
      <span className="erp-agent-badge">$</span>
      <div>
        <p>
          El agente de compras encontró <b>Espejo 650×900×2</b> un 12% más barato con un proveedor de
          la misma región.
        </p>
        <div className="meta">Comparación entre 4 proveedores homologados · jurisdicción local</div>
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
