-- Estado actual del esquema, GENERADO desde una base con todas las
-- migraciones aplicadas. No editar a mano: ver supabase/schema/README.md.
-- Tablas: 36

create table areas (
  id uuid not null default gen_random_uuid(),
  presupuesto_id uuid not null,
  codigo text not null,
  nombre text not null,
  orden integer not null default 0,
  item text,
  unidad text not null default 'Global'::text,
  cantidad numeric(14, 5) not null default 1,
  check (((char_length(codigo) <= 10) and (codigo !~ '\s'::text))),
  foreign key (presupuesto_id) references presupuestos(id) on delete cascade,
  primary key (id)
);

create table configuraciones (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  modulo text not null,
  clave text not null,
  valor text not null,
  descripcion text,
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id),
  unique (empresa_id, modulo, clave)
);

create table cuentas_contables (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  codigo text not null,
  nombre text not null,
  vigente boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id),
  unique (empresa_id, codigo)
);

create table empresas (
  id uuid not null default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now(),
  identificador text,
  nombre_comercial text,
  nombre_legal text,
  giro text,
  direccion text,
  region text,
  provincia text,
  comuna text,
  telefono text,
  email text,
  web text,
  representante_legal_nombre text,
  representante_legal_identificador text,
  logo_url text,
  firma_digital_url text,
  pie_de_firma text,
  textos_bienvenida text,
  primary key (id)
);

create table formas_pago (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  nombre text not null,
  dias_vence integer not null default 0,
  vigente boolean not null default true,
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id),
  unique (empresa_id, nombre)
);

create table obras (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  nombre text not null,
  estado text not null default 'en_planificacion'::text,
  created_at timestamptz not null default now(),
  check ((estado = any (array['en_planificacion'::text, 'en_ejecucion'::text, 'cerrada'::text]))),
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id)
);

create table orden_compra_lineas (
  id uuid not null default gen_random_uuid(),
  orden_compra_id uuid not null,
  recurso_id uuid not null,
  solicitud_recurso_linea_id uuid,
  presupuesto_partida_id uuid,
  unidad_embalaje text,
  cantidad numeric(14, 4) not null,
  precio_unitario numeric(14, 2) not null default 0,
  descuento_pct numeric(6, 2) not null default 0,
  cantidad_recibida numeric(14, 4) not null default 0,
  notas text,
  orden integer not null default 0,
  foreign key (orden_compra_id) references ordenes_compra(id) on delete cascade,
  foreign key (presupuesto_partida_id) references presupuesto_partidas(id) on delete set null,
  foreign key (recurso_id) references recursos(id) on delete restrict,
  foreign key (solicitud_recurso_linea_id) references solicitud_recurso_lineas(id) on delete set null,
  primary key (id)
);

create table ordenes_compra (
  id uuid not null default gen_random_uuid(),
  obra_id uuid not null,
  numero integer not null,
  modo text not null default 'segun_presupuesto'::text,
  proveedor_id uuid not null,
  solicita text,
  forma_pago_id uuid,
  atencion text,
  moneda text not null default 'CLP'::text,
  cambio numeric(10, 4) not null default 1,
  f_emision date not null default CURRENT_DATE,
  f_vencimiento date,
  descripcion text,
  enviado_proveedor boolean not null default false,
  iva_pct numeric(6, 3) not null default 19,
  estado text not null default 'en_digitacion'::text,
  estado_aprobacion text not null default 'pendiente'::text,
  created_at timestamptz not null default now(),
  check ((estado_aprobacion = any (array['pendiente'::text, 'aprobado'::text, 'rechazado'::text]))),
  check ((estado = any (array['en_digitacion'::text, 'pendiente'::text, 'terminada'::text]))),
  check ((modo = any (array['segun_presupuesto'::text, 'libre'::text]))),
  foreign key (forma_pago_id) references formas_pago(id) on delete set null,
  foreign key (obra_id) references obras(id) on delete cascade,
  foreign key (proveedor_id) references personas(id) on delete restrict,
  primary key (id),
  unique (obra_id, numero)
);

