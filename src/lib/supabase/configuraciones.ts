// Consultas tipadas para Configuraciones basicas (ver
// supabase/migrations/0003_configuraciones_basicas.sql): empresa, parametros por
// modulo, personas (terceros) y catalogo de recursos con su arbol de clases.

import { createClient } from "./server";

// ---------- empresa ----------

export interface EmpresaDetalle {
  id: string;
  nombre: string;
  identificador: string | null;
  nombre_comercial: string | null;
  nombre_legal: string | null;
  giro: string | null;
  direccion: string | null;
  region: string | null;
  provincia: string | null;
  comuna: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  representante_legal_nombre: string | null;
  representante_legal_identificador: string | null;
  logo_url: string | null;
  firma_digital_url: string | null;
  pie_de_firma: string | null;
  textos_bienvenida: string | null;
}

export async function obtenerEmpresaDetalle(): Promise<EmpresaDetalle> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("empresas").select("*").limit(1).single();
  if (error) throw error;
  return data;
}

// ---------- parametros por modulo ----------

export interface ConfiguracionFila {
  id: string;
  modulo: string;
  clave: string;
  valor: string;
  descripcion: string | null;
}

export async function listarConfiguraciones(empresaId: string): Promise<ConfiguracionFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuraciones")
    .select("id, modulo, clave, valor, descripcion")
    .eq("empresa_id", empresaId)
    .order("modulo")
    .order("clave");

  if (error) throw error;
  return data;
}

// ---------- personas ----------

export interface PersonaFila {
  id: string;
  tipo_persona: "empresa" | "natural";
  identificador: string;
  nombre_legal: string | null;
  nombre_comercial: string | null;
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  giro: string | null;
  es_proveedor: boolean;
  es_empleado: boolean;
  es_cliente: boolean;
  es_contratista: boolean;
  es_transportista: boolean;
  vigente: boolean;
}

export function nombrePersona(p: PersonaFila): string {
  if (p.tipo_persona === "natural") {
    return [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(" ");
  }
  return p.nombre_legal ?? p.nombre_comercial ?? p.identificador;
}

export function rolesPersona(p: PersonaFila): string[] {
  const roles: string[] = [];
  if (p.es_proveedor) roles.push("Proveedor");
  if (p.es_empleado) roles.push("Empleado");
  if (p.es_cliente) roles.push("Cliente");
  if (p.es_contratista) roles.push("Contratista");
  if (p.es_transportista) roles.push("Transportista");
  return roles;
}

export async function listarPersonas(empresaId: string): Promise<PersonaFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personas")
    .select(
      `id, tipo_persona, identificador, nombre_legal, nombre_comercial,
       nombres, apellido_paterno, apellido_materno, giro,
       es_proveedor, es_empleado, es_cliente, es_contratista, es_transportista, vigente`,
    )
    .eq("empresa_id", empresaId)
    .order("created_at");

  if (error) throw error;
  return data;
}

export interface PersonaDireccion {
  id: string;
  tipo: "principal" | "sucursal";
  nombre: string | null;
  direccion: string;
  region: string | null;
  provincia: string | null;
  comuna: string | null;
  email: string | null;
  telefono: string | null;
  telefono2: string | null;
  contactos: {
    id: string;
    nombre: string;
    cargo: string | null;
    telefono: string | null;
    celular: string | null;
    email: string | null;
    vigente: boolean;
  }[];
}

export interface PersonaDetalle extends PersonaFila {
  descripcion: string | null;
  opcion_pago: "cheque" | "transferencia" | "efectivo" | null;
  representante_legal_nombre: string | null;
  representante_legal_identificador: string | null;
  forma_pago: { nombre: string; dias_vence: number } | null;
  direcciones: PersonaDireccion[];
  datos_bancarios: {
    id: string;
    banco: string;
    tipo_cuenta: string;
    numero_cuenta: string;
    moneda: string;
  }[];
  archivos: { id: string; nombre: string; tipo: string | null; url: string }[];
}

export async function obtenerPersonaDetalle(personaId: string): Promise<PersonaDetalle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personas")
    .select(
      `id, tipo_persona, identificador, nombre_legal, nombre_comercial,
       nombres, apellido_paterno, apellido_materno, giro, descripcion,
       es_proveedor, es_empleado, es_cliente, es_contratista, es_transportista, vigente,
       opcion_pago, representante_legal_nombre, representante_legal_identificador,
       forma_pago:formas_pago ( nombre, dias_vence ),
       direcciones:persona_direcciones (
         id, tipo, nombre, direccion, region, provincia, comuna, email, telefono, telefono2,
         contactos:persona_contactos ( id, nombre, cargo, telefono, celular, email, vigente )
       ),
       datos_bancarios:persona_datos_bancarios (
         id, banco, tipo_cuenta, numero_cuenta, moneda
       ),
       archivos:persona_archivos ( id, nombre, tipo, url )`,
    )
    .eq("id", personaId)
    .single();

  if (error) throw error;
  return data as unknown as PersonaDetalle;
}

export interface FormaPagoFila {
  id: string;
  nombre: string;
  dias_vence: number;
  vigente: boolean;
}

export async function listarFormasPago(empresaId: string): Promise<FormaPagoFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formas_pago")
    .select("id, nombre, dias_vence, vigente")
    .eq("empresa_id", empresaId)
    .order("dias_vence");

  if (error) throw error;
  return data;
}

// ---------- clases de recurso (arbol de 3 niveles) y catalogo ----------

export interface ClaseRecursoFila {
  id: string;
  parent_id: string | null;
  codigo: string | null;
  nombre: string;
  imputable: boolean;
  cuenta_inventario: { codigo: string; nombre: string } | null;
  cuenta_venta: { codigo: string; nombre: string } | null;
  cuenta_costo_venta: { codigo: string; nombre: string } | null;
}

export async function listarClasesRecurso(empresaId: string): Promise<ClaseRecursoFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurso_clases")
    .select(
      `id, parent_id, codigo, nombre, imputable,
       cuenta_inventario:cuentas_contables!recurso_clases_cuenta_inventario_id_fkey ( codigo, nombre ),
       cuenta_venta:cuentas_contables!recurso_clases_cuenta_venta_id_fkey ( codigo, nombre ),
       cuenta_costo_venta:cuentas_contables!recurso_clases_cuenta_costo_venta_id_fkey ( codigo, nombre )`,
    )
    .eq("empresa_id", empresaId)
    .order("codigo");

  if (error) throw error;
  return data as unknown as ClaseRecursoFila[];
}

export interface RecursoFila {
  id: string;
  codigo: string;
  nombre: string;
  tipo_costo: string;
  unidad_compra: string;
  con_stock: boolean;
  vigente: boolean;
  clase: { id: string; nombre: string } | null;
  unidades_embalaje: { id: string; unidad: string; factor: number; precio: number | null }[];
}

export async function listarRecursos(empresaId: string): Promise<RecursoFila[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recursos")
    .select(
      `id, codigo, nombre, tipo_costo, unidad_compra, con_stock, vigente,
       clase:recurso_clases ( id, nombre ),
       unidades_embalaje:recurso_unidades_embalaje ( id, unidad, factor, precio )`,
    )
    .eq("empresa_id", empresaId)
    .order("codigo");

  if (error) throw error;
  return data as unknown as RecursoFila[];
}
