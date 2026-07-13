# 06 — Modelo de datos

Esquema en `supabase/migrations/`. Convenciones: IDs estables (`uuid`/identity),
`created_at`/`updated_at`, soft delete donde tiene sentido (`deleted_at`), RLS en toda
tabla de cliente, idempotencia en la economía, campos de auditoría.

## Implementado (Etapa 1)

### Identidad
- **profiles** (1:1 con `auth.users`): `display_name, locale, timezone,
  onboarding_completed_at`. RLS: dueño lee/actualiza. Trigger `handle_new_user` crea la
  fila + `paw_accounts` al registrarse.
- **consents**: `kind, version, granted, created_at`. **Inmutable** (sin update/delete):
  revocar = insertar `granted=false`. RLS: dueño lee/inserta.

### Perro y procedencia
- **pets**: `owner_id, species('dog'), name, photo_path, birth_date,
  birth_date_is_approx, sex, breed, is_mixed_breed, weight_kg, reproductive_status,
  activity_level, notes, is_primary, deleted_at`. RLS dueño. Trigger `enforce_pet_limit`
  (límite desde `app_config`).
- **pet_profile_fields**: procedencia por dato — `field_key, value(jsonb),
  source(user|document|ai), source_ref, confidence, status(confirmed|pending|rejected)`.
  RLS: el cliente solo inserta con `source='user'`; los datos de documento/IA los
  escribe el servidor. Aquí viven alergias, medicación, condiciones, alimentación.

### Economía de Huellas
- **paw_accounts**: `balance` (materializado, ≥0). Cliente **solo lee**.
- **paw_ledger**: append-only. `kind, delta, balance_before, balance_after, reason,
  operation, related_entity, purchase_ref, idempotency_key(unique por usuario),
  status, meta`. Trigger que impide UPDATE/DELETE.
- **products**: catálogo (`pro_monthly, pro_annual, paw_pack_25/50/100, paw_custom`)
  con `base_price_cents, final_price_cents, paws, billing_period`.
- **operation_costs**: `operation → paw_cost`, `is_provisional`.
- **entitlements**: `plan(free|pro_monthly|pro_annual), status, current_period_end,
  source`. Escritura solo servidor.
- Funciones: `spend_paws` (atómica, idempotente, autenticado), `credit_paws`
  (service_role), `validate_custom_topup` (mín/máx/entero, service_role).

### Plataforma
- **app_config**, **feature_flags** (lectura autenticada), **analytics_events**
  (insert propio, sin datos sanitarios), **audit_log** (solo service_role).
- Storage: bucket privado **pet-photos** (`{user}/{pet}/{uuid}.jpg`, 5 MB, imágenes).

## Enums

`pet_sex, reproductive_status, activity_level, field_source, field_status, paw_tx_kind,
paw_tx_status, plan_kind`.

## Planificado (Etapas 3–9) — entidades del brief aún no migradas

`CalendarEvent, Reminder, NotificationPreference, Activity, ActivityCategory,
ActivityCompletion, DailyRecommendation, Streak, StreakDay, RewardDefinition,
RewardGrant, Memory, MemoryVersion, VoiceRecording, Transcript, PhysicalScan(+Asset),
FoodScan(+Asset), HealthBooklet(+Page), ExtractedHealthField, ConfirmedHealthRecord,
AIProcessingJob, AIResult, Subscription, Purchase, VirtualCharacterState,
CharacterUnlock`. Cada una llegará con su migración, RLS y actualización de
`database.types.ts`. Diseño previsto: los escaneos referencian `pet_id` y generan
`pet_profile_fields` de `source='document'|'ai'` en estado `pending` hasta confirmación.

## Diagrama textual (implementado)

```
auth.users 1─1 profiles
auth.users 1─1 paw_accounts 1─* paw_ledger
auth.users 1─* pets 1─* pet_profile_fields
auth.users 1─1 entitlements
auth.users 1─* consents
products / operation_costs / app_config / feature_flags  (config global)
analytics_events / audit_log                              (telemetría/auditoría)
```
