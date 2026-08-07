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
**`supabase/`** es la base de datos y (próximamente) el backend.

| Carpeta | Contenido |
|---|---|
| `frontend/src/routes/` | Páginas, una por ruta de React Router |
| `frontend/src/features/erp/` | Componentes de UI reutilizables del ERP |
| `frontend/src/hooks/` | Hooks de React (`useAsync` para carga de datos) |
| `frontend/src/lib/supabase/` | Acceso a datos y consultas tipadas |
| `frontend/src/lib/auth/` | Sesión, guards de ruta, cierre por inactividad |
| `frontend/src/styles/` | CSS global y por módulo |
| `supabase/migrations/` | Historial de esquema — ver `docs/base-de-datos.md` |
| `supabase/schema/` | Estado actual consolidado (generado, no se edita) |
| `supabase/seeds/` | Datos demo, solo para desarrollo |
| `docs/` | Documentación funcional y técnica |

Falta el último paso de la separación: `frontend/src/lib/supabase/` se muda a
`supabase/functions/` como Edge Functions, y el frontend pasa a llamarlas por
HTTP en vez de consultar las tablas directamente.

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
```

Los comandos de `supabase` necesitan estar en la raíz del repositorio: el
vínculo con el proyecto vive en `supabase/`, no en la carpeta padre.

## Documentación de referencia

- `docs/base-de-datos.md` — esquema, módulos, estado de RLS y deudas conocidas
- `docs/proceso-control-costos.md` — el flujo de negocio que implementa el ERP
- `prompt-maestro-fases-proyecto.md` (raíz del proyecto padre) — roadmap por fases
