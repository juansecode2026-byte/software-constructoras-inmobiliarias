-- Datos demo para probar la Comparacion Original-Trabajo (nivel Area).
-- Reutiliza el par original/trabajo ya sembrado en 0002 (Nº 52 / Nº 61 de
-- PPTO Miramar 02) que hasta ahora no tenia areas cargadas.

insert into areas (id, presupuesto_id, codigo, nombre, unidad, cantidad, orden) values
  ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000031', 'OG', 'Obra Gruesa Edificio', 'Edificio', 1, 1),
  ('00000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000031', 'MT', 'Movimiento de Tierra Previo', 'Gl', 1, 2),
  ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000032', 'OG', 'Obra Gruesa Edificio', 'Edificio', 1, 1),
  ('00000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000032', 'MT', 'Movimiento de Tierra Previo', 'Gl', 1, 2);

insert into partidas (id, empresa_id, codigo, nombre, unidad) values
  ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000001', '000700', 'Hormigon fundaciones', 'M3'),
  ('00000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000001', '000701', 'Excavacion masiva', 'M3');

-- Original: partida a precio inicial. Trabajo: misma partida con sobrecosto
-- (simula reajuste de precio de mercado), para ver la Diferencia en rojo.
insert into presupuesto_partidas (id, area_id, partida_id, cantidad, precio_unitario_total, orden) values
  ('00000000-0000-0000-0000-000000000095', '00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000091', 120.00, 380000.00, 1),
  ('00000000-0000-0000-0000-000000000096', '00000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000092', 40.00, 15000.00, 1),
  ('00000000-0000-0000-0000-000000000097', '00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000091', 120.00, 402000.00, 1),
  ('00000000-0000-0000-0000-000000000098', '00000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000092', 40.00, 14200.00, 1);
