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

type EstadoDocumento = "en_digitacion" | "pendiente" | "terminada";

export function estadoDocumentoLabel(estado: EstadoDocumento): string {
  if (estado === "terminada") return "Terminada";
  if (estado === "pendiente") return "Pendiente";
  return "En digitación";
}

export function estadoDocumentoClase(estado: EstadoDocumento): string {
  return estado === "terminada" ? "aprobado" : "plan";
}

type EstadoAprobacion = "pendiente" | "aprobado" | "rechazado";

export function estadoAprobacionLabel(estado: EstadoAprobacion): string {
  if (estado === "aprobado") return "Aprobado";
  if (estado === "rechazado") return "Rechazado";
  return "Pendiente";
}

export function estadoAprobacionClase(estado: EstadoAprobacion): string {
  if (estado === "aprobado") return "aprobado";
  if (estado === "rechazado") return "rechazado";
  return "plan";
}