create table partida_recursos (
  id uuid not null default gen_random_uuid(),
  presupuesto_partida_id uuid not null,
  recurso_id uuid not null,
  rendimiento numeric(10, 4) not null default 1,
  cantidad numeric(14, 4) not null default 0,
  precio_unitario numeric(14, 2) not null default 0,
  sugerido_por_agente boolean not null default false,
  agente_meta jsonb,
  orden integer not null default 0,
  factor numeric(10, 4) not null default 1,
  porcentaje numeric(6, 2),
  tipo_porcentaje_id uuid,
  comentario text,
  check ((factor <> (0)::numeric)),
  foreign key (presupuesto_partida_id) references presupuesto_partidas(id) on delete cascade,
  foreign key (recurso_id) references recursos(id) on delete restrict,
  foreign key (tipo_porcentaje_id) references tipos_porcentaje(id) on delete set null,
  primary key (id)
);

create table partidas (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  codigo text not null,
  nombre text not null,
  unidad text not null,
  created_at timestamptz not null default now(),
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id),
  unique (empresa_id, codigo)
);

create table perfil_permisos (
  id uuid not null default gen_random_uuid(),
  perfil_id uuid not null,
  modulo text not null,
  accion text not null,
  check ((accion = any (array['ver'::text, 'crear'::text, 'editar'::text, 'eliminar'::text, 'aprobar'::text]))),
  foreign key (perfil_id) references perfiles(id) on delete cascade,
  primary key (id),
  unique (perfil_id, modulo, accion)
);

create table perfiles (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  codigo text not null,
  nombre text not null,
  descripcion text,
  created_at timestamptz not null default now(),
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id),
  unique (empresa_id, codigo)
);

create table persona_archivos (
  id uuid not null default gen_random_uuid(),
  persona_id uuid not null,
  nombre text not null,
  tipo text,
  url text not null,
  created_at timestamptz not null default now(),
  foreign key (persona_id) references personas(id) on delete cascade,
  primary key (id)
);

create table persona_contactos (
  id uuid not null default gen_random_uuid(),
  direccion_id uuid not null,
  nombre text not null,
  cargo text,
  telefono text,
  celular text,
  email text,
  vigente boolean not null default true,
  notas text,
  foreign key (direccion_id) references persona_direcciones(id) on delete cascade,
  primary key (id)
);

create table persona_datos_bancarios (
  id uuid not null default gen_random_uuid(),
  persona_id uuid not null,
  banco text not null,
  tipo_cuenta text not null default 'corriente'::text,
  numero_cuenta text not null,
  moneda text not null default 'CLP'::text,
  check ((tipo_cuenta = any (array['corriente'::text, 'vista'::text, 'ahorro'::text]))),
  foreign key (persona_id) references personas(id) on delete cascade,
  primary key (id)
);

create table persona_direcciones (
  id uuid not null default gen_random_uuid(),
  persona_id uuid not null,
  tipo text not null default 'principal'::text,
  nombre text,
  direccion text not null,
  region text,
  provincia text,
  comuna text,
  email text,
  telefono text,
  telefono2 text,
  notas text,
  check ((tipo = any (array['principal'::text, 'sucursal'::text]))),
  foreign key (persona_id) references personas(id) on delete cascade,
  primary key (id)
);

create table personas (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  tipo_persona text not null default 'empresa'::text,
  identificador text not null,
  nombre_legal text,
  nombre_comercial text,
  nombres text,
  apellido_paterno text,
  apellido_materno text,
  giro text,
  descripcion text,
  es_proveedor boolean not null default false,
  es_empleado boolean not null default false,
  es_cliente boolean not null default false,
  es_contratista boolean not null default false,
  es_transportista boolean not null default false,
  vigente boolean not null default true,
  created_at timestamptz not null default now(),
  forma_pago_id uuid,
  opcion_pago text,
  representante_legal_nombre text,
  representante_legal_identificador text,
  check ((opcion_pago = any (array['cheque'::text, 'transferencia'::text, 'efectivo'::text]))),
  check ((tipo_persona = any (array['empresa'::text, 'natural'::text]))),
  foreign key (empresa_id) references empresas(id) on delete cascade,
  foreign key (forma_pago_id) references formas_pago(id) on delete set null,
  primary key (id),
  unique (empresa_id, identificador)
);

