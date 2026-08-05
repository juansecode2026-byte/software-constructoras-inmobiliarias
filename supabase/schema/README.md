# supabase/schema

Retrato del **estado actual** del esquema, para consultar "¿cómo está hoy la
tabla X?" sin leer las migraciones en secuencia.

| Archivo | Contenido |
|---|---|
| `01_tablas.sql` | Las 36 tablas del esquema `public`, con sus columnas y constraints actuales |
| `02_rls.sql` | Activación de RLS y sus 38 políticas (las 4 del bucket `erp-archivos` viven en el esquema `storage`, no aquí) |

**No se edita a mano.** Un cambio de esquema se hace agregando una migración en
`supabase/migrations/`; estos archivos se regeneran después.

Se generaron aplicando todas las migraciones sobre un Postgres limpio y leyendo
el catálogo resultante — no extrayendo texto de las migraciones, que se pierde
los `alter table` multilínea y los `drop column`. Cuando el proyecto esté
vinculado (`supabase link`), la forma más simple de regenerarlos es:

```bash
supabase db dump --schema public > supabase/schema/01_tablas.sql
```

No hay archivo de índices ni de permisos porque hoy no existe ninguno explícito:
los únicos índices son los implícitos de `primary key` y `unique`, y los permisos
son los que Supabase da por defecto a `anon` y `authenticated`. Ver
`docs/base-de-datos.md` para por qué ambas cosas importan.
