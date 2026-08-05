-- Siembra de perfiles por defecto, y su enganche con crear_empresa().
--
-- Misma razon que en 0013 con los catalogos: si los perfiles no nacen con la
-- empresa, el usuario queda sin perfil asignado y el backend no tiene contra que
-- autorizarlo.
--
-- La siembra vive en su propia funcion para que la usen los dos casos sin
-- duplicar la matriz de permisos: el alta de una empresa nueva, y el backfill
-- de la empresa que ya existe (al final de este archivo).
--
-- Reemplaza la version de crear_empresa() de 0013, que se deja intacta: una
-- migracion aplicada no se edita.

create or replace function sembrar_perfiles(p_empresa_id uuid)
returns void
language plpgsql
as $$
declare
  v_modulos text[] := array['presupuesto', 'compras', 'personas', 'recursos', 'configuraciones', 'empresa'];
  v_acciones text[] := array['ver', 'crear', 'editar', 'eliminar', 'aprobar'];
begin
  insert into perfiles (empresa_id, codigo, nombre, descripcion) values
    (p_empresa_id, 'admin', 'Administrador',
      'Acceso completo a todos los modulos y a todas las obras.'),
    (p_empresa_id, 'jefe_obra', 'Jefe de obra',
      'Gestiona el presupuesto y pide recursos de las obras que tiene asignadas.'),
    (p_empresa_id, 'comprador', 'Comprador',
      'Cotiza, compara proveedores y emite ordenes de compra.'),
    (p_empresa_id, 'consulta', 'Consulta',
      'Solo lectura, sin poder modificar ni aprobar nada.');

  -- Administrador: todo sobre todo.
  insert into perfil_permisos (perfil_id, modulo, accion)
  select p.id, m.modulo, a.accion
  from perfiles p,
    unnest(v_modulos) as m(modulo),
    unnest(v_acciones) as a(accion)
  where p.empresa_id = p_empresa_id and p.codigo = 'admin';

  -- Consulta: ver todo, nada mas.
  insert into perfil_permisos (perfil_id, modulo, accion)
  select p.id, m.modulo, 'ver'
  from perfiles p, unnest(v_modulos) as m(modulo)
  where p.empresa_id = p_empresa_id and p.codigo = 'consulta';

  -- Jefe de obra y Comprador se enumeran porque su gracia esta justamente en lo
  -- que NO pueden hacer: el jefe de obra aprueba presupuesto pero no compra; el
  -- comprador emite ordenes pero no toca el presupuesto.
  insert into perfil_permisos (perfil_id, modulo, accion)
  select p.id, x.modulo, x.accion
  from (values
    ('jefe_obra', 'presupuesto', 'ver'),
    ('jefe_obra', 'presupuesto', 'crear'),
    ('jefe_obra', 'presupuesto', 'editar'),
    ('jefe_obra', 'presupuesto', 'aprobar'),
    ('jefe_obra', 'compras', 'ver'),
    ('jefe_obra', 'compras', 'crear'),
    ('jefe_obra', 'personas', 'ver'),
    ('jefe_obra', 'recursos', 'ver'),
    ('jefe_obra', 'configuraciones', 'ver'),
    ('jefe_obra', 'empresa', 'ver'),
    ('comprador', 'presupuesto', 'ver'),
    ('comprador', 'compras', 'ver'),
    ('comprador', 'compras', 'crear'),
    ('comprador', 'compras', 'editar'),
    ('comprador', 'compras', 'aprobar'),
    ('comprador', 'personas', 'ver'),
    ('comprador', 'personas', 'crear'),
    ('comprador', 'personas', 'editar'),
    ('comprador', 'recursos', 'ver'),
    ('comprador', 'recursos', 'crear'),
    ('comprador', 'recursos', 'editar'),
    ('comprador', 'configuraciones', 'ver'),
    ('comprador', 'empresa', 'ver')
  ) as x(codigo, modulo, accion)
  join perfiles p on p.empresa_id = p_empresa_id and p.codigo = x.codigo;
end;
$$;

-- ---------- crear_empresa(): ahora tambien siembra perfiles ----------

create or replace function crear_empresa(p_nombre text, p_id uuid default null)
returns uuid
language plpgsql
as $$
declare
  v_empresa_id uuid;
begin
  insert into empresas (id, nombre)
  values (coalesce(p_id, gen_random_uuid()), p_nombre)
  returning id into v_empresa_id;

  insert into tipos_porcentaje (empresa_id, nombre)
  select v_empresa_id, n
  from unnest(array['Desgaste', 'Perdida', 'Leyes sociales', 'Ajuste']) as n;

  insert into formas_pago (empresa_id, nombre, dias_vence)
  select v_empresa_id, f.nombre, f.dias
  from (values
    ('Contado', 0),
    ('Contra factura 30 dias', 30),
    ('60 dias contra factura', 60),
    ('30% contado, 70% a 30 dias', 30),
    ('Cheque a 30 dias', 30),
    ('Anticipo proveedor', 0)
  ) as f(nombre, dias);

  insert into urgencias (empresa_id, nombre, orden)
  select v_empresa_id, n, o
  from unnest(array['8 horas', '1 dia', '2 dias', '4 dias', '5 dias', '8 dias', '10 dias', '15 dias'])
    with ordinality as t(n, o);

  insert into presupuesto_estados (empresa_id, nombre, es_aprobado, orden) values
    (v_empresa_id, 'En proceso', false, 1),
    (v_empresa_id, 'Aprobado', true, 2);

  perform sembrar_perfiles(v_empresa_id);

  return v_empresa_id;
end;
$$;

revoke all on function crear_empresa(text, uuid) from public;
revoke all on function crear_empresa(text, uuid) from anon, authenticated;
revoke all on function sembrar_perfiles(uuid) from public;
revoke all on function sembrar_perfiles(uuid) from anon, authenticated;

-- ---------- consultas de permisos, para el backend ----------

-- Responde "¿este usuario puede hacer esto?" en un solo lugar, para que la
-- respuesta no quede reimplementada en cada Edge Function.
create or replace function usuario_puede(p_auth_user_id uuid, p_modulo text, p_accion text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from usuario_perfil up
    join perfil_permisos pp on pp.perfil_id = up.perfil_id
    where up.auth_user_id = p_auth_user_id
      and pp.modulo = p_modulo
      and pp.accion = p_accion
  );
$$;

-- Idem para el acceso a una obra concreta.
create or replace function usuario_accede_obra(p_auth_user_id uuid, p_obra_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from usuario_perfil
    where auth_user_id = p_auth_user_id and acceso_todas_las_obras
  ) or exists (
    select 1 from usuario_obras
    where auth_user_id = p_auth_user_id and obra_id = p_obra_id
  );
$$;

-- ---------- backfill de lo que ya existe ----------

-- La empresa actual nacio antes de que existieran los perfiles.
do $$
declare
  e record;
begin
  for e in select id from empresas loop
    if not exists (select 1 from perfiles where empresa_id = e.id) then
      perform sembrar_perfiles(e.id);
    end if;
  end loop;
end;
$$;

-- Los usuarios que ya operaban el sistema lo hacian sin restriccion alguna:
-- se les deja como Administrador para no quitarles acceso de golpe. Al dar de
-- alta gente nueva se le asigna el perfil que corresponda.
update usuario_perfil up
set perfil_id = (
      select p.id from perfiles p
      where p.empresa_id = up.empresa_id and p.codigo = 'admin'
    ),
    acceso_todas_las_obras = true
where up.perfil_id is null;
