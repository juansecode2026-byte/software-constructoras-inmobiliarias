# Base de datos

Referencia única del esquema. Antes esta información estaba repartida entre
`docs/modulo-presupuesto.md`, `docs/modulo-compras.md`,
`docs/configuraciones-basicas.md` y los comentarios del propio SQL.

## Dónde vive cada cosa

| Carpeta | Qué es | Se edita a mano |
|---|---|---|
| `supabase/migrations/` | Historial ordenado de cambios. Se aplica en secuencia. | Solo agregando archivos nuevos — **nunca** se modifica uno ya aplicado |
| `supabase/schema/` | Retrato del estado actual, para consultar sin leer 9 migraciones | No: se regenera |
| `supabase/seeds/` | Datos de ejemplo para desarrollo | Sí |

### Levantar un entorno desde cero

```bash
supabase db reset          # aplica supabase/migrations/ en orden
# y luego, solo en desarrollo:
psql "$DATABASE_URL" -f supabase/seeds/01_demo_presupuesto.sql
psql "$DATABASE_URL" -f supabase/seeds/02_demo_configuraciones.sql
psql "$DATABASE_URL" -f supabase/seeds/03_demo_comparacion.sql
psql "$DATABASE_URL" -f supabase/seeds/04_demo_compras.sql
```

El orden importa: `01` crea la empresa y todo lo demás cuelga de ella.

### Regenerar `supabase/schema/`

Hoy se generó extrayendo el DDL de las migraciones. Cuando el proyecto esté
vinculado (`supabase link`), la fuente correcta pasa a ser la base real:

```bash
supabase db dump --schema public > supabase/schema/01_tablas.sql
```

## Alta de una empresa

**Siempre con `crear_empresa('Nombre')`** (ver `0013_crear_empresa.sql`), que
devuelve el `uuid` de la empresa creada.

Insertar en `empresas` directamente deja la empresa **sin catálogos** y la app
inutilizable para ella: sin formas de pago no se puede emitir una orden de
compra, sin estados no se puede crear un presupuesto. La función provisiona en
una sola operación:

| Catálogo | Contenido |
|---|---|
| `tipos_porcentaje` | Desgaste, Pérdida, Leyes sociales, Ajuste |
| `formas_pago` | Contado, Contra factura 30 días, 60 días, 30/70, Cheque 30 días, Anticipo |
| `urgencias` | 8 horas, 1 día, 2, 4, 5, 8, 10, 15 días |
| `presupuesto_estados` | En proceso, Aprobado |

## Los módulos

### Presupuesto — el núcleo

La jerarquía es `obra → presupuesto → área → partida → recurso`:

```
empresas
└── obras
    ├── presupuesto_carpetas        (árbol, para organizar)
    └── presupuestos                (numerados; original vs trabajo)
        └── areas
            ├── presupuesto_grupos  (árbol, agrupación visual)
            └── presupuesto_partidas
                └── partida_recursos   ← el APU: cantidad × precio
```

Un presupuesto es **original** (línea base congelada) o **trabajo** (el vivo,
que apunta a su original vía `presupuesto_original_id`). Comparar ambos es lo
que alimenta el gate de *Inicio de Partida*: si la partida cuesta más en trabajo
que en original, exige un motivo de autorización antes de pasar a Compras.

`partidas` y `recursos` son catálogos maestros por empresa; `presupuesto_partidas`
y `partida_recursos` son sus instancias dentro de un presupuesto concreto, con
sus propias cantidades y precios.

### Compras — el flujo

```
solicitudes_recursos        (qué se necesita en obra)
  └── solicitud_recurso_lineas
        ↓
solicitudes_cotizacion      (se pide precio a varios proveedores)
  ├── solicitud_cotizacion_lineas
  ├── solicitud_cotizacion_proveedores
  └── solicitud_cotizacion_precios   ← el cuadro comparativo se calcula aquí
        ↓
ordenes_compra
  └── orden_compra_lineas
```

El **cuadro comparativo no tiene tabla propia**: se arma al vuelo cruzando
líneas × proveedores × precios.

### Configuraciones básicas

