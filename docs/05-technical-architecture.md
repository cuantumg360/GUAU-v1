# 05 — Arquitectura técnica

## Stack

- **Cliente:** Expo SDK 54, React Native 0.81, TypeScript estricto, expo-router.
- **Servidor:** Supabase (Postgres 17, Auth, Storage privado, Edge Functions Deno, RLS).
- **Estado de servidor:** TanStack Query. **Validación:** Zod. **i18n:** i18next +
  react-i18next (es-ES). **Tests:** Vitest.

Proyecto Supabase: `jnyowsltrjsqkidgcgol` (`eu-north-1`). URL y clave *publishable* en
`.env` (`EXPO_PUBLIC_*`). Los **secretos** (service_role, claves de IA) viven solo en
Edge Functions, nunca en el repo ni en el cliente.

## Estructura de carpetas

```
src/
  app/                  rutas (expo-router)
    _layout.tsx         Providers: QueryClient → Auth → Theme → Stack
    index.tsx           gate de enrutado según sesión/onboarding
    welcome/sign-up/sign-in/onboarding.tsx
    (tabs)/             index (home), dog, settings + _layout
  core/                 lógica PURA testeable (pricing, petSchema) — sin RN
  design/               tokens + ThemeContext + components/
  features/
    auth/AuthProvider.tsx
    pets/api.ts         hooks CRUD + fotos (TanStack Query)
    character/Mascot.tsx personaje v0
  i18n/                 index + locales/es-ES.ts
  lib/                  supabase, analytics, remoteConfig, database.types
supabase/
  migrations/           0..4 (SQL versionado, aplicado al proyecto real)
  functions/delete-account/  Edge Function (borrado de cuenta RGPD)
```

## Principios

- **Lógica comercial solo en servidor.** Saldo de Huellas, entitlements, costes y
  límites se calculan/validan en Postgres. El cliente los **lee**; nunca los decide.
  No se duplica lógica comercial cliente/servidor: `src/core/pricing.ts` es solo
  presentación y prevalidación; el contrato vinculante es SQL.
- **Tipos de extremo a extremo.** `database.types.ts` se genera del esquema real; el
  cliente Supabase está tipado con `Database`. Sin `any` injustificados.
- **Feature flags de servidor** (`feature_flags`) gobiernan qué funciones aparecen.
- **Config remota** (`app_config`) para límites, mínimos/máximos y precios unitarios.
- **Errores y estados:** cada pantalla maneja carga/errores; la analítica es
  fire-and-forget y jamás rompe la UX.

## Flujo de datos (ejemplo: crear perro)

```
onboarding.tsx → useCreatePet (features/pets/api.ts)
  → petInputSchema.parse (Zod)               validación de forma
  → supabase.from('pets').insert(...)        RLS: owner_id = auth.uid()
      trigger enforce_pet_limit               límite desde app_config
  → update profiles.onboarding_completed_at
  → track('pet_created')                      analytics_events (RLS)
  → queryClient.setQueryData(primary_pet)
```

## Migraciones

Versionadas en `supabase/migrations/` y aplicadas al proyecto real (verificado con
`list_migrations`). Regenerar `database.types.ts` tras cada cambio de esquema. Orden:
`105900` drop legacy → `110000` core → `110100` economía → `110200` analítica/storage →
`110300` hardening de funciones.

## Seguridad de la plataforma (revisada con advisors)

RLS habilitada en todas las tablas de cliente. Funciones de trigger y `credit_paws`
con EXECUTE revocado a `anon`/`authenticated`. `search_path` fijo en funciones. Pendiente
operativo (no de código): activar *leaked password protection* en Auth y SMTP propio.

## CI

`.github/workflows/ci.yml`: instala dependencias, `tsc --noEmit`, `expo lint`,
`vitest run`. No requiere secretos (usa la clave publishable pública).
