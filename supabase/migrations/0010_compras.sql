-- Modulo Compras: Solicitud de Recursos -> Solicitud de Cotizacion -> Orden de
-- Compra (ver docs/proceso-control-costos.md y docs/modulo-compras.md, locales
-- fuera de git). Cuadro Comparativo y Gestion de Compras quedan como vistas
-- calculadas sobre estas tablas, no como tablas propias (mismo patron que la
-- Comparacion Original-Trabajo del Presupuesto).

-- ---------- catalogo de urgencia (mantenible, no enum fijo) ----------

create table urgencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  orden integer not null default 0,
  unique (empresa_id, nombre)
);

insert into urgencias (empresa_id, nombre, orden)
select id, n, o from empresas,
  unnest(array['8 horas', '1 dia', '2 dias', '4 dias', '5 dias', '8 dias', '10 dias', '15 dias'])
    with ordinality as t(n, o);

-- ---------- recursos: columnas nuevas del catalogo maestro ----------

alter table recursos
  add column bien_servicio text not null default 'bien' check (bien_servicio in ('bien', 'servicio')),
  add column ubicacion text,
  add column cod_barra text,
  add column cod_interno text,
  add column rezagado boolean not null default false,
  add column material_menor boolean not null default false;

-- ---------- Solicitud de Recursos (paso 03) ----------

create table solicitudes_recursos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  numero integer not null,
  tipo_solicitud text not null default 'segun_presupuesto'
    check (tipo_solicitud in ('segun_presupuesto', 'libre')),
  descripcion text,
  solicita text,
  f_emision date not null default current_date,
  f_esperada_recepcion date,
  estado text not null default 'en_digitacion'
    check (estado in ('en_digitacion', 'pendiente', 'terminada')),
  estado_aprobacion text not null default 'pendiente'
    check (estado_aprobacion in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz not null default now(),
  unique (obra_id, numero)
);

create table solicitud_recurso_lineas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes_recursos(id) on delete cascade,
  recurso_id uuid not null references recursos(id) on delete restrict,
  presupuesto_partida_id uuid references presupuesto_partidas(id) on delete set null,
  cantidad numeric(14, 4) not null,
  unidad_embalaje text,
  factor numeric(10, 4) not null default 1,
  urgencia_id uuid references urgencias(id) on delete set null,
  notas text,
  -- acumuladores de trazabilidad: cuanto de esta linea ya se coloco en una
  -- cotizacion / orden de compra (ver "Recursos Pedido Ordenado Recibido")
  cantidad_cotizada numeric(14, 4) not null default 0,
  cantidad_comprada numeric(14, 4) not null default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'terminada')),
  orden integer not null default 0
);

-- ---------- Solicitud de Cotizacion (paso 04) ----------

create table solicitudes_cotizacion (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  numero integer not null,
  descripcion text,
  solicita text,
  fono_solicita text,
  email_solicita text,
  moneda text not null default 'CLP',
  cambio numeric(10, 4) not null default 1,
  f_emision date not null default current_date,
  f_esperada date,
  estado text not null default 'en_digitacion'
    check (estado in ('en_digitacion', 'pendiente', 'terminada')),
  estado_aprobacion text not null default 'pendiente'
    check (estado_aprobacion in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz not null default now(),
  unique (obra_id, numero)
);

create table solicitud_cotizacion_lineas (
  id uuid primary key default gen_random_uuid(),
  solicitud_cotizacion_id uuid not null references solicitudes_cotizacion(id) on delete cascade,
  recurso_id uuid not null references recursos(id) on delete restrict,
  -- de donde vino la linea: "Desde SR" (trazabilidad), null si se agrego libre
  solicitud_recurso_linea_id uuid references solicitud_recurso_lineas(id) on delete set null,
  cantidad numeric(14, 4) not null,
  notas text,
  orden integer not null default 0
);

-- proveedor invitado a cotizar (persona con es_proveedor = true)
create table solicitud_cotizacion_proveedores (
  id uuid primary key default gen_random_uuid(),
  solicitud_cotizacion_id uuid not null references solicitudes_cotizacion(id) on delete cascade,
  proveedor_id uuid not null references personas(id) on delete restrict,
  forma_pago_id uuid references formas_pago(id) on delete set null,
  atiende text,
  fono_atiende text,
  email_atiende text,
  enviado boolean not null default false,
  notas text,
  unique (solicitud_cotizacion_id, proveedor_id)
);

-- precio cotizado por un proveedor para una linea especifica: la base del
-- Cuadro Comparativo (reporte calculado, hasta 4 proveedores en paralelo)
create table solicitud_cotizacion_precios (
  id uuid primary key default gen_random_uuid(),
  linea_id uuid not null references solicitud_cotizacion_lineas(id) on delete cascade,
  proveedor_id uuid not null references solicitud_cotizacion_proveedores(id) on delete cascade,
  precio numeric(14, 2),
  descuento_pct numeric(6, 2) not null default 0,
  unique (linea_id, proveedor_id)
);

-- ---------- Orden de Compra (paso 06) ----------

create table ordenes_compra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  numero integer not null,
  modo text not null default 'segun_presupuesto'
    check (modo in ('segun_presupuesto', 'libre')),
  proveedor_id uuid not null references personas(id) on delete restrict,
  solicita text,
  forma_pago_id uuid references formas_pago(id) on delete set null,
  atencion text,
  moneda text not null default 'CLP',
  cambio numeric(10, 4) not null default 1,
  f_emision date not null default current_date,
  f_vencimiento date,
  descripcion text,
  enviado_proveedor boolean not null default false,
  iva_pct numeric(6, 3) not null default 19,
  estado text not null default 'en_digitacion'
    check (estado in ('en_digitacion', 'pendiente', 'terminada')),
  estado_aprobacion text not null default 'pendiente'
    check (estado_aprobacion in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz not null default now(),
  unique (obra_id, numero)
);

create table orden_compra_lineas (
  id uuid primary key default gen_random_uuid(),
  orden_compra_id uuid not null references ordenes_compra(id) on delete cascade,
  recurso_id uuid not null references recursos(id) on delete restrict,
  -- trazabilidad: de que linea de Solicitud de Recursos vino esta compra
  solicitud_recurso_linea_id uuid references solicitud_recurso_lineas(id) on delete set null,
  presupuesto_partida_id uuid references presupuesto_partidas(id) on delete set null,
  unidad_embalaje text,
  cantidad numeric(14, 4) not null,
  precio_unitario numeric(14, 2) not null default 0,
  descuento_pct numeric(6, 2) not null default 0,
  cantidad_recibida numeric(14, 4) not null default 0,
  notas text,
  orden integer not null default 0
);

-- ---------- RLS ----------

alter table urgencias enable row level security;
alter table solicitudes_recursos enable row level security;
alter table solicitud_recurso_lineas enable row level security;
alter table solicitudes_cotizacion enable row level security;
alter table solicitud_cotizacion_lineas enable row level security;
alter table solicitud_cotizacion_proveedores enable row level security;
alter table solicitud_cotizacion_precios enable row level security;
alter table ordenes_compra enable row level security;
alter table orden_compra_lineas enable row level security;

create policy "autenticados leen y escriben" on urgencias
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on solicitudes_recursos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on solicitud_recurso_lineas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on solicitudes_cotizacion
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on solicitud_cotizacion_lineas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on solicitud_cotizacion_proveedores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on solicitud_cotizacion_precios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on ordenes_compra
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on orden_compra_lineas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