- `personas` — directorio único de terceros. Una persona puede ser proveedor,
  cliente, empleado, contratista o transportista a la vez (banderas booleanas).
  Cuelgan `persona_direcciones` → `persona_contactos`, más
  `persona_datos_bancarios` y `persona_archivos`.
- `recursos` + `recurso_clases` — catálogo maestro con árbol de clases de 3
  niveles. `recurso_unidades_embalaje` y `recurso_archivos` cuelgan de recursos.
- `configuraciones` — tabla plana `(módulo, clave, valor)` con los parámetros
  que gobiernan cada módulo.
- `cuentas_contables` — plan de cuentas.

### Perfil

`usuario_perfil` liga `auth.users` con la empresa y guarda lo que se imprime en
documentos aprobados: nombre, cargo y **firma digital**. Los archivos viven en
el bucket privado `erp-archivos`, servidos con URLs firmadas de corta duración.

## Una empresa, varios proyectos

Este ERP es **a la medida de una sola empresa constructora**, que lleva varios
proyectos en paralelo. No es un producto multi-empresa, y el esquema refleja esa
decisión con dos niveles de alcance:

**Por proyecto (`obra_id`)** — lo que es propio de cada desarrollo:
`presupuestos`, `presupuesto_carpetas`, `solicitudes_recursos`,
`solicitudes_cotizacion`, `ordenes_compra`, y todo lo que cuelga de ellos.

**Compartido por toda la empresa (`empresa_id`)** — los maestros que se
reutilizan entre proyectos: `recursos`, `partidas`, `personas` (proveedores y
clientes), `cuentas_contables`, `configuraciones`, y los catálogos
(`formas_pago`, `urgencias`, `presupuesto_estados`, `tipos_porcentaje`).

El precio de un material y el proveedor que lo vende son los mismos cambie la
obra que cambie; el presupuesto y sus órdenes de compra, no.

Por eso solo 13 de las 33 tablas llevan `empresa_id`: **las demás cuelgan de
`obra`, que es donde corresponde.** No es una deuda del diseño.

Lo que sí queda abierto es el **eje de permisos**: con varios proyectos, la
pregunta relevante no es "de qué empresa es este usuario" sino "en qué obras
puede trabajar". Por ejemplo, si el coordinador de Obra Miramar debe poder
aprobar órdenes de compra de Los Aromos. Sin decidir todavía.

## Estado de seguridad

**RLS está activo en las 33 tablas**, pero todas las políticas son la misma:

```sql
for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated')
```

Es decir: **cualquier usuario autenticado lee y escribe todo.** No hay distinción
de rol ni de obra. Lo mismo aplica a las 4 políticas del bucket `erp-archivos`.
La migración `0001` lo documenta como atajo deliberado de V1.

Como el sistema es de una sola empresa, todo usuario con sesión es alguien de la
casa — así que esto no expone datos a terceros. Lo que queda suelto es la
autorización **dentro** de la empresa:

- Cualquiera puede aprobar una orden de compra o modificar un presupuesto. Eso
  vacía de sentido el gate de autorización por sobrecosto de *Inicio de Partida*
  (ver `docs/proceso-control-costos.md`).
- Cualquiera puede sobrescribir el `usuario_perfil` de otro, **incluida su firma
  digital** — que es justo lo que se estampa en los documentos aprobados.
- Nadie está acotado a las obras en las que realmente trabaja.

Lo que **no** es un problema: un visitante anónimo. `auth.role()` no es
`authenticated` para él, así que RLS lo bloquea aunque conozca los nombres de las
tablas.

## Deudas conocidas

| Tema | Estado |
|---|---|
| RLS sin filtro por empresa ni roles | Pendiente — Fase 1 del plan de separación |
| No existe tabla de membresía usuario ↔ empresa ↔ rol | Pendiente — bloquea lo anterior |
| `usuario_perfil` no se crea al registrarse un usuario nuevo | Pendiente: hoy solo lo creó `0007` para los usuarios que existían entonces |
| Sin índices en columnas FK | Postgres solo indexa PK y `unique`. Con las consultas anidadas del ERP, esto se va a notar al crecer los datos |
