const moneda = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatoMoneda(valor: number): string {
  return moneda.format(valor);
}

export function estadoObraLabel(estado: "en_planificacion" | "en_ejecucion" | "cerrada"): string {
  if (estado === "en_ejecucion") return "En ejecución";
  if (estado === "en_planificacion") return "En planificación";
  return "Cerrada";
}

export function estadoObraClase(estado: "en_planificacion" | "en_ejecucion" | "cerrada"): string {
  return estado === "en_ejecucion" ? "ejecucion" : "plan";
}

export function estadoPresupuestoLabel(estado: "en_proceso" | "aprobado"): string {
  return estado === "aprobado" ? "Aprobado" : "En proceso";
}

export function estadoPresupuestoClase(estado: "en_proceso" | "aprobado"): string {
  return estado === "aprobado" ? "aprobado" : "proceso";
}