create table presupuesto_carpetas (
  id uuid not null default gen_random_uuid(),
  obra_id uuid not null,
  parent_id uuid,
  nombre text not null,
  foreign key (obra_id) references obras(id) on delete cascade,
  foreign key (parent_id) references presupuesto_carpetas(id) on delete cascade,
  primary key (id)
);

create table presupuesto_estados (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  nombre text not null,
  es_aprobado boolean not null default false,
  orden integer not null default 0,
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id),
  unique (empresa_id, nombre)
);

create table presupuesto_grupos (
  id uuid not null default gen_random_uuid(),
  area_id uuid not null,
  parent_id uuid,
  tipo text not null default 'grupo'::text,
  codigo text,
  item text,
  nombre text not null,
  orden integer not null default 0,
  check ((tipo = any (array['grupo'::text, 'titulo'::text]))),
  foreign key (area_id) references areas(id) on delete cascade,
  foreign key (parent_id) references presupuesto_grupos(id) on delete cascade,
  primary key (id)
);

create table presupuesto_partidas (
  id uuid not null default gen_random_uuid(),
  area_id uuid not null,
  partida_id uuid not null,
  cantidad numeric(14, 2) not null default 1,
  imprevistos_pct numeric(6, 3) not null default 0,
  gastos_generales_pct numeric(6, 3) not null default 0,
  utilidad_pct numeric(6, 3) not null default 0,
  precio_unitario_total numeric(14, 2) not null default 0,
  orden integer not null default 0,
  grupo_id uuid,
  imprevistos_manual boolean not null default false,
  gastos_generales_manual boolean not null default false,
  utilidad_manual boolean not null default false,
  iniciada boolean not null default false,
  iniciada_en timestamptz,
  autorizacion_motivo text,
  foreign key (area_id) references areas(id) on delete cascade,
  foreign key (grupo_id) references presupuesto_grupos(id) on delete set null,
  foreign key (partida_id) references partidas(id) on delete restrict,
  primary key (id)
);

create table presupuestos (
  id uuid not null default gen_random_uuid(),
  obra_id uuid not null,
  carpeta_id uuid,
  numero integer not null,
  nombre text not null,
  vigente boolean not null default true,
  version_tipo text not null default 'trabajo'::text,
  presupuesto_original_id uuid,
  created_at timestamptz not null default now(),
  cliente_id uuid,
  contacto_id uuid,
  pie_firma text,
  descripcion text,
  notas text,
  categoria text,
  imprevistos_pct numeric(6, 3) not null default 0,
  gastos_generales_pct numeric(6, 3) not null default 0,
  utilidad_pct numeric(6, 3) not null default 0,
  iva_pct numeric(6, 3) not null default 0,
  credito_iva_pct numeric(6, 3) not null default 0,
  incluir_pct_en_pu boolean not null default false,
  estado_id uuid not null,
  check ((version_tipo = any (array['original'::text, 'trabajo'::text]))),
  foreign key (carpeta_id) references presupuesto_carpetas(id) on delete set null,
  foreign key (cliente_id) references personas(id) on delete set null,
  foreign key (contacto_id) references persona_contactos(id) on delete set null,
  foreign key (estado_id) references presupuesto_estados(id),
  foreign key (obra_id) references obras(id) on delete cascade,
  foreign key (presupuesto_original_id) references presupuestos(id) on delete set null,
  primary key (id),
  unique (obra_id, numero)
);

create table recurso_archivos (
  id uuid not null default gen_random_uuid(),
  recurso_id uuid not null,
  nombre text not null,
  tipo text,
  url text not null,
  created_at timestamptz not null default now(),
  foreign key (recurso_id) references recursos(id) on delete cascade,
  primary key (id)
);

