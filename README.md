# GUAU

Aplicación móvil premium de salud, cuidado y vínculo entre una persona y su perro.
Un sistema único que ayuda a **cuidar, entender y recordar** toda la vida compartida con
tu perro: escáneres (estado físico, comida, cartilla), calendario y recordatorios,
actividades para fortalecer la relación, rachas y recompensas, cuaderno de recuerdos y un
personaje virtual que acompaña. Salud tratada siempre con prudencia y seriedad.

> Estado: **Etapa 1 (fundamentos) completa y verificada.** Auth, perfil del perro,
> economía de Huellas, config remota, analítica y privacidad funcionan de extremo a
> extremo contra un backend real. Las funciones restantes están tras feature flags de
> servidor y se construyen por vertical slices. Ver `docs/`.

## Stack

Expo SDK 57 · React Native 0.86 · TypeScript estricto · expo-router · Supabase
(Postgres 17, Auth, Storage privado, Edge Functions, RLS) · TanStack Query · Zod ·
i18next (es-ES) · Vitest.

## Puesta en marcha

```bash
npm install
cp .env.example .env      # claves publishable de Supabase (públicas por diseño)
npm start                 # Expo (iOS/Android/Web)
```

### Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm run test        # Vitest (lógica pura de src/core)
```

## Arquitectura (resumen)

```
src/
  app/         rutas (expo-router): welcome, sign-up/in, onboarding, (tabs)
  core/        lógica pura testeable (precios/Huellas, validación del perro)
  design/      tokens + tema + componentes (modo cotidiano y modo sanitario)
  features/    auth, pets, character (personaje virtual v0)
  i18n/        localización es-ES (ningún texto incrustado en componentes)
  lib/         supabase, analytics, config remota, tipos de BD
supabase/
  migrations/  esquema versionado (identidad, perros, economía de Huellas, analítica)
  functions/   Edge Functions (borrado de cuenta RGPD)
docs/          00–17: auditoría, spec, flujos, Mobbin, diseño, arquitectura, datos,
               IA, seguridad sanitaria, monetización, personaje, analítica, testing,
               Clay, lanzamiento, decisiones, limitaciones
```

## Principios

- **Lógica comercial solo en servidor** (Huellas, entitlements, límites, precios).
- **Nada de mocks presentados como reales**: las funciones no listas se muestran como
  "en construcción" gobernadas por feature flags.
- **Salud con prudencia**: modo sanitario sobrio; ningún dato de cartilla se confirma
  automáticamente; el personaje nunca es el canal principal de información sanitaria.
- **Privacidad desde el inicio**: RLS, storage privado con URLs firmadas, borrado de
  cuenta, secretos solo en servidor.

Documentación detallada en [`docs/`](./docs). Empieza por
[`docs/00-repository-audit.md`](./docs/00-repository-audit.md) y
[`docs/05-technical-architecture.md`](./docs/05-technical-architecture.md).
