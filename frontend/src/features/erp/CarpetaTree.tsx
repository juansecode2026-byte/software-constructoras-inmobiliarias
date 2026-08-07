
import { useState } from "react";

export interface CarpetaTreeFila {
  id: string;
  nombre: string;
  parent_id: string | null;
}

/**
 * Arbol de carpetas con expandir/colapsar real (igual al ERP de referencia:
 * "Carpeta raiz" arranca colapsada y el clic revela sus hijos). Antes esto
 * pintaba todas las carpetas de una vez con solo indentacion visual.
 *
 * El mismo clic selecciona la carpeta (filtra los presupuestos, ver
 * PresupuestoExplorer) y la expande/colapsa si tiene hijos - igual que en el
 * video de referencia, donde un solo clic hace ambas cosas.
 */
export function CarpetaTree({
  carpetas,
  seleccionada,
  onSeleccionar,
}: {
  carpetas: CarpetaTreeFila[];
  seleccionada?: string | null;
  onSeleccionar?: (id: string) => void;
}) {
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  function alternar(id: string) {
    setExpandidas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  function nodo(carpeta: CarpetaTreeFila, nivel: number) {
    const hijos = carpetas.filter((c) => c.parent_id === carpeta.id);
    const tieneHijos = hijos.length > 0;
    const abierta = expandidas.has(carpeta.id);
    const activa = seleccionada === carpeta.id;

    return (
      <div key={carpeta.id}>
        <button
          type="button"
          className={`erp-tree-item erp-tree-btn${nivel > 0 ? " sub" : ""}${activa ? " active" : ""}`}
          style={nivel > 1 ? { paddingLeft: `${1.3 + (nivel - 1) * 0.8}rem` } : undefined}
          onClick={() => {
            onSeleccionar?.(carpeta.id);
            if (tieneHijos) alternar(carpeta.id);
          }}
        >
          <span className="erp-tree-caret">{tieneHijos ? (abierta ? "▾" : "▸") : ""}</span>
          📁 {carpeta.nombre}
        </button>
        {abierta && hijos.map((hijo) => nodo(hijo, nivel + 1))}
      </div>
    );
  }

  const raices = carpetas.filter((c) => c.parent_id === null);

  return <div className="erp-tree">{raices.map((raiz) => nodo(raiz, 0))}</div>;
}

// Una carpeta seleccionada muestra sus presupuestos + los de todas sus
// subcarpetas (por eso "Carpeta raiz" agrega el total de la obra).
export function idsDescendientes(carpetas: CarpetaTreeFila[], raizId: string): Set<string> {
  const resultado = new Set<string>([raizId]);
  let agregado = true;
  while (agregado) {
    agregado = false;
    for (const c of carpetas) {
      if (c.parent_id && resultado.has(c.parent_id) && !resultado.has(c.id)) {
        resultado.add(c.id);
        agregado = true;
      }
    }
  }
  return resultado;
}
