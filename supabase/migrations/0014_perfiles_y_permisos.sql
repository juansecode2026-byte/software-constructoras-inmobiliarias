-- Perfiles de usuario, permisos por modulo y acceso por obra.
--
-- Sigue el modelo del ERP de referencia (ver docs/diagnostico-erp.md ->
-- Administracion > Usuarios): perfiles como plantilla, permisos por
-- feature (Ver/Crear/Editar/Eliminar) y acceso a datos filtrado por obra.
-- Se omite el nivel "carpeta" del referente porque el ERP todavia no lo usa.
--
-- Que resuelve: hoy toda politica RLS es auth.role() = 'authenticated', asi que
-- cualquier usuario con sesion puede aprobar una orden de compra, iniciar una
-- partida con sobrecosto o pisar la firma digital de otro. Como el sistema es de
-- una sola empresa eso no expone datos a terceros, pero deja sin efecto el gate
-- de autorizacion de Inicio de Partida (docs/proceso-control-costos.md).
--
-- Estas tablas son el MODELO de permisos. Quien los hace cumplir es el backend
-- (fases 3-4 del plan de separacion): RLS por si sola no puede expresar
-- "aprobar" como accion.

-- ---------- perfiles: plantillas de permisos ----------

create table perfiles (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  descripcion text,
  created_at timestamptz not null default now(),
  unique (empresa_id, codigo)
);

-- La presencia de la fila concede el permiso; su ausencia lo niega. Es mas
-- simple de leer y auditar que un boolean con tres estados posibles.
create table perfil_permisos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  modulo text not null,
  accion text not null check (accion in ('ver', 'crear', 'editar', 'eliminar', 'aprobar')),
  unique (perfil_id, modulo, accion)
);

-- modulo queda como text, no enum: el sidebar ya anticipa Recepciones, Bodega,
-- Subcontratos, Tesoreria y varios mas (src/features/erp/data.ts) que se van a
-- ir habilitando sin querer una migracion de esquema por cada uno.

-- ---------- que usuario es que perfil, y en que obras trabaja ----------

alter table usuario_perfil
  add column perfil_id uuid references perfiles(id) on delete restrict,
  -- Para gerencia y administracion, que ven la empresa completa: evita tener
  -- que darlos de alta a mano en cada obra nueva.
  add column acceso_todas_las_obras boolean not null default false;

create table usuario_obras (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null references obras(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (auth_user_id, obra_id)
);

-- ---------- RLS ----------

alter table perfiles enable row level security;
alter table perfil_permisos enable row level security;
alter table usuario_obras enable row level security;

-- Quien puede administrar perfiles se decide en el backend; a nivel tabla basta
-- con que un usuario con sesion pueda leerlos para saber que puede hacer.
create policy "autenticados leen perfiles" on perfiles
  for select using (auth.role() = 'authenticated');
create policy "autenticados leen permisos" on perfil_permisos
  for select using (auth.role() = 'authenticated');
create policy "autenticados leen accesos a obra" on usuario_obras
  for select using (auth.role() = 'authenticated');

-- usuario_perfil: la firma digital es lo que se estampa en los documentos
-- aprobados, asi que nadie puede escribir el perfil de otro. Leer si: hace falta
-- para mostrar quien aprobo cada documento.
drop policy "autenticados leen y escriben" on usuario_perfil;

create policy "autenticados leen perfiles de usuario" on usuario_perfil
  for select using (auth.role() = 'authenticated');

create policy "cada quien edita su propio perfil" on usuario_perfil
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy "cada quien crea su propio perfil" on usuario_perfil
  for insert with check (auth_user_id = auth.uid());

-- Sin politica de delete: borrar un perfil no se hace desde la aplicacion.
