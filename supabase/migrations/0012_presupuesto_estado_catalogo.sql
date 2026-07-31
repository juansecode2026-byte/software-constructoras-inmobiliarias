-- El campo "Estado" en la pantalla real de edicion de Presupuesto tiene un
-- boton "+" junto al dropdown: es un catalogo mantenible por el usuario, no
-- un enum fijo. Esto explica los valores sueltos vistos en el listado real
-- ("Inicio", "01", "prueba") -- no son datos corruptos, son estados creados
-- a mano con esa "+" a lo largo de años de uso.
--
-- Reemplaza el check (estado in ('en_proceso','aprobado')) por una tabla,
-- con un flag es_aprobado (en vez de parsear el nombre) para poder seguir
-- pintando el pill verde/gris sin asumir texto fijo.

create table presupuesto_estados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  es_aprobado boolean not null default false,
  orden integer not null default 0,
  unique (empresa_id, nombre)
);

insert into presupuesto_estados (empresa_id, nombre, es_aprobado, orden)
select id, 'En proceso', false, 1 from empresas
union all
select id, 'Aprobado', true, 2 from empresas;

alter table presupuestos add column estado_id uuid references presupuesto_estados(id);

update presupuestos p
set estado_id = pe.id
from presupuesto_estados pe, obras o
where o.id = p.obra_id
  and pe.empresa_id = o.empresa_id
  and ((p.estado = 'en_proceso' and pe.nombre = 'En proceso')
    or (p.estado = 'aprobado' and pe.nombre = 'Aprobado'));

alter table presupuestos alter column estado_id set not null;
alter table presupuestos drop column estado;

alter table presupuesto_estados enable row level security;
create policy "autenticados leen y escriben" on presupuesto_estados
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
