// Datos de ejemplo para la vista previa del ERP.
// Se reemplazan por consultas reales (src/lib/supabase) cuando el backend exista.

export type EstadoProyecto = "En ejecución" | "En planificación";

export interface Proyecto {
  id: string;
  nombre: string;
  estado: EstadoProyecto;
  avancePct: number | null;
  presupuesto: string | null;
}

export const proyectos: Proyecto[] = [
  { id: "miramar", nombre: "Obra Miramar", estado: "En ejecución", avancePct: 12, presupuesto: "$4.511.396" },
  { id: "los-aromos", nombre: "Los Aromos", estado: "En ejecución", avancePct: 68, presupuesto: "$2.980.500" },
  { id: "vista-norte", nombre: "Vista Norte", estado: "En planificación", avancePct: null, presupuesto: null },
];

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

export type EstadoPresupuesto = "En proceso" | "Aprobado";

export interface Presupuesto {
  numero: number;
  nombre: string;
  estado: EstadoPresupuesto;
  vigente: boolean;
  proyecto: string;
  total: string;
}

export const presupuestos: Presupuesto[] = [
  { numero: 52, nombre: "PPTO Miramar 02 (completo) — original", estado: "En proceso", vigente: true, proyecto: "Obra Miramar", total: "$4.526.903" },
  { numero: 61, nombre: "PPTO Miramar 02 (completo) — trabajo", estado: "En proceso", vigente: true, proyecto: "Obra Miramar", total: "$4.511.396" },
  { numero: 63, nombre: "Accesorios de baño — matriz de partida", estado: "Aprobado", vigente: true, proyecto: "Obra Miramar", total: "$1.957.170" },
];

export const carpetasPresupuesto = [
  { nombre: "Carpeta raíz", nivel: 0, activa: false },
  { nombre: "Proyectos 01", nivel: 1, activa: false },
  { nombre: "Obra Miramar", nivel: 1, activa: true },
  { nombre: "PPTO calidad especial", nivel: 1, activa: false },
];

export type TipoCosto = "Material" | "Mano de obra";

export interface RecursoPartida {
  tipo: TipoCosto;
  codigo: string;
  nombre: string;
  unidad: string;
  rendimiento: string;
  cantidad: string;
  precioUnit: string;
  valorUnit: string;
  sugeridoPorAgente?: boolean;
}

export interface PartidaDetalle {
  numero: number;
  nombre: string;
  codigo: string;
  unidad: string;
  cantidad: string;
  sumaVU: string;
  imprevistos: string;
  gastosGenerales: string;
  utilidad: string;
  totalPU: string;
  recursos: RecursoPartida[];
}

export const partidaDemo: PartidaDetalle = {
  numero: 63,
  nombre: "Accesorio Baño 2",
  codigo: "000559",
  unidad: "UND",
  cantidad: "5,00",
  sumaVU: "1.957,17",
  imprevistos: "0,00",
  gastosGenerales: "0,00",
  utilidad: "0,00",
  totalPU: "$1.957,17",
  recursos: [
    { tipo: "Material", codigo: "000836", nombre: "Espejo 650×900×2", unidad: "UND", rendimiento: "1,00", cantidad: "5,00", precioUnit: "37,80", valorUnit: "189,00", sugeridoPorAgente: true },
    { tipo: "Material", codigo: "000959", nombre: "Jabonera mediana Nvo. Verona blanca", unidad: "UND", rendimiento: "1,00", cantidad: "1,00", precioUnit: "18,48", valorUnit: "18,48" },
    { tipo: "Mano de obra", codigo: "001028", nombre: "Maestro carpintero", unidad: "HH", rendimiento: "0,00", cantidad: "1,46", precioUnit: "30,71", valorUnit: "44,88" },
    { tipo: "Material", codigo: "001130", nombre: "Perchas", unidad: "UND", rendimiento: "1,00", cantidad: "4,00", precioUnit: "15,12", valorUnit: "60,48" },
    { tipo: "Material", codigo: "001213", nombre: "Portarrollo blanco", unidad: "UND", rendimiento: "1,00", cantidad: "54,00", precioUnit: "30,24", valorUnit: "1.632,96" },
  ],
};

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
      { nombre: "Compras" },
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
  { titulo: "Administración", items: [{ nombre: "Usuarios y permisos" }, { nombre: "Personas" }, { nombre: "Recursos" }] },
];
