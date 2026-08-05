-- Row Level Security: estado actual. GENERADO, no editar a mano.
-- Politicas: 38

alter table areas enable row level security;
alter table configuraciones enable row level security;
alter table cuentas_contables enable row level security;
alter table empresas enable row level security;
alter table formas_pago enable row level security;
alter table obras enable row level security;
alter table orden_compra_lineas enable row level security;
alter table ordenes_compra enable row level security;
alter table partida_recursos enable row level security;
alter table partidas enable row level security;
alter table perfil_permisos enable row level security;
alter table perfiles enable row level security;
alter table persona_archivos enable row level security;
alter table persona_contactos enable row level security;
alter table persona_datos_bancarios enable row level security;
alter table persona_direcciones enable row level security;
alter table personas enable row level security;
alter table presupuesto_carpetas enable row level security;
alter table presupuesto_estados enable row level security;
alter table presupuesto_grupos enable row level security;
alter table presupuesto_partidas enable row level security;
alter table presupuestos enable row level security;
alter table recurso_archivos enable row level security;
alter table recurso_clases enable row level security;
alter table recurso_unidades_embalaje enable row level security;
alter table recursos enable row level security;
alter table solicitud_cotizacion_lineas enable row level security;
alter table solicitud_cotizacion_precios enable row level security;
alter table solicitud_cotizacion_proveedores enable row level security;
alter table solicitud_recurso_lineas enable row level security;
alter table solicitudes_cotizacion enable row level security;
alter table solicitudes_recursos enable row level security;
alter table tipos_porcentaje enable row level security;
alter table urgencias enable row level security;
alter table usuario_obras enable row level security;
alter table usuario_perfil enable row level security;

create policy "autenticados leen y escriben" on areas
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on configuraciones
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on cuentas_contables
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on empresas
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on formas_pago
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on obras
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on orden_compra_lineas
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on ordenes_compra
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on partida_recursos
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on partidas
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen permisos" on perfil_permisos
  for select using ((auth.role() = 'authenticated'::text));
create policy "autenticados leen perfiles" on perfiles
  for select using ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on persona_archivos
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on persona_contactos
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on persona_datos_bancarios
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on persona_direcciones
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on personas
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on presupuesto_carpetas
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on presupuesto_estados
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on presupuesto_grupos
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on presupuesto_partidas
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on presupuestos
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on recurso_archivos
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on recurso_clases
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on recurso_unidades_embalaje
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on recursos
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on solicitud_cotizacion_lineas
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on solicitud_cotizacion_precios
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on solicitud_cotizacion_proveedores
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on solicitud_recurso_lineas
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on solicitudes_cotizacion
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on solicitudes_recursos
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on tipos_porcentaje
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen y escriben" on urgencias
  for all using ((auth.role() = 'authenticated'::text)) with check ((auth.role() = 'authenticated'::text));
create policy "autenticados leen accesos a obra" on usuario_obras
  for select using ((auth.role() = 'authenticated'::text));
create policy "autenticados leen perfiles de usuario" on usuario_perfil
  for select using ((auth.role() = 'authenticated'::text));
create policy "cada quien crea su propio perfil" on usuario_perfil
  for insert with check ((auth_user_id = auth.uid()));
create policy "cada quien edita su propio perfil" on usuario_perfil
  for update using ((auth_user_id = auth.uid())) with check ((auth_user_id = auth.uid()));
