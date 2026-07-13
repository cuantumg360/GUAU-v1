# 00 — Auditoría inicial del repositorio

**Fecha:** 2026-07-13
**Auditor:** Equipo fundador GUAU (sesión de arranque)
**Rama de trabajo:** `claude/guau-pet-app-design-kpcxq4`

## 1. Estado encontrado

| Aspecto | Resultado |
| --- | --- |
| Commits previos | **Ninguno.** El repositorio `cuantumg360/GUAU-v1` estaba completamente vacío (solo `.git`). |
| Código existente | Ninguno. |
| Diseño previo | Ninguno. |
| Autenticación / BD / almacenamiento | Nada implementado en el repo. |
| Deuda técnica | No aplica (repo vacío). |
| Código duplicado | No aplica. |
| Secretos expuestos | Ninguno (no había archivos). |
| Tests / lint / type checking previos | No aplica. |

## 2. Infraestructura externa encontrada

La cuenta de Supabase del propietario (org **Growth OS**) ya contenía un proyecto llamado
**"guau v1"** (`jnyowsltrjsqkidgcgol`, región `eu-north-1`, Postgres 17), creado el
2026-06-18 y en estado `INACTIVE` (pausado por inactividad).

Al restaurarlo se encontró un **prototipo de esquema previo** creado fuera de control de
migraciones: tablas `public.pets` y `public.scans` (columnas en español, PK `text`,
sin procedencia de datos), ambas con **0 filas**, y un event trigger `ensure_rls`
(auto-activa RLS en tablas nuevas). Decisión: retirar las dos tablas vacías con la
migración `20260713105900_drop_legacy_prototype.sql` (sin pérdida de datos) y
**conservar** el event trigger como red de seguridad. Ver decision log D-003/D-004.

**Decisión:** reutilizar ese proyecto como backend de GUAU en lugar de crear uno nuevo.
Motivos: (a) su nombre indica que fue creado para este producto, (b) restaurarlo no
genera coste nuevo, (c) región europea alineada con RGPD y el mercado inicial (España).
Se restauró el 2026-07-13. Registrado en `16-decision-log.md` (D-002).

## 3. Stack elegido (repo vacío → stack por defecto del brief)

- **App móvil:** React Native 0.86 + **Expo SDK 57** + TypeScript estricto + expo-router
  (navegación tipada por archivos, `typedRoutes` activado).
- **Backend:** **Supabase** (PostgreSQL 17 + Auth + Storage + Edge Functions + RLS).
  Cumple: autenticación segura, almacenamiento privado de archivos, funciones de
  servidor para lógica sensible, Postgres gestionado.
- **Estado de servidor:** TanStack Query. **Validación:** Zod. **i18n:** i18next +
  react-i18next + expo-localization (es-ES inicial, arquitectura multi-idioma).
- **Tests de lógica pura:** Vitest (los tests de componentes RN se incorporarán con
  jest-expo cuando haya componentes complejos que lo justifiquen; ver
  `17-known-limitations.md`).

Todas las versiones son estables y mantenidas (plantilla oficial `create-expo-app@latest`
del 2026-07-13). No se ha adoptado ninguna dependencia experimental.

## 4. Riesgos identificados

1. **Escáneres con IA** dependen de claves de proveedor que no deben vivir en el
   cliente → toda llamada a IA pasará por Edge Functions (capa `ai-pipeline`).
2. **Compras/suscripciones**: la validación server-side de compras de tienda (App
   Store/Play) requiere cuentas de desarrollador que aún no existen → se construye
   la abstracción + entitlements en servidor con adapter mock explícito documentado.
3. **Economía de Huellas**: el saldo debe ser inatacable desde el cliente → ledger
   inmutable en Postgres con funciones `SECURITY DEFINER`, idempotencia y RLS de solo
   lectura (implementado en la migración inicial).
4. **Proyecto Supabase en plan gratuito**: se pausa por inactividad; para producción
   habrá que subirlo de plan (decisión comercial futura, no técnica).

## 5. Recomendación de arquitectura y plan

Arquitectura por features (`src/features/*`), capa `src/lib` (supabase, analítica,
config remota), capa `src/design` (tokens + componentes), rutas en `src/app`.
Lógica comercial (Huellas, entitlements, recompensas) **solo en servidor**.

Plan de migración: no aplica (no hay nada que migrar). Orden de ejecución: el descrito
en el brief (Etapas 1-12), empezando por la Etapa 1 en esta misma sesión.

## 6. Decisiones a conservar

- Proyecto Supabase `jnyowsltrjsqkidgcgol` como único backend.
- Rama de desarrollo `claude/guau-pet-app-design-kpcxq4`.
- es-ES como idioma fuente de la localización; ninguna cadena incrustada en componentes.
