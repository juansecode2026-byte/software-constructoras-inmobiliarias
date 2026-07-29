-- Estructura completa del modulo Presupuesto segun el analisis del webinar de
-- referencia (texto + imagenes, ver docs/modulo-presupuesto*.md locales):
-- grupos/titulos visuales anidables, campos reales de areas, cabecera completa
-- del presupuesto (cliente, %s globales, IVA), porcentajes por recurso del APU,
-- flags manuales por partida y columnas faltantes del maestro de recursos.

-- ---------- grupos y titulos: arbol visual entre area y partida ----------
-- Solo Area/Partida/Recurso son controlables; el grupo agrupa visualmente y su
-- subtotal se calcula al vuelo (no se almacena). Un titulo es solo un separador.

create table presupuesto_grupos (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete cascade,
  parent_id uuid references presupuesto_grupos(id) on delete cascade,
  tipo text not null default 'grupo' check (tipo in ('grupo', 'titulo')),
  codigo text,
  item text,
  nombre text not null,
  orden integer not null default 0
);

alter table presupuesto_partidas
  add column grupo_id uuid references presupuesto_grupos(id) on delete set null;

-- la columna plana queda reemplazada por el arbol
alter table presupuesto_partidas drop column grupo;

-- ---------- areas: campos reales ----------
-- codigo: max 10 caracteres, sin espacios (regla del sistema de referencia)

alter table areas
  add column item text,
  add column unidad text not null default 'Global',
  add column cantidad numeric(14, 5) not null default 1;

alter table areas
  add constraint areas_codigo_valido
    check (char_length(codigo) <= 10 and codigo !~ '\s');

-- ---------- presupuestos: cabecera completa ----------
-- % globales aplicados al total de area/partida ("inflar el presupuesto");
-- cada partida puede hacer override con sus flags manuales.

alter table presupuestos
  add column cliente_id uuid references personas(id) on delete set null,
  add column contacto_id uuid references persona_contactos(id) on delete set null,
  add column pie_firma text,
  add column descripcion text,
  add column notas text,
  add column categoria text,
  add column imprevistos_pct numeric(6, 3) not null default 0,
  add column gastos_generales_pct numeric(6, 3) not null default 0,
  add column utilidad_pct numeric(6, 3) not null default 0,
  add column iva_pct numeric(6, 3) not null default 0,
  add column credito_iva_pct numeric(6, 3) not null default 0,
  add column incluir_pct_en_pu boolean not null default false;

-- ---------- catalogo de tipos de porcentaje del APU (creable por el usuario) ----------

create table tipos_porcentaje (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  unique (empresa_id, nombre)
);

insert into tipos_porcentaje (empresa_id, nombre)
select id, n from empresas, unnest(array['Desgaste', 'Perdida', 'Leyes sociales', 'Ajuste']) as n;

-- ---------- partida_recursos: factor y % adicional por linea ----------
-- rendimiento (Rend) y factor son columnas distintas en el sistema de referencia;
-- factor default 1, nunca 0 (se usa como cuadrilla en algunas regiones).

alter table partida_recursos
  add column factor numeric(10, 4) not null default 1 check (factor <> 0),
  add column porcentaje numeric(6, 2),
  add column tipo_porcentaje_id uuid references tipos_porcentaje(id) on delete set null,
  add column comentario text;

-- ---------- presupuesto_partidas: overrides manuales de los % globales ----------

alter table presupuesto_partidas
  add column imprevistos_manual boolean not null default false,
  add column gastos_generales_manual boolean not null default false,
  add column utilidad_manual boolean not null default false;

-- ---------- recursos: columnas faltantes del maestro ----------

alter table recursos
  add column tipo_uso text not null default 'comprable'
    check (tipo_uso in ('comprable', 'vendible', 'ambos')),
  add column receta boolean not null default false,
  add column bloqueo_salida boolean not null default false;

-- tipo_costo pasa de 5 a 7 valores (se agregan herramienta y otros)
alter table recursos drop constraint recursos_tipo_costo_check;
alter table recursos add constraint recursos_tipo_costo_check
  check (tipo_costo in ('material', 'mano_de_obra', 'subcontrato', 'maquinaria', 'servicio', 'herramienta', 'otros'));

-- ---------- RLS ----------

alter table presupuesto_grupos enable row level security;
alter table tipos_porcentaje enable row level security;

create policy "autenticados leen y escriben" on presupuesto_grupos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "autenticados leen y escriben" on tipos_porcentaje
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
