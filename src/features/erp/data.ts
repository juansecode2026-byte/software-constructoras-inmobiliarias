// Contenido ilustrativo que todavía no tiene tabla real detrás (módulos de
// Costos Obra/Avance y la capa de agentes no se han construido). Los proyectos,
// presupuestos y partidas reales ya vienen de src/lib/supabase/presupuesto.ts.

export interface KpiInicio {
  label: string;
  valor: string;
  delta: string;
  tono: "good" | "warn";
  esAgente?: boolean;
}

export const kpisInicio: KpiInicio[] = [
  { label: "Presupuesto de trabajo", valor: "$4.511.396", delta: "−$15.507 vs. original", tono: "warn" },
  { label: "Avance físico de obra", valor: "12,4%", delta: "según curva S", tono: "good" },
  { label: "Alertas de stock crítico", valor: "3", delta: "requieren reposición", tono: "warn" },
  { label: "Ahorro sugerido por agente", valor: "$402.600", delta: "3 sugerencias sin aplicar", tono: "good", esAgente: true },
];

export interface AvanceArea {
  nombre: string;
  pct: number;
}

export const avancePorArea: AvanceArea[] = [
  { nombre: "Obra gruesa edificio", pct: 12 },
  { nombre: "Instalación de faenas", pct: 100 },
  { nombre: "Terminaciones depto. 57m²", pct: 0 },
  { nombre: "Obras exteriores", pct: 0 },
];

export interface InsightAgente {
  icono: string;
  texto: string;
  meta: string;
}

export const insightsAgente: InsightAgente[] = [
  { icono: "$", texto: "Cemento Portland 12% más barato con un proveedor de la misma región.", meta: "Agente de compras · hace 2 h" },
  { icono: "!", texto: "Tubería HDPE 110mm bajo el mínimo — solicitud de compra generada.", meta: "Agente de bodega · hace 5 h" },
  { icono: "%", texto: "Precio sugerido para Depto. 58m² actualizado según costo real + margen.", meta: "Agente de pricing · ayer" },
];

export interface GrupoNav {
  titulo: string;
  items: { nombre: string; href?: string }[];
}

export const navegacion: GrupoNav[] = [
  { titulo: "Principal", items: [{ nombre: "Inicio", href: "/erp" }] },
  {
    titulo: "Control de costos",
    items: [
      { nombre: "Presupuesto", href: "/erp/presupuesto" },
      { nombre: "Compras", href: "/erp/compras" },
      { nombre: "Recepciones" },
      { nombre: "Bodega / Almacén" },
      { nombre: "Subcontratos" },
      { nombre: "Maquinaria" },
    ],
  },
  {
    titulo: "Financiero",
    items: [
      { nombre: "Contabilidad" },
      { nombre: "Tesorería" },
      { nombre: "Facturación electrónica" },
      { nombre: "Remuneraciones" },
      { nombre: "Activo fijo" },
    ],
  },
  { titulo: "Comercial", items: [{ nombre: "Venta inmobiliaria" }, { nombre: "Ventas web" }] },
  {
    titulo: "Configuraciones básicas",
    items: [
      { nombre: "Empresa", href: "/erp/empresa" },
      { nombre: "Mi perfil", href: "/erp/perfil" },
      { nombre: "Opciones", href: "/erp/opciones" },
      { nombre: "Personas", href: "/erp/personas" },
      { nombre: "Recursos", href: "/erp/recursos" },
    ],
  },
];
