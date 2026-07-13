-- GUAU · Migración 5 (Etapa 3): calendario, recordatorios y preferencias de aviso.
--
-- Decisión (decision log D-013): unificamos CalendarEvent y Reminder en una sola
-- tabla `reminders`. En GUAU todo elemento del calendario es accionable/notificable,
-- así que separarlos duplicaría lógica sin aportar valor. El campo `source`
-- distingue los importados de la cartilla de los manuales.
--
-- Las operaciones de calendario/recordatorios NO consumen Huellas.

create type public.reminder_category as enum (
  'vet_appointment', 'vaccine', 'deworming', 'medication', 'food_purchase',
  'grooming', 'bath', 'training', 'activity', 'trip', 'walk', 'custom'
);

create type public.reminder_source as enum ('manual', 'booklet');

create type public.reminder_status as enum ('pending', 'completed', 'snoozed', 'cancelled');

create type public.reminder_priority as enum ('low', 'normal', 'high');

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  category public.reminder_category not null default 'custom',
  -- Instante absoluto del evento (UTC). La hora de pared se interpreta en `timezone`.
  due_at timestamptz not null,
  timezone text not null default 'Europe/Madrid',
  all_day boolean not null default false,
  -- Repetición: frecuencia + intervalo (>=1). 'none' => evento único.
  repeat_frequency text not null default 'none'
    check (repeat_frequency in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  repeat_interval integer not null default 1 check (repeat_interval between 1 and 365),
  -- Antelaciones de aviso en minutos (p. ej. {1440, 60} = 1 día y 1 hora antes).
  lead_minutes integer[] not null default '{60}',
  priority public.reminder_priority not null default 'normal',
  notes text check (notes is null or char_length(notes) <= 1000),
  source public.reminder_source not null default 'manual',
  -- Enlace opcional a un dato de cartilla confirmado (Etapa 7); FK diferida a esa etapa.
  related_health_field_id uuid,
  status public.reminder_status not null default 'pending',
  completed_at timestamptz,
  snoozed_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reminders enable row level security;

-- RLS: el dueño gestiona sus recordatorios. Si hay pet_id, debe ser suyo.
create policy "reminders_select_own" on public.reminders
  for select using (auth.uid() = owner_id);

create policy "reminders_insert_own" on public.reminders
  for insert with check (
    auth.uid() = owner_id
    and (
      pet_id is null
      or exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
    )
    -- El cliente solo crea recordatorios manuales; los de cartilla los inserta el
    -- servidor tras la confirmación humana (Etapa 7).
    and source = 'manual'
  );

create policy "reminders_update_own" on public.reminders
  for update using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and (
      pet_id is null
      or exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
    )
  );

create policy "reminders_delete_own" on public.reminders
  for delete using (auth.uid() = owner_id);

create trigger reminders_touch before update on public.reminders
  for each row execute function public.set_updated_at();

create index reminders_owner_due_idx on public.reminders (owner_id, due_at)
  where status <> 'cancelled';
create index reminders_pet_idx on public.reminders (pet_id) where pet_id is not null;

-- ---------------------------------------------------------------------------
-- Preferencias de notificación por usuario (globales; el detalle por
-- recordatorio vive en lead_minutes). Configurable, con silencio nocturno.
-- ---------------------------------------------------------------------------
create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reminders_enabled boolean not null default true,
  daily_activity_enabled boolean not null default true,
  quiet_hours_start smallint check (quiet_hours_start between 0 and 23),
  quiet_hours_end smallint check (quiet_hours_end between 0 and 23),
  push_token text,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notif_prefs_select_own" on public.notification_preferences
  for select using (auth.uid() = user_id);
create policy "notif_prefs_upsert_own" on public.notification_preferences
  for insert with check (auth.uid() = user_id);
create policy "notif_prefs_update_own" on public.notification_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger notif_prefs_touch before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Activa la función de calendario en el cliente.
update public.feature_flags set enabled = true, updated_at = now() where key = 'calendar';
