# Esta carpeta es el backend

`supabase/` es el backend del proyecto y la base de datos — no solo "la parte de Supabase". Se llama así porque el CLI de Supabase busca una carpeta con **exactamente ese nombre** para encontrar el proyecto (migraciones, funciones, vínculo con el proyecto en la nube); renombrarla rompe `supabase link`, `db push` y `functions deploy` sin ninguna forma de arreglarlo con banderas. Ver `CONTRIBUTING.md` para el detalle de por qué se probó y se descartó.

## Qué hay adentro

| Carpeta | Qué es |
|---|---|
| `functions/` | El backend real: Edge Functions que corren en el servidor. Todo lo que antes consultaba las tablas desde el navegador vive ahora acá. |
| `migrations/` | Historial de la base de datos, en orden. Nunca se edita un archivo ya aplicado — los cambios van en uno nuevo. |
| `schema/` | Retrato del estado actual del esquema, generado (no se edita a mano). |
| `seeds/` | Datos de ejemplo, solo para desarrollo. |

Ver `docs/base-de-datos.md` para el detalle del esquema y `CONTRIBUTING.md` para las convenciones de trabajo.
