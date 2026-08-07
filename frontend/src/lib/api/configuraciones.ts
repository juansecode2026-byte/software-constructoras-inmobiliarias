// Configuraciones basicas. Mismas firmas que lib/supabase/configuraciones.ts,
// pero sin el parametro empresaId: el backend lo resuelve del token.

import { api } from "./client";

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

export function obtenerEmpresaDetalle(): Promise<EmpresaDetalle> {
  return api.get<EmpresaDetalle>("configuraciones/empresa");
}

export type DatosEmpresa = Omit<EmpresaDetalle, "id" | "nombre" | "logo_url" | "firma_digital_url">;

export function guardarEmpresa(datos: DatosEmpresa): Promise<{ ok: string }> {
  return api.put<{ ok: string }>("configuraciones/empresa", datos);
}

export function registrarLogoEmpresa(ruta: string): Promise<{ ok: string; anterior: string | null }> {
  return api.put("configuraciones/empresa/logo", { ruta });
}
export function quitarLogoEmpresa(): Promise<{ ok: string; anterior: string | null }> {
  return api.borrar("configuraciones/empresa/logo");
}
export function registrarFirmaEmpresa(ruta: string): Promise<{ ok: string; anterior: string | null }> {
  return api.put("configuraciones/empresa/firma", { ruta });
}
export function quitarFirmaEmpresaApi(): Promise<{ ok: string; anterior: string | null }> {
  return api.borrar("configuraciones/empresa/firma");
}

export interface ConfiguracionFila {
  id: string;
  modulo: string;
  clave: string;
  valor: string;
  descripcion: string | null;
}

export function listarConfiguraciones(): Promise<ConfiguracionFila[]> {
  return api.get<ConfiguracionFila[]>("configuraciones/parametros");
}

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

export function listarPersonas(): Promise<PersonaFila[]> {
  return api.get<PersonaFila[]>("configuraciones/personas");
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

export function obtenerPersonaDetalle(personaId: string): Promise<PersonaDetalle> {
  return api.get<PersonaDetalle>(`configuraciones/personas/${personaId}`);
}

export interface FormaPagoFila {
  id: string;
  nombre: string;
  dias_vence: number;
  vigente: boolean;
}

export function listarFormasPago(): Promise<FormaPagoFila[]> {
  return api.get<FormaPagoFila[]>("configuraciones/formas-pago");
}

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

export function listarRecursosYClases(): Promise<{ clases: ClaseRecursoFila[]; recursos: RecursoFila[] }> {
  return api.get("configuraciones/recursos");
}