create table recurso_clases (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  parent_id uuid,
  nombre text not null,
  codigo text,
  cuenta_inventario_id uuid,
  cuenta_venta_id uuid,
  cuenta_costo_venta_id uuid,
  imputable boolean not null default true,
  foreign key (cuenta_costo_venta_id) references cuentas_contables(id) on delete set null,
  foreign key (cuenta_inventario_id) references cuentas_contables(id) on delete set null,
  foreign key (cuenta_venta_id) references cuentas_contables(id) on delete set null,
  foreign key (empresa_id) references empresas(id) on delete cascade,
  foreign key (parent_id) references recurso_clases(id) on delete cascade,
  primary key (id)
);

create table recurso_unidades_embalaje (
  id uuid not null default gen_random_uuid(),
  recurso_id uuid not null,
  unidad text not null,
  factor numeric(14, 4) not null,
  precio numeric(14, 2),
  foreign key (recurso_id) references recursos(id) on delete cascade,
  primary key (id)
);

create table recursos (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  clase_id uuid,
  codigo text not null,
  nombre text not null,
  tipo_costo text not null,
  unidad_compra text not null,
  unidad_consumo text not null,
  con_stock boolean not null default false,
  vigente boolean not null default true,
  created_at timestamptz not null default now(),
  tipo_uso text not null default 'comprable'::text,
  receta boolean not null default false,
  bloqueo_salida boolean not null default false,
  bien_servicio text not null default 'bien'::text,
  ubicacion text,
  cod_barra text,
  cod_interno text,
  rezagado boolean not null default false,
  material_menor boolean not null default false,
  check ((bien_servicio = any (array['bien'::text, 'servicio'::text]))),
  check ((tipo_costo = any (array['material'::text, 'mano_de_obra'::text, 'subcontrato'::text, 'maquinaria'::text, 'servicio'::text, 'herramienta'::text, 'otros'::text]))),
  check ((tipo_uso = any (array['comprable'::text, 'vendible'::text, 'ambos'::text]))),
  foreign key (clase_id) references recurso_clases(id) on delete set null,
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id),
  unique (empresa_id, codigo)
);

create table solicitud_cotizacion_lineas (
  id uuid not null default gen_random_uuid(),
  solicitud_cotizacion_id uuid not null,
  recurso_id uuid not null,
  solicitud_recurso_linea_id uuid,
  cantidad numeric(14, 4) not null,
  notas text,
  orden integer not null default 0,
  foreign key (recurso_id) references recursos(id) on delete restrict,
  foreign key (solicitud_cotizacion_id) references solicitudes_cotizacion(id) on delete cascade,
  foreign key (solicitud_recurso_linea_id) references solicitud_recurso_lineas(id) on delete set null,
  primary key (id)
);

create table solicitud_cotizacion_precios (
  id uuid not null default gen_random_uuid(),
  linea_id uuid not null,
  proveedor_id uuid not null,
  precio numeric(14, 2),
  descuento_pct numeric(6, 2) not null default 0,
  foreign key (linea_id) references solicitud_cotizacion_lineas(id) on delete cascade,
  foreign key (proveedor_id) references solicitud_cotizacion_proveedores(id) on delete cascade,
  primary key (id),
  unique (linea_id, proveedor_id)
);

create table solicitud_cotizacion_proveedores (
  id uuid not null default gen_random_uuid(),
  solicitud_cotizacion_id uuid not null,
  proveedor_id uuid not null,
  forma_pago_id uuid,
  atiende text,
  fono_atiende text,
  email_atiende text,
  enviado boolean not null default false,
  notas text,
  foreign key (forma_pago_id) references formas_pago(id) on delete set null,
  foreign key (proveedor_id) references personas(id) on delete restrict,
  foreign key (solicitud_cotizacion_id) references solicitudes_cotizacion(id) on delete cascade,
  primary key (id),
  unique (solicitud_cotizacion_id, proveedor_id)
);

