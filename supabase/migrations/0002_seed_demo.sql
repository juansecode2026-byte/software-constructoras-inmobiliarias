-- Seed que reproduce los mismos datos de ejemplo que hoy viven hardcodeados
-- en src/features/erp/data.ts, para no perder el demo al conectar el backend real.

insert into empresas (id, nombre) values
  ('00000000-0000-0000-0000-000000000001', 'Constructora Andes');

insert into obras (id, empresa_id, nombre, estado) values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Obra Miramar', 'en_ejecucion'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Los Aromos', 'en_ejecucion'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Vista Norte', 'en_planificacion');

insert into presupuesto_carpetas (id, obra_id, parent_id, nombre) values
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000011', null, 'Carpeta raiz'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021', 'Proyectos 01'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021', 'Obra Miramar'),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021', 'PPTO calidad especial');

insert into presupuestos (id, obra_id, carpeta_id, numero, nombre, estado, vigente, version_tipo, presupuesto_original_id) values
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000023', 52, 'PPTO Miramar 02 (completo) - original', 'en_proceso', true, 'original', null);

insert into presupuestos (id, obra_id, carpeta_id, numero, nombre, estado, vigente, version_tipo, presupuesto_original_id) values
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000023', 61, 'PPTO Miramar 02 (completo) - trabajo', 'en_proceso', true, 'trabajo', '00000000-0000-0000-0000-000000000031'),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000023', 63, 'Accesorios de bano - matriz de partida', 'aprobado', true, 'trabajo', null);

insert into areas (id, presupuesto_id, codigo, nombre, orden) values
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000033', '1', 'Accesorios de bano', 1);

insert into recursos (id, empresa_id, codigo, nombre, tipo_costo, unidad_compra, unidad_consumo, con_stock) values
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', '000836', 'Espejo 650x900x2', 'material', 'UND', 'UND', true),
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000001', '000959', 'Jabonera mediana Nvo. Verona blanca', 'material', 'UND', 'UND', true),
  ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000001', '001028', 'Maestro carpintero', 'mano_de_obra', 'HH', 'HH', false),
  ('00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000001', '001130', 'Perchas', 'material', 'UND', 'UND', true),
  ('00000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000001', '001213', 'Portarrollo blanco', 'material', 'UND', 'UND', true);

insert into partidas (id, empresa_id, codigo, nombre, unidad) values
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000001', '000559', 'Accesorio Bano 2', 'UND');

insert into presupuesto_partidas (id, area_id, partida_id, cantidad, imprevistos_pct, gastos_generales_pct, utilidad_pct, precio_unitario_total, orden) values
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000061', 5.00, 0, 0, 0, 1957.17, 1);

insert into partida_recursos (presupuesto_partida_id, recurso_id, rendimiento, cantidad, precio_unitario, sugerido_por_agente, agente_meta, orden) values
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000051', 1.00, 5.00, 37.80, true,
    '{"agente": "compras", "ahorro_pct": 12, "proveedores_comparados": 4, "jurisdiccion": "region metropolitana"}'::jsonb, 1),
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000052', 1.00, 1.00, 18.48, false, null, 2),
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000053', 0.00, 1.46, 30.71, false, null, 3),
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000054', 1.00, 4.00, 15.12, false, null, 4),
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000055', 1.00, 54.00, 30.24, false, null, 5);
