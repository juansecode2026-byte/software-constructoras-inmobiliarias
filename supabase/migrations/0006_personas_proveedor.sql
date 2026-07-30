-- Ajustes al modulo Personas segun el cruce del video tutorial de referencia
-- (ver docs/creacion-edicion-personas.md local): catalogo de formas de pago,
-- datos de pago a nivel del rol proveedor (no de cada cuenta bancaria),
-- representante legal propio y adjuntos por persona.

-- ---------- catalogo mantenible de formas de pago ----------

create table formas_pago (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  dias_vence integer not null default 0,
  vigente boolean not null default true,
  unique (empresa_id, nombre)
);

insert into formas_pago (empresa_id, nombre, dias_vence)
select e.id, f.nombre, f.dias
from empresas e,
  (values
    ('Contado', 0),
    ('Contra factura 30 dias', 30),
    ('60 dias contra factura', 60),
    ('30% contado, 70% a 30 dias', 30),
    ('Cheque a 30 dias', 30),
    ('Anticipo proveedor', 0)
  ) as f(nombre, dias);

-- ---------- datos de pago: son del rol proveedor, no de la cuenta bancaria ----------

alter table personas
  add column forma_pago_id uuid references formas_pago(id) on delete set null,
  add column opcion_pago text check (opcion_pago in ('cheque', 'transferencia', 'efectivo')),
  add column representante_legal_nombre text,
  add column representante_legal_identificador text;

-- la forma de pago se movio a personas; cada cuenta bancaria solo describe la cuenta
alter table persona_datos_bancarios drop column forma_pago;

-- ---------- adjuntos por persona (mismo patron que recurso_archivos) ----------

create table persona_archivos (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  nombre text not null,
  tipo text,
  url text not null,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------

alter table formas_pago enable row level security;
alter table persona_archivos enable row level security;

create policy "autenticados leen y escriben" on formas_pago
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on persona_archivos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- datos de ejemplo coherentes con el seed existente ----------

update personas set
  forma_pago_id = (select id from formas_pago where nombre = '60 dias contra factura' limit 1),
  opcion_pago = 'transferencia',
  representante_legal_nombre = 'Ricardo Pena Soto',
  representante_legal_identificador = '13.442.887-1'
where identificador = '76.998.211-3';
