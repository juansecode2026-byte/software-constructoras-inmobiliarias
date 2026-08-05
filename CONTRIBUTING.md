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

| Carpeta | Contenido |
|---|---|
| `src/routes/` | Páginas, una por ruta de React Router |
| `src/features/erp/` | Componentes de UI reutilizables del ERP |
| `src/hooks/` | Hooks de React (`useAsync` para carga de datos) |
| `src/lib/supabase/` | Acceso a datos y consultas tipadas |
| `src/lib/auth/` | Sesión, guards de ruta, cierre por inactividad |
| `src/styles/` | CSS global y por módulo |
| `supabase/migrations/` | Historial de esquema — ver `docs/base-de-datos.md` |
| `supabase/schema/` | Estado actual consolidado (generado, no se edita) |
| `supabase/seeds/` | Datos demo, solo para desarrollo |
| `docs/` | Documentación funcional y técnica |

Esta estructura cambia con el plan de separación backend/frontend: la capa de
datos se mueve a `supabase/functions/` y el frontend a `frontend/`.

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

```bash
npm run dev        # servidor de desarrollo en localhost:3000
npm run build      # typecheck + build de producción
npx tsc --noEmit   # solo typecheck
```

## Documentación de referencia

- `docs/base-de-datos.md` — esquema, módulos, estado de RLS y deudas conocidas
- `docs/proceso-control-costos.md` — el flujo de negocio que implementa el ERP
- `prompt-maestro-fases-proyecto.md` (raíz del proyecto padre) — roadmap por fases
