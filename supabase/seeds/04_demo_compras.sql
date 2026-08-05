-- Datos demo para el modulo Compras: continua la historia de "Hormigon
-- fundaciones" (presupuesto Trabajo Nº61, area OG, partida 097) sembrada en
-- 0008 -- Solicitud de Recursos -> Solicitud de Cotizacion (2 proveedores) ->
-- Orden de Compra, ya recibida completa.

insert into recursos (id, empresa_id, codigo, nombre, tipo_costo, unidad_compra, unidad_consumo, con_stock) values
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000001', '002100', 'Cemento Portland', 'material', 'SACO', 'SACO', true),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000001', '002101', 'Fierro corrugado 12mm', 'material', 'ML', 'ML', true);

insert into personas (id, empresa_id, tipo_persona, identificador, nombre_legal, nombre_comercial, es_proveedor, forma_pago_id) values
  ('00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000001', 'empresa', '76.123.456-7', 'Cementos Bio Bio S.A.', 'Cementos Bio Bio',
    true, (select id from formas_pago where nombre = '60 dias contra factura')),
  ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000001', 'empresa', '77.234.567-8', 'Ferreteria Central Ltda.', 'Ferreteria Central',
    true, (select id from formas_pago where nombre = 'Contado'));

insert into solicitudes_recursos (id, obra_id, numero, descripcion, solicita, estado, estado_aprobacion) values
  ('00000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000011', 1,
    'Cemento para Hormigon Fundaciones', 'Jefe de Obra', 'terminada', 'aprobado');

insert into solicitud_recurso_lineas (id, solicitud_id, recurso_id, presupuesto_partida_id, cantidad, urgencia_id, cantidad_cotizada, cantidad_comprada, estado) values
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000110',
    '00000000-0000-0000-0000-000000000097', 600, (select id from urgencias where nombre = '2 dias'), 600, 600, 'terminada');

insert into solicitudes_cotizacion (id, obra_id, numero, descripcion, solicita, estado, estado_aprobacion) values
  ('00000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-000000000011', 1,
    'Cotizacion cemento - Hormigon Fundaciones', 'Jefe de Obra', 'terminada', 'aprobado');

insert into solicitud_cotizacion_lineas (id, solicitud_cotizacion_id, recurso_id, solicitud_recurso_linea_id, cantidad) values
  ('00000000-0000-0000-0000-000000000141', '00000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-000000000110',
    '00000000-0000-0000-0000-000000000131', 600);

insert into solicitud_cotizacion_proveedores (id, solicitud_cotizacion_id, proveedor_id, forma_pago_id, enviado) values
  ('00000000-0000-0000-0000-000000000142', '00000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-000000000120',
    (select id from formas_pago where nombre = '60 dias contra factura'), true),
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-000000000121',
    (select id from formas_pago where nombre = 'Contado'), true);

insert into solicitud_cotizacion_precios (linea_id, proveedor_id, precio, descuento_pct) values
  ('00000000-0000-0000-0000-000000000141', '00000000-0000-0000-0000-000000000142', 6800, 0),
  ('00000000-0000-0000-0000-000000000141', '00000000-0000-0000-0000-000000000143', 7100, 2);

insert into ordenes_compra (id, obra_id, numero, proveedor_id, forma_pago_id, estado, estado_aprobacion, enviado_proveedor) values
  ('00000000-0000-0000-0000-000000000150', '00000000-0000-0000-0000-000000000011', 1, '00000000-0000-0000-0000-000000000120',
    (select id from formas_pago where nombre = '60 dias contra factura'), 'terminada', 'aprobado', true);

insert into orden_compra_lineas (id, orden_compra_id, recurso_id, solicitud_recurso_linea_id, presupuesto_partida_id, cantidad, precio_unitario, cantidad_recibida) values
  ('00000000-0000-0000-0000-000000000151', '00000000-0000-0000-0000-000000000150', '00000000-0000-0000-0000-000000000110',
    '00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000097', 600, 6800, 600);

-- Nota: 'compras.tolerancia_diferencias_pct' ya existia desde 0004_seed_configuraciones_basicas.sql
