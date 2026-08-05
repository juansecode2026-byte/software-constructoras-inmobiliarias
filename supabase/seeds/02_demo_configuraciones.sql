-- Seed de ejemplo para Configuraciones basicas (mismos datos ilustrativos que el
-- preview del artefacto): identidad de la empresa, plan de cuentas minimo, arbol
-- de clases de 3 niveles, personas con hijas, embalaje y parametros por modulo.

-- ---------- empresa ----------

update empresas set
  identificador = '76.123.456-7',
  nombre_comercial = 'Constructora Andes',
  nombre_legal = 'Constructora Andes SpA',
  giro = 'Construccion de edificios',
  direccion = 'Av. Andes 1420, of. 601',
  region = 'Metropolitana',
  comuna = 'Providencia',
  telefono = '+56 2 2555 1200',
  email = 'contacto@constructoraandes.cl',
  representante_legal_nombre = 'Felipe Andrade Soto',
  representante_legal_identificador = '14.882.331-K',
  pie_de_firma = 'Constructora Andes SpA - RUT 76.123.456-7',
  textos_bienvenida = 'Bienvenido al ERP de Constructora Andes. Gestion de obras, presupuestos y recursos en un solo lugar.'
where id = '00000000-0000-0000-0000-000000000001';

-- ---------- plan de cuentas minimo ----------

insert into cuentas_contables (id, empresa_id, codigo, nombre) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '110002', 'Inventario materiales'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '410015', 'Ventas'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', '510015', 'Costo de venta'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', '520010', 'Mano de obra directa');

-- ---------- arbol de clases: 3 niveles ----------

insert into recurso_clases (id, empresa_id, parent_id, codigo, nombre, cuenta_inventario_id, cuenta_venta_id, cuenta_costo_venta_id, imputable) values
  -- nivel 1
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', null, '010000', 'Materiales (obras)', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000103', true),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', null, '040000', 'Mano de obra', null, null, '00000000-0000-0000-0000-000000000104', true),
  -- nivel 2
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', '010300', 'Maderas', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000103', true),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', '010900', 'Accesorios de bano', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000103', true),
  -- nivel 3
  ('00000000-0000-0000-0000-000000000221', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000211', '010302', 'Madera contrachapado', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000103', true);

-- clasificar los recursos demo existentes
update recursos set clase_id = '00000000-0000-0000-0000-000000000212'
  where id in ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000052',
               '00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000055');
update recursos set clase_id = '00000000-0000-0000-0000-000000000202'
  where id = '00000000-0000-0000-0000-000000000053';

-- ---------- personas de ejemplo ----------

insert into personas (id, empresa_id, tipo_persona, identificador, nombre_legal, nombre_comercial, nombres, apellido_paterno, apellido_materno, giro, es_proveedor, es_empleado, es_cliente, es_contratista, es_transportista, vigente) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', 'empresa', '76.998.211-3', 'Aceros del Sur Ltda.', 'Aceros del Sur', null, null, null, 'Venta de aceros y perfiles', true, false, false, false, false, true),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', 'natural', '15.402.887-5', null, null, 'Maria', 'Ibanez', 'Rojas', 'Jefa de obra', false, true, false, false, false, true),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', 'empresa', '77.345.109-K', 'Inmobiliaria Vista Norte SpA', 'Inmobiliaria Vista Norte', null, null, null, 'Inmobiliaria', true, false, true, false, false, true),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000001', 'empresa', '9.887.201-9', 'Transportes Cordillera EIRL', 'Transportes Cordillera', null, null, null, 'Transporte de carga', false, false, false, true, true, false);

insert into persona_direcciones (id, persona_id, tipo, nombre, direccion, region, comuna, telefono) values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 'principal', 'Casa matriz', 'Camino Industrial 4520', 'Metropolitana', 'San Bernardo', '+56 2 2887 3410'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', 'sucursal', 'Sucursal Rancagua', 'Ruta 5 Sur km 34', 'O''Higgins', 'Rancagua', '+56 72 223 4410'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000303', 'principal', null, 'Av. Apoquindo 5600, of. 1201', 'Metropolitana', 'Las Condes', '+56 2 2440 8800');

insert into persona_contactos (direccion_id, nombre, cargo, celular, email) values
  ('00000000-0000-0000-0000-000000000401', 'Ricardo Pena', 'Jefe de ventas', '+56 9 8213 5540', 'rpena@acerosdelsur.cl');

-- 0006 quito "forma_pago" de aqui: la condicion de pago es del rol proveedor,
-- no de la cuenta bancaria, y vive en personas.forma_pago_id.
insert into persona_datos_bancarios (persona_id, banco, tipo_cuenta, numero_cuenta) values
  ('00000000-0000-0000-0000-000000000301', 'Banco de Chile', 'corriente', '00-123-4567-8');

update personas set forma_pago_id = (
  select id from formas_pago
  where empresa_id = '00000000-0000-0000-0000-000000000001'
    and nombre = '60 dias contra factura'
)
where id = '00000000-0000-0000-0000-000000000301';

-- ---------- embalaje de ejemplo ----------

insert into recurso_unidades_embalaje (recurso_id, unidad, factor, precio) values
  ('00000000-0000-0000-0000-000000000054', 'Caja (12 unidades)', 12, 165000);

-- ---------- parametros por modulo ----------

insert into configuraciones (empresa_id, modulo, clave, valor, descripcion) values
  ('00000000-0000-0000-0000-000000000001', 'general', 'moneda', 'CLP', 'Moneda unica del sistema'),
  ('00000000-0000-0000-0000-000000000001', 'general', 'nombre_centro_resultado', 'Obra', 'Como se llama la unidad de negocio en pantallas y reportes'),
  ('00000000-0000-0000-0000-000000000001', 'presupuesto', 'imprevistos_pct_default', '5', 'Porcentaje de imprevistos sugerido al crear una partida'),
  ('00000000-0000-0000-0000-000000000001', 'presupuesto', 'gastos_generales_pct_default', '12', 'Porcentaje de gastos generales sugerido'),
  ('00000000-0000-0000-0000-000000000001', 'presupuesto', 'utilidad_pct_default', '8', 'Porcentaje de utilidad sugerido'),
  ('00000000-0000-0000-0000-000000000001', 'recursos', 'permitir_stock_negativo', 'false', 'Permite registrar consumos sin stock disponible'),
  ('00000000-0000-0000-0000-000000000001', 'recursos', 'alertar_stock_critico', 'true', 'Dispara el agente de reposicion al caer bajo el minimo'),
  ('00000000-0000-0000-0000-000000000001', 'compras', 'validar_orden_compra', 'true', 'Exige orden de compra antes de recepcionar'),
  ('00000000-0000-0000-0000-000000000001', 'compras', 'tolerancia_diferencias_pct', '2', 'Diferencia tolerada entre OC y factura');
