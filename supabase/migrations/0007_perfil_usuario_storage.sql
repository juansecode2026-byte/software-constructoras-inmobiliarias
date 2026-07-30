-- Perfil del usuario (nombre, cargo, firma) necesario para imprimir documentos
-- aprobados, y almacenamiento de archivos para firmas, logos y adjuntos.
-- Ver docs/creacion-edicion-usuario.md: descartamos permisos/perfiles/acceso por
-- obra (sistema de un solo usuario), pero el perfil para documentos si se necesita.

-- ---------- perfil del usuario ----------
-- auth.users solo guarda email y clave; aqui va lo que se imprime en documentos.

create table usuario_perfil (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  cargo text,
  telefono text,
  firma_digital_url text,
  notas text,
  created_at timestamptz not null default now()
);

alter table usuario_perfil enable row level security;

create policy "autenticados leen y escriben" on usuario_perfil
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- storage: un bucket privado para todo el ERP ----------
-- Estructura de carpetas: empresa/, usuario/, personas/<id>/, recursos/<id>/
-- Privado: el ERP no expone archivos publicamente; se sirven con URLs firmadas.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'erp-archivos',
  'erp-archivos',
  false,
  5242880,  -- 5 MB por archivo
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- Politica V1 coherente con el resto del proyecto: cualquier usuario autenticado
-- opera sobre este bucket (un solo usuario real hoy).
create policy "autenticados leen archivos del erp" on storage.objects
  for select using (bucket_id = 'erp-archivos' and auth.role() = 'authenticated');

create policy "autenticados suben archivos del erp" on storage.objects
  for insert with check (bucket_id = 'erp-archivos' and auth.role() = 'authenticated');

create policy "autenticados actualizan archivos del erp" on storage.objects
  for update using (bucket_id = 'erp-archivos' and auth.role() = 'authenticated');

create policy "autenticados borran archivos del erp" on storage.objects
  for delete using (bucket_id = 'erp-archivos' and auth.role() = 'authenticated');

-- ---------- perfil inicial ----------
-- Datos genericos: los reales los carga el usuario final al entregar el sistema
-- (ver pantalla /erp/perfil). Se crea uno por cada usuario de auth existente.

insert into usuario_perfil (auth_user_id, empresa_id, nombre, cargo, notas)
select u.id, e.id, 'Usuario de prueba', 'Cargo por definir',
       'Datos de ejemplo. Reemplazar con los del usuario real al entregar el sistema.'
from auth.users u
cross join (select id from empresas limit 1) e
on conflict (auth_user_id) do nothing;
