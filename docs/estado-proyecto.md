# Estado del proyecto — CRM Mobiliaria (software-constructoras-inmobiliarias)

Recopilación de lo construido hasta ahora, en orden, para saber dónde vamos y qué sigue.
Última actualización: 2026-07-24.

## 1. Paso a paso de lo construido

1. **Bootstrap del proyecto** (`70f45b8`)
   Proyecto creado con `create-next-app`: Next.js 16.2.10, React 19.2.4, TypeScript, Tailwind CSS 4, ESLint 9.

2. **Checkpoint: landing inicial + estructura por fases** (`8dbaca5`)
   - `src/app/page.tsx`: landing de una sola página con:
     - Header con logo "CRM Mobiliaria" y CTA "Solicitar demo".
     - Hero con propuesta de valor, botones "Ver demo" / "Explorar funciones" y un panel de métricas de ejemplo (pipeline activo, conversión, tiempo de respuesta).
     - Sección de 3 features: Pipeline inteligente, Analítica en tiempo real, Agentes de IA.
     - Sección de contacto con `mailto:`.
   - `src/app/layout.tsx`: metadata (title/description) y fuentes Geist.
   - `src/app/globals.css`: primeros tokens de diseño (`--primary` teal `#0f766e`, fondo, tipografía) — arranque del design system.
   - Estructura de carpetas por fase creada (vacías, con `.gitkeep`):
     `src/components/ui`, `src/features/{landing,auth,dashboard,pipeline,analytics}`,
     `src/lib/supabase`, `src/hooks`, `src/types`.

3. **Convención de ramas y división de trabajo** (`5cf0cee`) — `CONTRIBUTING.md`
   - `main`: única rama protegida, solo se actualiza por merge.
   - `feature/frontend` (Juanse) / `feature/backend-datos` (Gabo).
   - Propiedad de carpetas definida por capa (frontend: `app`, `components/ui`, `features/*` UI, `hooks`; backend: `lib/supabase`, `types`, migraciones SQL).
   - **Contrato entre capas**: Backend expone funciones tipadas en `lib/supabase` (con tipos en `types`) *antes* de que Frontend construya la UI que las consume; si no existen aún, Frontend puede mockear respetando el mismo tipo.
   - Tabla de fases 0–6 con quién lidera cada una (ver sección 3 abajo).

4. **División de trabajo ampliada** (`c96a135`) — `docs/division-trabajo-ampliada.docx`
   Cuadro fase por fase cruzando el checklist técnico full-stack, marcando explícitamente qué debe entregar cada persona antes de que la otra pueda avanzar. Puntos clave:
   - Fases 0 y 1: sin dependencias, cada quien avanza en paralelo.
   - Fase 1: Gabo debe crear la tabla de `leads` con RLS para que el CTA de la landing capture datos reales.
   - Fase 2: Gabo debe tener listo el esquema de Auth + tenants + RLS por rol antes de que Juanse conecte login/roles reales.
   - Fase 3: Gabo expone datos de sesión/tenant (rol y permisos) antes de que Juanse maneje el estado global.
   - Fase 4: Gabo entrega esquema de estados del pipeline antes de que Juanse conecte el Kanban a datos reales.
   - Fase 5: Gabo entrega queries/vistas de métricas antes de que Juanse conecte los gráficos.
   - Fase 6: trabajo en paralelo, convergen entregando documentación juntos.

5. **Rename del paquete** (`a17802f`, rama `feature/frontend`, aún sin merge a `main`)
   `package.json` → `name: "software-constructoras-inmobiliarias"`.

## 2. Estado actual de las ramas

| Rama | Estado |
|---|---|
| `main` | 3 commits (hasta la convención de ramas). Protegida. |
| `feature/frontend` | 2 commits por delante de `main` (rename + doc ampliada). **Sin mergear todavía.** |
| `feature/backend-datos` | Sin commits propios aún — al día con `main`. Gabo no ha empezado a trabajar en su rama. |

## 3. Dónde vamos por fase

| Fase | Frontend (Juanse) | Backend/Datos (Gabo) | Estado |
|---|---|---|---|
| **0 — Design System** | Tokens de color/tipografía iniciales en `globals.css` | Sin tareas de UI (le toca modelado de datos preliminar) | 🟡 Parcial — falta shadcn/ui instalado, doc formal del sistema, wireframes |
| **1 — Landing** | Hero, features, CTA, responsive básico construidos | Tabla de `leads` + RLS (bloqueante para CTA real) | 🟡 Parcial — UI lista, falta conexión real a datos |
| **2 — Auth y Onboarding** | UI de login/registro/onboarding | Supabase Auth, tablas `users`/`tenants`, RLS por rol | 🔴 No iniciada |
| **3 — Dashboard Shell** | Layout, sidebar/topbar, estado de sesión/tenant | Exponer rol/permisos del usuario | 🔴 No iniciada |
| **4 — Pipeline/Kanban** | Vista Kanban, drag & drop | Tablas de leads/propiedades, estados, RLS, Storage | 🔴 No iniciada |
| **5 — Analítica** | Gráficos y tablas de métricas | Queries/vistas eficientes | 🔴 No iniciada |
| **6 — QA y handoff** | QA de UI, deploy en Vercel | Doc de esquema/RLS, deploy Supabase | 🔴 No iniciada |

Carpetas de fases 2–5 (`features/auth`, `features/dashboard`, `features/pipeline`, `features/analytics`, `lib/supabase`, `types`) existen pero están vacías (`.gitkeep`).

## 4. Próximos pasos sugeridos

1. **Mergear `feature/frontend` a `main`** (rename + doc ampliada) para que ambas ramas partan del mismo punto.
2. **Cerrar Fase 0**: instalar/configurar shadcn/ui en `src/components/ui`, documentar el design system (paleta, tipografía, espaciados) formalmente.
3. **Gabo**: crear la tabla `leads` con RLS y seeds de prueba — esto desbloquea que el CTA de la landing capture datos reales y cierra la Fase 1 del todo.
4. **Arrancar Fase 2 en paralelo**: Gabo define esquema de Auth/tenants/roles; Juanse construye UI de login/registro/onboarding (puede mockear el contrato mientras tanto, según lo acordado en `CONTRIBUTING.md`).
