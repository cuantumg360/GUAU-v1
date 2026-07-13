# 13 — Testing y QA

## Implementado en esta entrega

### Unit tests (Vitest) — 55 tests, 5 archivos, todos verdes
- `src/core/pricing.test.ts`: cifras contractuales del brief — Pro anual ahorra
  73,45 €, ≈13,83 €/mes, 30,7 %; packs con 30 % exacto; recarga personalizada (mín 5,
  entero, sin descuento, máx); formato de moneda es-ES.
- `src/core/petSchema.test.ts`: fechas es-ES (válidas/imposibles/futuras/formato),
  edad aproximada ↔ edad calculada, peso con coma/punto y rangos, esquema Zod del perro.
- `src/core/recurrence.test.ts`: repeticiones (diaria/semanal/mensual/anual + intervalo),
  próxima ocurrencia, expansión en rango, antelaciones de aviso, y **zonas horarias**
  (salto CET/CEST de Madrid: 9:00 de pared → 07:00 UTC en verano, 08:00 en invierno).
- `src/core/reminderSchema.test.ts`: validación Zod del recordatorio y normalización de
  antelaciones.
- `src/core/datetime.test.ts`: parseo/format DD/MM/AAAA + HH:MM ↔ instante UTC (ida y
  vuelta, distinta zona).

### Verificación e2e de backend (script contra el proyecto real) — 13/13
Login; trigger crea `profiles` + `paw_accounts` a 0; **RLS** (insert propio OK, ajeno
bloqueado 42501); update directo de saldo bloqueado; `spend_paws` sin saldo →
`INSUFFICIENT_PAWS`; ledger propio legible y vacío; `credit_paws` bloqueada para
clientes (42501); `feature_flags` y `products` legibles (pro_annual=16595);
`delete-account` responde ok; tras borrado el login es imposible.

### Verificación de build
`tsc --noEmit` sin errores (app); `expo lint` sin errores; `expo export --platform web`
genera el bundle completo (compila de extremo a extremo).

## Flujos críticos (17 del brief) y cobertura

| # | Flujo | Estado |
| --- | --- | --- |
| 1 | Registro | ✅ implementado + e2e (login/alta) |
| 2 | Creación de perro | ✅ implementado + validación testeada |
| 3–5 | Escáneres físico/comida/cartilla | ⛔ Etapas 7–9 (contrato + coste ya testeado) |
| 6 | Recordatorio (crear/editar/completar/posponer) | ✅ implementado + e2e (RLS, sin coste Huellas) |
| 7 | Notificación (aviso local programado) | ✅ local implementada; push remota en hardening |
| 8 | Actividad diaria | ⛔ Etapa 4 |
| 9 | Incremento de racha | ⛔ Etapa 5 |
| 10 | Concesión de recompensa sin duplicados | 🟡 `credit_paws` idempotente ya verificado |
| 11–12 | Recuerdo texto/voz | ⛔ Etapa 6 |
| 13 | Compra de Pro | ⛔ Etapa 10 |
| 14 | Compra de Huellas | ⛔ Etapa 10 |
| 15 | Consumo de Huellas | ✅ `spend_paws` verificado e2e |
| 16 | Reintento sin doble cobro | ✅ idempotencia verificada e2e |
| 17 | Eliminación de cuenta | ✅ verificado e2e (borrado + login imposible) |

## Plan de pruebas por etapa

- **Contract tests de IA** (Zod) antes de persistir cualquier salida (Etapa 7).
- **Tests de pagos/webhooks** con el adapter mock (Etapa 10).
- **Zonas horarias** en recordatorios/rachas (Etapas 3/5).
- **OCR ambiguo**, uploads maliciosos, límites de tamaño (Etapas 7–9).
- **Accesibilidad y reduced motion** (jest-expo + pruebas manuales).
- **Offline y recuperación ante fallo**.
- Component/e2e (jest-expo / Maestro) cuando la UI lo justifique
  (ver `17-known-limitations.md`).

## Cómo ejecutar

```
npm run test        # Vitest (lógica pura)
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm start           # app en Expo Go / simulador
```
