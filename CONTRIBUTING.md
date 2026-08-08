# Convención de trabajo

ERP a la medida para constructoras e inmobiliarias. Stack: Vite + React Router 7
(SPA) + TypeScript + Tailwind 4, sobre Supabase (Postgres con RLS, Auth, Storage).

## Quién hace qué

No hay carpetas asignadas por persona. Cualquier colaborador puede aportar en
cualquier parte del proyecto.

## Ramas

- `main` — única rama protegida. Solo se actualiza vía merge, nunca commits directos.
- `feature/*` — una rama por línea de trabajo. Los cambios estructurales grandes
  van en su propia rama (por ejemplo `feature/separacion-backend`) para poder
  abandonarlos sin arrastrar el resto.

## Dónde vive cada cosa

El repositorio está partido en dos mitades: **`frontend/`** es la aplicación, y
**`supabase/`** es el backend y la base de datos (ver `supabase/README.md`).
La separación ya está completa y verificada en producción: el navegador ya no
consulta ninguna tabla directo, solo llama a las Edge Functions por HTTP.

| Carpeta | Contenido |
|---|---|
| `frontend/src/routes/` | Páginas, una por ruta de React Router |
| `frontend/src/features/erp/` | Componentes de UI reutilizables del ERP |
| `frontend/src/hooks/` | Hooks de React (`useAsync` para carga de datos) |
| `frontend/src/lib/api/` | Cliente HTTP hacia el backend (reemplaza a `lib/supabase/*` salvo `client.ts`, `idle.ts`, `storage.ts`) |
| `frontend/src/lib/auth/` | Sesión, guards de ruta, cierre por inactividad |
| `frontend/src/styles/` | CSS global y por módulo |
| `supabase/functions/` | El backend real: Edge Functions, una por módulo |
| `supabase/migrations/` | Historial de esquema — ver `docs/base-de-datos.md` |
| `supabase/schema/` | Estado actual consolidado (generado, no se edita) |
| `supabase/seeds/` | Datos demo, solo para desarrollo |
| `docs/` | Documentación funcional y técnica |

**¿Por qué `supabase/` y no `backend/`?** Ver `supabase/README.md` — se probó
renombrarla y se descartó, el CLI la necesita con ese nombre exacto.

## Reglas

1. **Las migraciones se proponen antes de aplicarse.** Una migración ya aplicada
   nunca se edita: los cambios van en un archivo nuevo.
2. **Alta de empresa solo con `crear_empresa()`.** Insertar en `empresas`
   directamente deja la empresa sin catálogos y la app inutilizable para ella.
3. **Los datos demo van en `supabase/seeds/`,** nunca mezclados con migraciones:
   un cliente real debe poder partir de una base limpia.
4. **Antes de commitear:** `npx tsc --noEmit` y `npm run build` en verde.
5. **Nada de secretos en el repo.** `.env.local` está en `.gitignore`; el
   `service_role` key jamás va en código del frontend.

## Comandos

Desde la **raíz del repositorio** (delegan a `frontend/`):

```bash
npm run install:frontend  # instalar dependencias la primera vez
npm run dev               # servidor de desarrollo en localhost:3000
npm run build             # typecheck + build de producción
npm run typecheck         # solo typecheck
npm run db:list           # estado de migraciones local vs remoto
npm run db:push           # aplicar migraciones pendientes a Supabase
npm run check:permisos    # alarma: funciones del backend sin chequeo de autorizacion
```

(los comandos `supabase` deben correrse desde la raíz del repo, no desde la carpeta padre)

## Antes de desplegar una Edge Function

Como `supabase/functions/_shared/db.ts` usa `service_role` (ignora RLS por
completo), la única barrera real contra un endpoint abierto a cualquiera es
que su código llame a `exigirPermiso()`/`exigirAccesoObra()`. No hay ningún
respaldo si a alguien se le olvida.

1. **`npm run check:permisos`** — recorre cada función y avisa si toca `db()`
   sin ningún chequeo de autorización visible. Si una función deliberadamente
   no necesita permiso (ej. filtra por `auth_user_id`, o es un helper interno
   llamado después de que el caller ya validó acceso), marcarla con un
   comentario `// AUTORIZACION: <por qué>` justo antes de la función — el
   script lo reconoce como excepción documentada, no la aprueba en silencio.
2. **Dominio de producción en CORS** — no se hardcodea en el código. Se agrega
   como variable de entorno del proyecto en el panel de Supabase:
   *Edge Functions → Manage secrets → `ORIGENES_ADICIONALES`* (separados por
   coma si hay más de uno, ej. `https://miapp.com,https://www.miapp.com`).
   Aplica en el próximo request, sin redeploy — así el día del deploy real no
   depende de acordarse de tocar `_shared/http.ts`.
3. `supabase functions deploy <nombre>` — desplegar es un paso manual aparte
   de `git push`; el código en el repo no sirve de nada hasta que se
   despliega.

## Documentación de referencia

- `docs/base-de-datos.md` — esquema, módulos, estado de RLS y deudas conocidas
- `docs/proceso-control-costos.md` — el flujo de negocio que implementa el ERP
- `prompt-maestro-fases-proyecto.md` (raíz del proyecto padre) — roadmap por fases
- `docs/prompt-rediseno-ux-ui.md` — rediseño UX/UI completo del ERP (Workday,
  Oracle Fusion, NetSuite, SAP Fiori, Acumatica). **Deliberadamente NO
  aplicado todavía** — es una fase futura, posterior a terminar de replicar
  la estructura del video tutorial que se está siguiendo ahora. No usar como
  guía de la UI actual.
