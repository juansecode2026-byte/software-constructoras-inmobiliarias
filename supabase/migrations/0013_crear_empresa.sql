-- Alta de empresa con sus catalogos, en una sola operacion atomica.
--
-- Problema que resuelve: hasta ahora la unica empresa nacio en el seed demo
-- (0002_seed_demo.sql) y cada catalogo se poblaba en tiempo de migracion con
-- "insert ... select id from empresas" (ver 0005 tipos_porcentaje, 0006
-- formas_pago, 0010 urgencias, 0012 presupuesto_estados). Eso significa que una
-- empresa creada DESPUES de esas migraciones nace sin ningun catalogo y la app
-- queda inutilizable para ella: no hay formas de pago, ni estados de
-- presupuesto, ni urgencias para una solicitud de compra.
--
-- Con esta funcion el alta de un cliente real y el seed demo usan exactamente
-- el mismo camino, asi que no vuelven a divergir.

-- p_id permite fijar el uuid: lo necesita el seed demo, cuyas filas se
-- referencian entre si con ids constantes. En un alta real se omite.
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

  -- Porcentajes aplicables a un recurso dentro de una partida (ver 0005).
  insert into tipos_porcentaje (empresa_id, nombre)
  select v_empresa_id, n
  from unnest(array['Desgaste', 'Perdida', 'Leyes sociales', 'Ajuste']) as n;

  -- Condiciones de pago a proveedores (ver 0006).
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

  -- Plazos de urgencia de una Solicitud de Recursos (ver 0010).
  insert into urgencias (empresa_id, nombre, orden)
  select v_empresa_id, n, o
  from unnest(array['8 horas', '1 dia', '2 dias', '4 dias', '5 dias', '8 dias', '10 dias', '15 dias'])
    with ordinality as t(n, o);

  -- Estados del ciclo de vida de un presupuesto (ver 0012).
  insert into presupuesto_estados (empresa_id, nombre, es_aprobado, orden) values
    (v_empresa_id, 'En proceso', false, 1),
    (v_empresa_id, 'Aprobado', true, 2);

  return v_empresa_id;
end;
$$;

comment on function crear_empresa(text, uuid) is
  'Da de alta una empresa con sus catalogos base. Unico camino soportado para '
  'crear un tenant: insertar en "empresas" directamente deja la empresa sin catalogos.';

-- Dar de alta un tenant es una operacion privilegiada: solo el backend.
-- La funcion corre como SECURITY INVOKER (default), asi que ademas sigue
-- sujeta a los permisos de quien la llama.
revoke all on function crear_empresa(text, uuid) from public;
revoke all on function crear_empresa(text, uuid) from anon, authenticated;