create table solicitud_recurso_lineas (
  id uuid not null default gen_random_uuid(),
  solicitud_id uuid not null,
  recurso_id uuid not null,
  presupuesto_partida_id uuid,
  cantidad numeric(14, 4) not null,
  unidad_embalaje text,
  factor numeric(10, 4) not null default 1,
  urgencia_id uuid,
  notas text,
  cantidad_cotizada numeric(14, 4) not null default 0,
  cantidad_comprada numeric(14, 4) not null default 0,
  estado text not null default 'pendiente'::text,
  orden integer not null default 0,
  check ((estado = any (array['pendiente'::text, 'terminada'::text]))),
  foreign key (presupuesto_partida_id) references presupuesto_partidas(id) on delete set null,
  foreign key (recurso_id) references recursos(id) on delete restrict,
  foreign key (solicitud_id) references solicitudes_recursos(id) on delete cascade,
  foreign key (urgencia_id) references urgencias(id) on delete set null,
  primary key (id)
);

create table solicitudes_cotizacion (
  id uuid not null default gen_random_uuid(),
  obra_id uuid not null,
  numero integer not null,
  descripcion text,
  solicita text,
  fono_solicita text,
  email_solicita text,
  moneda text not null default 'CLP'::text,
  cambio numeric(10, 4) not null default 1,
  f_emision date not null default CURRENT_DATE,
  f_esperada date,
  estado text not null default 'en_digitacion'::text,
  estado_aprobacion text not null default 'pendiente'::text,
  created_at timestamptz not null default now(),
  check ((estado_aprobacion = any (array['pendiente'::text, 'aprobado'::text, 'rechazado'::text]))),
  check ((estado = any (array['en_digitacion'::text, 'pendiente'::text, 'terminada'::text]))),
  foreign key (obra_id) references obras(id) on delete cascade,
  primary key (id),
  unique (obra_id, numero)
);

create table solicitudes_recursos (
  id uuid not null default gen_random_uuid(),
  obra_id uuid not null,
  numero integer not null,
  tipo_solicitud text not null default 'segun_presupuesto'::text,
  descripcion text,
  solicita text,
  f_emision date not null default CURRENT_DATE,
  f_esperada_recepcion date,
  estado text not null default 'en_digitacion'::text,
  estado_aprobacion text not null default 'pendiente'::text,
  created_at timestamptz not null default now(),
  check ((estado_aprobacion = any (array['pendiente'::text, 'aprobado'::text, 'rechazado'::text]))),
  check ((estado = any (array['en_digitacion'::text, 'pendiente'::text, 'terminada'::text]))),
  check ((tipo_solicitud = any (array['segun_presupuesto'::text, 'libre'::text]))),
  foreign key (obra_id) references obras(id) on delete cascade,
  primary key (id),
  unique (obra_id, numero)
);

create table tipos_porcentaje (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  nombre text not null,
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id),
  unique (empresa_id, nombre)
);

create table urgencias (
  id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  nombre text not null,
  orden integer not null default 0,
  foreign key (empresa_id) references empresas(id) on delete cascade,
  primary key (id),
  unique (empresa_id, nombre)
);

create table usuario_obras (
  id uuid not null default gen_random_uuid(),
  auth_user_id uuid not null,
  obra_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (auth_user_id) references auth.users(id) on delete cascade,
  foreign key (obra_id) references obras(id) on delete cascade,
  primary key (id),
  unique (auth_user_id, obra_id)
);

create table usuario_perfil (
  id uuid not null default gen_random_uuid(),
  auth_user_id uuid not null,
  empresa_id uuid not null,
  nombre text not null,
  cargo text,
  telefono text,
  firma_digital_url text,
  notas text,
  created_at timestamptz not null default now(),
  perfil_id uuid,
  acceso_todas_las_obras boolean not null default false,
  foreign key (auth_user_id) references auth.users(id) on delete cascade,
  foreign key (empresa_id) references empresas(id) on delete cascade,
  foreign key (perfil_id) references perfiles(id) on delete restrict,
  primary key (id),
  unique (auth_user_id)
);

