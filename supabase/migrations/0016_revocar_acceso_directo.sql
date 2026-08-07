-- Fase 5 del plan de separacion backend/frontend: le quita al navegador el
-- permiso de hablar directo con las tablas. Sin esto, todo lo anterior
-- (Edge Functions, exigirPermiso, exigirAccesoObra) es cosmetico — el
-- esquema deja de viajar en el bundle, pero PostgREST le seguia aceptando a
-- cualquiera con el anon key las mismas consultas que antes hacia el
-- frontend directo. Esta migracion es la que hace la separacion real.
--
-- No afecta a las Edge Functions: usan `service_role` (ver
-- supabase/functions/_shared/db.ts), que ignora RLS y los grants de tabla
-- por diseno. Tampoco afecta Storage (esquema aparte, sus propias politicas
-- ya filtran por auth.role() = 'authenticated', sin cambios aca) ni Auth.
--
-- Verificado localmente (embedded-postgres, ver
-- tecnica_verificar_sql_sin_docker en memoria): tras aplicar esta migracion,
-- `SET ROLE authenticated; SELECT * FROM presupuestos;` devuelve
-- "permission denied", y una conexion sin SET ROLE (equivalente a
-- service_role) sigue leyendo sin problema.

revoke all on all tables in schema public from anon, authenticated;

-- Por si alguna migracion futura crea una tabla nueva sin acordarse de este
-- archivo: las tablas que se creen de ahora en adelante en este esquema NO
-- heredan acceso para anon/authenticated por defecto.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;

-- usuario_puede()/usuario_accede_obra() (migracion 0015) son de uso interno
-- del backend — se llaman desde auth.ts con service_role. Postgres concede
-- EXECUTE a PUBLIC por defecto al crear una funcion; nunca se habia revocado
-- para estas dos, asi que hasta ahora cualquiera con el anon key podia
-- invocarlas via /rest/v1/rpc/usuario_puede. No exponen datos de negocio,
-- pero exponen el modelo de permisos y no tienen motivo para ser publicas.
revoke execute on function usuario_puede(uuid, text, text) from public;
revoke execute on function usuario_accede_obra(uuid, uuid) from public;
revoke execute on function usuario_puede(uuid, text, text) from anon, authenticated;
revoke execute on function usuario_accede_obra(uuid, uuid) from anon, authenticated;
