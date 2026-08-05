# Notas para agentes

## El stack cambió: ya no es Next.js

Este proyecto migró de Next.js a **Vite 8 + React Router 7 en modo SPA**. Si
encuentras referencias a App Router, Server Components, Server Actions,
`next/link` o `next/image`, son restos que hay que corregir, no patrones a imitar.

Consecuencias prácticas:

- **No hay servidor.** Todo corre en el navegador: no existe `"use server"`,
  `revalidatePath`, `cookies()` ni middleware.
- Para navegar: `<Link to>` y `useNavigate()` de `react-router-dom`.
- Para cargar datos: el hook `useAsync` de `src/hooks/useAsync.tsx`, que expone
  `{ datos, cargando, error, recargar }`. `recargar()` reemplaza lo que antes
  hacía `revalidatePath`.
- Variables de entorno: `import.meta.env.VITE_*`, no `process.env.NEXT_PUBLIC_*`.

Otras versiones que difieren de lo habitual: **Tailwind 4** (se configura en CSS
con `@theme`, no hay `tailwind.config.js`) y **React 19**.

## Seguridad: leer antes de tocar la capa de datos

Las consultas a Supabase se ejecutan **en el navegador**, así que los nombres de
tablas y columnas viajan al cliente. Además, hoy todas las políticas RLS son
`auth.role() = 'authenticated'`: cualquier usuario con sesión lee y escribe todo.

Antes de agregar consultas o cambiar RLS, leer `docs/base-de-datos.md` — explica
el estado real y las deudas conocidas. Hay un plan de separación
backend/frontend en curso que mueve esta capa a Edge Functions.

## Base de datos

- Alta de empresa **siempre** con `crear_empresa()`; insertar en `empresas`
  directamente la deja sin catálogos.
- Las migraciones aplicadas no se editan: los cambios van en un archivo nuevo.
- Datos demo en `supabase/seeds/`, nunca en migraciones.

Ver `CONTRIBUTING.md` para convenciones de ramas y comandos.
