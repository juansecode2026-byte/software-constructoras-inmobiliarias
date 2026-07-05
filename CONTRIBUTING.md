# Convención de trabajo — crm-mobiliaria

División de responsabilidades entre dos colaboradores con fortalezas parejas:
**Frontend** (tú) y **Backend/Datos** (Gabo).

## Ramas

- `main` — única rama protegida. Solo se actualiza vía merge, nunca commits directos.
- `feature/frontend` — landing, dashboard, componentes, UX.
- `feature/backend-datos` — Supabase, migraciones, RLS, queries, métricas.

Cada quien trabaja en su rama, hace commits ahí, y se unifica en `main` cuando una fase
(o parte de ella) está lista para integrarse.

## Propiedad de carpetas

| Carpeta | Dueño | Contenido |
|---|---|---|
| `src/app` | Frontend | páginas y rutas (App Router) |
| `src/components/ui` | Frontend | componentes shadcn/ui |
| `src/features/*` (UI) | Frontend | UI de cada módulo: landing, auth, dashboard, pipeline, analytics |
| `src/hooks` | Frontend | hooks de React (consumen los contratos de `lib/supabase`) |
| `src/lib/supabase` | Backend/Datos | cliente Supabase, funciones de acceso a datos, RLS |
| `src/types` | Backend/Datos | tipos generados/definidos a partir del esquema (23 tablas) |
| Migraciones SQL | Backend/Datos | se proponen como diff antes de aplicarse (regla del prompt-maestro) |

**Contrato entre capas:** Backend/Datos expone funciones tipadas en `src/lib/supabase`
(con sus tipos en `src/types`) ANTES de que Frontend construya la UI que las consume.
Si una función aún no existe, Frontend puede mockearla temporalmente respetando el
mismo tipo, para no bloquearse esperando al otro.

## Fases → quién lidera

| Fase | Frontend | Backend/Datos |
|---|---|---|
| 0 — Design System | Dueño completo | — |
| 1 — Landing | Dueño completo | — |
| 2 — Auth y Onboarding | UI de login/registro/onboarding | Supabase Auth, roles, políticas RLS |
| 3 — Dashboard Shell | Dueño completo | Forma del contexto de tenant/sesión |
| 4 — Pipeline/Kanban | UI Kanban, drag & drop | Queries/mutations, estados del pipeline, RLS |
| 5 — Analítica | Gráficos y tablas | Métricas, queries/vistas eficientes |
| 6 — QA y handoff | QA de UI (responsive, a11y, estados) | QA de datos (performance, integridad RLS) |
