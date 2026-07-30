-- "Inicio de Partida": gate del flujo (ver docs/proceso-control-costos.md, nodo
-- naranja de decision entre Presupuesto y Solicitud de Recursos) distinto del
-- reporte de consulta "Comparacion Original-Trabajo". Una partida de un
-- presupuesto de trabajo se marca iniciada cuando ya se autorizo su costo
-- frente a la version original; si hay sobrecosto, exige motivo.

alter table presupuesto_partidas
  add column iniciada boolean not null default false,
  add column iniciada_en timestamptz,
  add column autorizacion_motivo text;
