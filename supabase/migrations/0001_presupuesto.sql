-- Modelo de datos real para el modulo Presupuesto.
-- Reemplaza los datos hardcodeados de src/features/erp/data.ts.
-- Tenancy: single-tenant ahora (una constructora), multi-tenant-ready por diseno
-- (todo cuelga de empresa_id, RLS activo desde el dia uno).

create extension if not exists "pgcrypto";

-- ---------- tenancy ----------

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

create table obras (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  estado text not null default 'en_planificacion'
    check (estado in ('en_planificacion', 'en_ejecucion', 'cerrada')),
  created_at timestamptz not null default now()
);

-- ---------- catalogo de recursos (insumos) ----------

create table recurso_clases (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  parent_id uuid references recurso_clases(id) on delete cascade,
  nombre text not null
);

create table recursos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  clase_id uuid references recurso_clases(id) on delete set null,
  codigo text not null,
  nombre text not null,
  tipo_costo text not null
    check (tipo_costo in ('material', 'mano_de_obra', 'subcontrato', 'maquinaria', 'servicio')),
  unidad_compra text not null,
  unidad_consumo text not null,
  con_stock boolean not null default false,
  vigente boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, codigo)
);

-- ---------- presupuesto ----------

create table presupuesto_carpetas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  parent_id uuid references presupuesto_carpetas(id) on delete cascade,
  nombre text not null
);

create table presupuestos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  carpeta_id uuid references presupuesto_carpetas(id) on delete set null,
  numero integer not null,
  nombre text not null,
  estado text not null default 'en_proceso'
    check (estado in ('en_proceso', 'aprobado')),
  vigente boolean not null default true,
  version_tipo text not null default 'trabajo'
    check (version_tipo in ('original', 'trabajo')),
  -- si version_tipo = 'trabajo', apunta a su version 'original' congelada (linea base fija)
  presupuesto_original_id uuid references presupuestos(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (obra_id, numero)
);

create table areas (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references presupuestos(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  orden integer not null default 0
);

-- catalogo maestro de partidas, reutilizable entre presupuestos
create table partidas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  unidad text not null,
  created_at timestamptz not null default now(),
  unique (empresa_id, codigo)
);

-- una instancia de una partida dentro de un area de un presupuesto especifico:
-- cada uso puede tener su propio costeo (precio_unitario_total es cache, se
-- recalcula desde partida_recursos)
create table presupuesto_partidas (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete cascade,
  partida_id uuid not null references partidas(id) on delete restrict,
  cantidad numeric(14, 2) not null default 1,
  imprevistos_pct numeric(6, 3) not null default 0,
  gastos_generales_pct numeric(6, 3) not null default 0,
  utilidad_pct numeric(6, 3) not null default 0,
  precio_unitario_total numeric(14, 2) not null default 0,
  grupo text,
  orden integer not null default 0
);

-- analisis de precio unitario (APU): recursos que componen una partida-en-presupuesto
create table partida_recursos (
  id uuid primary key default gen_random_uuid(),
  presupuesto_partida_id uuid not null references presupuesto_partidas(id) on delete cascade,
  recurso_id uuid not null references recursos(id) on delete restrict,
  rendimiento numeric(10, 4) not null default 1,
  cantidad numeric(14, 4) not null default 0,
  precio_unitario numeric(14, 2) not null default 0,
  -- marca cuando el agente de compras sugirio este recurso/proveedor; el detalle
  -- de la sugerencia (proveedor, % de ahorro, comparacion) vive en agente_meta
  sugerido_por_agente boolean not null default false,
  agente_meta jsonb,
  orden integer not null default 0
);

-- ---------- RLS: activo desde el dia uno, aunque hoy solo exista una empresa ----------

alter table empresas enable row level security;
alter table obras enable row level security;
alter table recurso_clases enable row level security;
alter table recursos enable row level security;
alter table presupuesto_carpetas enable row level security;
alter table presupuestos enable row level security;
alter table areas enable row level security;
alter table partidas enable row level security;
alter table presupuesto_partidas enable row level security;
alter table partida_recursos enable row level security;

-- V1: RLS abierta a cualquier usuario autenticado (single-tenant, un solo cliente).
-- Cuando exista tabla de usuarios/roles, se reemplaza por politicas por empresa_id.
create policy "autenticados leen y escriben" on empresas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on obras
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on recurso_clases
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on recursos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on presupuesto_carpetas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on presupuestos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on areas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on partidas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on presupuesto_partidas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on partida_recursos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
