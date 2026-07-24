# Guía: Construcción de una Web Full Stack

Referencia de Juanse (2026-07-24). Se usa como rúbrica para diagnosticar, módulo por módulo, si el ERP de
referencia conlleva trabajo full stack (y no solo frontend), y para no saltarse pasos al construir el
nuestro. Ver aplicación práctica en [diagnostico-erp.md](diagnostico-erp.md).

## Fases

**Fase 1 — Fundamentos y planificación**
1.1 Definir el producto · 1.2 Elegir el stack · 1.3 Arquitectura (frontend-backend-DB) · 1.4 Wireframes y flujos de usuario

**Fase 2 — Base de datos**
2.1 Modelado de datos (tablas, relaciones, foreign keys) · 2.2 Esquema SQL en Supabase ·
2.3 Row Level Security · 2.4 Seeds de prueba

**Fase 3 — Backend / API**
3.1 Autenticación (registro, login, sesiones) · 3.2 API REST / Edge Functions ·
3.3 Lógica de negocio (validaciones, reglas) · 3.4 Manejo de errores y respuestas HTTP

**Fase 4 — Frontend**
4.1 HTML semántico · 4.2 Sistema de diseño (color/tipografía/espaciado) ·
4.3 Componentes UI (navbar, cards, formularios, modales) · 4.4 Lógica JS (eventos, estado, interacciones) ·
4.5 Consumir la API (fetch/async) · 4.6 Manejo de sesión en el cliente

**Fase 5 — Integración y features avanzadas**
5.1 Subida de archivos (Storage) · 5.2 Tiempo real (Realtime/WebSockets) ·
5.3 Búsqueda y filtros · 5.4 Roles y permisos

**Fase 6 — Calidad y producción**
6.1 Responsive design · 6.2 Performance (lazy loading, cache, imágenes) ·
6.3 Seguridad (sanitización, HTTPS, .env) · 6.4 Deploy (Vercel + Supabase) · 6.5 Dominio personalizado

## Kit de herramientas

| Prioridad | Herramienta | Para qué |
|---|---|---|
| Esencial | VS Code | Escribir código |
| Esencial | Git + GitHub | Guardar y versionar |
| Esencial | Supabase | Base de datos + Auth + Storage + API |
| Esencial | Chrome DevTools | Depurar |
| Muy útil | Postman | Probar la API |
| Muy útil | Figma | Diseñar antes de codear |
| Para deploy | Vercel | Publicar el sitio |

## Stack recomendado para este proyecto

| Capa | Tecnología | Razón |
|---|---|---|
| Frontend | Next.js (React) + Tailwind | Ya en uso en el repo |
| Backend/Auth/DB | Supabase | Todo en uno, RLS incluido |
| Deploy | Vercel + Supabase | Gratis, integrado a GitHub |
| Versiones | Git + GitHub | Ya en uso |

## Python: cuándo entra en juego

No es necesario para el stack base (Next.js + Supabase alcanza). Se vuelve relevante solo si:

| Situación | ¿Python? |
|---|---|
| Usamos Supabase como backend | Opcional — útil para scripts, IA, scraping |
| Necesitamos backend propio fuera de Supabase | Sí — FastAPI o Django |
| Procesar datos masivos (migraciones, seeds grandes) | Sí — pandas, SQLAlchemy |
| Agregar IA al ERP (agentes, clasificación de documentos) | Sí — Anthropic SDK, LangChain |
| Solo frontend + Supabase | No — JS/TS alcanza |

## Cómo se usa esta guía en el diagnóstico

Cuando se procese material del ERP de referencia (`docs/referencia-erp/`), cada módulo se evalúa contra las
Fases 2–5 de esta guía:

- ¿Requiere tablas/relaciones propias más allá de lo genérico? → Fase 2
- ¿Tiene lógica de negocio, validaciones o reglas que no sean triviales? → Fase 3
- ¿Tiene componentes de UI con estado/interacción real (no solo estático)? → Fase 4
- ¿Usa archivos, tiempo real, búsqueda o roles/permisos? → Fase 5

Si un módulo cumple varios de estos puntos, se marca como **full stack** en `diagnostico-erp.md` y se
planifica con las 4 capas (DB, backend, frontend, integración). Si un módulo es solo informativo/estático,
se marca como **solo frontend** y se simplifica el esfuerzo.
