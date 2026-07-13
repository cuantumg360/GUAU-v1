-- GUAU · Migración 1: identidad, consentimientos, perros y procedencia de datos.
-- Toda tabla expuesta a clientes lleva RLS. Los clientes nunca escriben datos
-- derivados de negocio; eso ocurre en funciones o con service_role.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Perfil de usuario (1:1 con auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'es-ES',
  timezone text not null default 'Europe/Madrid',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', null));
  insert into public.paw_accounts (user_id) values (new.id);
  return new;
end;
$$;

-- El trigger se crea en la migración 2, después de existir paw_accounts.

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Consentimientos (versionados, revocables)
-- ---------------------------------------------------------------------------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null, -- p. ej. 'terms', 'privacy', 'camera_analysis', 'ai_training'
  version text not null,
  granted boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, version, created_at)
);

alter table public.consents enable row level security;

create policy "consents_select_own" on public.consents
  for select using (auth.uid() = user_id);
create policy "consents_insert_own" on public.consents
  for insert with check (auth.uid() = user_id);
-- Sin update/delete: el historial de consentimiento es inmutable; se revoca
-- insertando una fila nueva con granted=false.

create index consents_user_kind_idx on public.consents (user_id, kind, created_at desc);

-- ---------------------------------------------------------------------------
-- Perros
-- ---------------------------------------------------------------------------
create type public.pet_sex as enum ('male', 'female', 'unknown');
create type public.reproductive_status as enum ('intact', 'neutered', 'unknown');
create type public.activity_level as enum ('low', 'medium', 'high', 'unknown');

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- La arquitectura admite otras especies en el futuro; la fase 1 solo usa 'dog'.
  species text not null default 'dog' check (species = 'dog'),
  name text not null check (char_length(name) between 1 and 60),
  photo_path text, -- ruta en el bucket privado pet-photos
  birth_date date,
  birth_date_is_approx boolean not null default false,
  sex public.pet_sex not null default 'unknown',
  breed text,
  is_mixed_breed boolean not null default false,
  weight_kg numeric(5, 2) check (weight_kg is null or (weight_kg > 0 and weight_kg < 150)),
  reproductive_status public.reproductive_status not null default 'unknown',
  activity_level public.activity_level not null default 'unknown',
  notes text check (notes is null or char_length(notes) <= 2000),
  is_primary boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pets enable row level security;

create policy "pets_select_own" on public.pets
  for select using (auth.uid() = owner_id);
create policy "pets_insert_own" on public.pets
  for insert with check (auth.uid() = owner_id);
create policy "pets_update_own" on public.pets
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
-- El borrado de mascotas es soft delete (deleted_at) desde el cliente; el borrado
-- físico ocurre al eliminar la cuenta (cascade) o vía herramientas internas.

create trigger pets_touch before update on public.pets
  for each row execute function public.set_updated_at();

create index pets_owner_idx on public.pets (owner_id) where deleted_at is null;

-- Límite de mascotas: configurable desde app_config (clave 'limits.max_pets_free'),
-- aplicado en el trigger siguiente. No se hardcodea en el cliente.
create function public.enforce_pet_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  max_pets int;
  current_count int;
begin
  select coalesce((value ->> 'value')::int, 3) into max_pets
  from public.app_config where key = 'limits.max_pets_free';
  if max_pets is null then max_pets := 3; end if;

  select count(*) into current_count
  from public.pets where owner_id = new.owner_id and deleted_at is null;

  if current_count >= max_pets then
    raise exception 'PET_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Procedencia de datos del perfil del perro
-- Cada dato relevante distingue: introducido por usuario / extraído de documento /
-- inferido por IA, con confianza, estado de confirmación y trazabilidad.
-- ---------------------------------------------------------------------------
create type public.field_source as enum ('user', 'document', 'ai');
create type public.field_status as enum ('confirmed', 'pending', 'rejected');

create table public.pet_profile_fields (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  field_key text not null, -- p. ej. 'allergy', 'medication', 'condition', 'food'
  value jsonb not null,
  source public.field_source not null default 'user',
  source_ref text, -- referencia al escaneo/documento de origen si existe
  confidence numeric(4, 3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status public.field_status not null default 'confirmed',
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.pet_profile_fields enable row level security;

create policy "ppf_select_own" on public.pet_profile_fields
  for select using (
    exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
  );
create policy "ppf_insert_own_user_source" on public.pet_profile_fields
  for insert with check (
    exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
    and source = 'user' -- los datos de documento/IA solo los escribe el servidor
  );
create policy "ppf_update_own" on public.pet_profile_fields
  for update using (
    exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
  );

create trigger ppf_touch before update on public.pet_profile_fields
  for each row execute function public.set_updated_at();

create index ppf_pet_idx on public.pet_profile_fields (pet_id, field_key)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Configuración administrable y feature flags (solo lectura para clientes)
-- ---------------------------------------------------------------------------
create table public.app_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
create policy "app_config_read_all" on public.app_config
  for select using (auth.role() = 'authenticated');

create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  payload jsonb,
  description text,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;
create policy "feature_flags_read_all" on public.feature_flags
  for select using (auth.role() = 'authenticated');

create trigger pets_limit before insert on public.pets
  for each row execute function public.enforce_pet_limit();

insert into public.feature_flags (key, enabled, description) values
  ('chat', false, 'Chat contextual. Se mantiene apagado hasta completar funciones principales.'),
  ('scanner_physical', false, 'Escáner de estado físico (Etapa 9).'),
  ('scanner_food', false, 'Escáner de comida (Etapa 8).'),
  ('scanner_booklet', false, 'Escáner de cartilla (Etapa 7).'),
  ('calendar', false, 'Calendario y recordatorios (Etapa 3).'),
  ('activities', false, 'Actividades y actividad diaria (Etapa 4).'),
  ('streaks_rewards', false, 'Rachas y recompensas (Etapa 5).'),
  ('memories', false, 'Cuaderno de recuerdos (Etapa 6).'),
  ('paywall', false, 'Planes y compra de Huellas (Etapa 10).');

insert into public.app_config (key, value, description) values
  ('limits.max_pets_free', '{"value": 3}', 'Máximo de perros activos por cuenta (provisional, configurable).'),
  ('paws.custom_topup_min', '{"value": 5}', 'Mínimo de Huellas en recarga personalizada.'),
  ('paws.custom_topup_max', '{"value": 500}', 'Máximo de Huellas en recarga personalizada (protección).'),
  ('paws.unit_price_cents', '{"value": 100}', '1 Huella = 1 € antes de descuentos.');

-- ---------------------------------------------------------------------------
-- Registro de auditoría (solo servidor)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;
-- Sin policies: solo service_role puede leer/escribir.
