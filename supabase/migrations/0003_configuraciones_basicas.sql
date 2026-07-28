-- Configuraciones basicas: empresa (identidad documental), plan de cuentas minimo,
-- clases de recurso con vinculos contables, personas (terceros) con tablas hijas,
-- unidades de embalaje / archivos de catalogo por recurso, y parametros por modulo.
-- Sistema a la medida de un solo cliente/usuario: sin licencias, sin permisos
-- granulares, sin dimension pais.

-- ---------- empresa: identidad completa para generar documentos ----------

alter table empresas
  add column identificador text,          -- RUT/NIT de la empresa
  add column nombre_comercial text,
  add column nombre_legal text,           -- razon social
  add column giro text,
  add column direccion text,
  add column region text,
  add column provincia text,
  add column comuna text,
  add column telefono text,
  add column email text,
  add column web text,
  add column representante_legal_nombre text,
  add column representante_legal_identificador text,
  add column logo_url text,
  add column firma_digital_url text,
  add column pie_de_firma text,
  add column textos_bienvenida text;      -- texto configurable que se muestra en Inicio

-- ---------- plan de cuentas minimo ----------
-- Necesario antes de lo planeado porque las clases de recurso imputan a cuentas.

create table cuentas_contables (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  vigente boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, codigo)
);

-- ---------- clases de recurso: codigo + 3 vinculos contables + imputable ----------
-- El arbol de 3 niveles ya lo soporta parent_id (recursivo); se agrega lo contable.

alter table recurso_clases
  add column codigo text,
  add column cuenta_inventario_id uuid references cuentas_contables(id) on delete set null,
  add column cuenta_venta_id uuid references cuentas_contables(id) on delete set null,
  add column cuenta_costo_venta_id uuid references cuentas_contables(id) on delete set null,
  add column imputable boolean not null default true;

-- ---------- personas: directorio de terceros (proveedores, clientes, etc.) ----------

create table personas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo_persona text not null default 'empresa'
    check (tipo_persona in ('empresa', 'natural')),
  identificador text not null,            -- RUT/NIT del tercero
  -- tipo_persona = 'empresa'
  nombre_legal text,                      -- razon social
  nombre_comercial text,                  -- nombre fantasia
  -- tipo_persona = 'natural'
  nombres text,
  apellido_paterno text,
  apellido_materno text,
  giro text,
  descripcion text,
  -- roles simultaneos: flags independientes, no un enum
  es_proveedor boolean not null default false,
  es_empleado boolean not null default false,
  es_cliente boolean not null default false,
  es_contratista boolean not null default false,
  es_transportista boolean not null default false,
  vigente boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, identificador)
);

create table persona_direcciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  tipo text not null default 'principal'
    check (tipo in ('principal', 'sucursal')),
  nombre text,                            -- nombre de la sucursal
  direccion text not null,
  region text,
  provincia text,
  comuna text,
  email text,
  telefono text,
  telefono2 text,
  notas text
);

-- el contacto cuelga de una direccion/sucursal especifica, no directo de la persona
create table persona_contactos (
  id uuid primary key default gen_random_uuid(),
  direccion_id uuid not null references persona_direcciones(id) on delete cascade,
  nombre text not null,
  cargo text,
  telefono text,
  celular text,
  email text,
  vigente boolean not null default true,
  notas text
);

create table persona_datos_bancarios (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  banco text not null,
  tipo_cuenta text not null default 'corriente'
    check (tipo_cuenta in ('corriente', 'vista', 'ahorro')),
  numero_cuenta text not null,
  forma_pago text,                        -- ej. '60 dias contra factura'
  moneda text not null default 'CLP'
);

-- ---------- recursos: unidades de embalaje y archivos de catalogo ----------

-- factor = cuantas unidades base equivalen a una unidad de embalaje
-- (ej. unidad = litro, embalaje = tambor 200 L => factor = 200)
create table recurso_unidades_embalaje (
  id uuid primary key default gen_random_uuid(),
  recurso_id uuid not null references recursos(id) on delete cascade,
  unidad text not null,
  factor numeric(14, 4) not null,
  precio numeric(14, 2)
);

create table recurso_archivos (
  id uuid primary key default gen_random_uuid(),
  recurso_id uuid not null references recursos(id) on delete cascade,
  nombre text not null,
  tipo text,                              -- ej. 'ficha tecnica', 'imagen'
  url text not null,
  created_at timestamptz not null default now()
);

-- ---------- parametros por modulo (tabla plana; la UI los agrupa en pestanas) ----------

create table configuraciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  modulo text not null,                   -- 'general' | 'presupuesto' | 'recursos' | 'compras' ...
  clave text not null,
  valor text not null,
  descripcion text,
  unique (empresa_id, modulo, clave)
);

-- ---------- RLS ----------

alter table cuentas_contables enable row level security;
alter table personas enable row level security;
alter table persona_direcciones enable row level security;
alter table persona_contactos enable row level security;
alter table persona_datos_bancarios enable row level security;
alter table recurso_unidades_embalaje enable row level security;
alter table recurso_archivos enable row level security;
alter table configuraciones enable row level security;

create policy "autenticados leen y escriben" on cuentas_contables
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on personas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on persona_direcciones
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on persona_contactos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on persona_datos_bancarios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on recurso_unidades_embalaje
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on recurso_archivos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on configuraciones
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
