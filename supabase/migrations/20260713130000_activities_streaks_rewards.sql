-- GUAU · Migración 6 (Etapas 4+5): actividades, actividad diaria, rachas y
-- recompensas. La pieza central es complete_daily_activity(): registra la
-- finalización, actualiza la racha con protección de reloj y concede recompensas
-- de forma idempotente, todo en una transacción.

-- ---------------------------------------------------------------------------
-- Contenido de actividades (administrable, con estado de revisión)
-- ---------------------------------------------------------------------------
create type public.activity_category as enum (
  'confidence', 'play', 'relax', 'calm', 'communication', 'cooperation'
);

create type public.activity_review_status as enum (
  'draft', 'pending_review', 'reviewed', 'blocked'
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  objective text not null,
  description text not null,
  category public.activity_category not null,
  duration_min integer not null check (duration_min between 1 and 120),
  difficulty smallint not null check (difficulty between 1 and 3),
  materials text[] not null default '{}',
  preparation text,
  context text,
  steps text[] not null default '{}',
  comfort_signals text[] not null default '{}',
  stop_signals text[] not null default '{}',
  common_mistakes text[] not null default '{}',
  precautions text,
  expected_outcome text,
  closing_question text not null,
  -- Adecuación por nivel de actividad del perro (para la recomendación).
  min_activity_level public.activity_level not null default 'low',
  review_status public.activity_review_status not null default 'pending_review',
  -- published: visible en la app. review_status: trazabilidad clínica interna.
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.activities enable row level security;
-- Solo actividades publicadas y legibles por usuarios autenticados.
create policy "activities_read_published" on public.activities
  for select using (auth.role() = 'authenticated' and published);

create trigger activities_touch before update on public.activities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Finalización de actividades
-- ---------------------------------------------------------------------------
create table public.activity_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  activity_id uuid not null references public.activities (id),
  -- Fecha local (en la zona del usuario) en que cuenta para la racha.
  local_date date not null,
  -- Cómo respondió el perro (respuesta a closing_question). Texto libre corto.
  dog_response text check (dog_response is null or char_length(dog_response) <= 500),
  source text not null default 'daily' check (source in ('daily', 'manual')),
  created_at timestamptz not null default now(),
  -- Una racha se cuenta como máximo una vez por día por usuario.
  unique (user_id, local_date)
);

alter table public.activity_completions enable row level security;
create policy "completions_select_own" on public.activity_completions
  for select using (auth.uid() = user_id);
-- La escritura ocurre solo vía complete_daily_activity() (definer). Sin insert directo.

create index completions_user_date_idx on public.activity_completions (user_id, local_date desc);

-- ---------------------------------------------------------------------------
-- Recomendación diaria
-- ---------------------------------------------------------------------------
create table public.daily_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  activity_id uuid not null references public.activities (id),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'skipped', 'postponed')),
  created_at timestamptz not null default now(),
  unique (user_id, local_date)
);

alter table public.daily_recommendations enable row level security;
create policy "daily_rec_select_own" on public.daily_recommendations
  for select using (auth.uid() = user_id);
create policy "daily_rec_insert_own" on public.daily_recommendations
  for insert with check (auth.uid() = user_id);
create policy "daily_rec_update_own" on public.daily_recommendations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Rachas
-- ---------------------------------------------------------------------------
create table public.streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_count integer not null default 0 check (current_count >= 0),
  best_count integer not null default 0 check (best_count >= 0),
  last_completed_date date,
  updated_at timestamptz not null default now()
);

alter table public.streaks enable row level security;
create policy "streaks_select_own" on public.streaks
  for select using (auth.uid() = user_id);
-- Escritura solo vía función definer.

-- ---------------------------------------------------------------------------
-- Motor de recompensas (configurable, no hardcodeado)
-- ---------------------------------------------------------------------------
create type public.reward_type as enum ('paws', 'badge', 'character_unlock', 'cosmetic');

create table public.reward_definitions (
  id text primary key, -- p. ej. 'streak_3', 'streak_7', 'first_activity'
  -- Hito basado en racha: se concede al alcanzar current_count = threshold.
  milestone_streak integer check (milestone_streak is null or milestone_streak > 0),
  reward_type public.reward_type not null,
  amount integer check (amount is null or amount >= 0),
  title_key text not null,
  claim_mode text not null default 'auto' check (claim_mode in ('auto', 'manual')),
  active boolean not null default true,
  activates_at timestamptz,
  expires_at timestamptz,
  is_provisional boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reward_definitions enable row level security;
create policy "reward_defs_read_active" on public.reward_definitions
  for select using (auth.role() = 'authenticated' and active);

create table public.reward_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_id text not null references public.reward_definitions (id),
  status text not null default 'granted' check (status in ('granted', 'claimed')),
  granted_at timestamptz not null default now(),
  claimed_at timestamptz,
  -- Previene duplicados: cada usuario obtiene cada recompensa una sola vez.
  unique (user_id, reward_id)
);

alter table public.reward_grants enable row level security;
create policy "reward_grants_select_own" on public.reward_grants
  for select using (auth.uid() = user_id);
-- Concesión solo vía función definer.

-- ---------------------------------------------------------------------------
-- Recompensas provisionales (cantidades sujetas a análisis de economía).
-- Huellas gratuitas conservadoras; hitos de racha bajos para motivar al inicio.
-- ---------------------------------------------------------------------------
insert into public.reward_definitions
  (id, milestone_streak, reward_type, amount, title_key, claim_mode) values
  ('streak_3', 3, 'paws', 1, 'rewards.streak_3', 'auto'),
  ('streak_7', 7, 'paws', 2, 'rewards.streak_7', 'auto'),
  ('streak_14', 14, 'paws', 3, 'rewards.streak_14', 'auto'),
  ('streak_30', 30, 'paws', 5, 'rewards.streak_30', 'auto');

-- ---------------------------------------------------------------------------
-- Función central: completar la actividad diaria.
--
-- Protección de reloj: el cliente envía su fecha local, pero el servidor la
-- valida contra "hoy" calculado en la zona horaria del perfil del usuario. No
-- se admite una fecha distinta de hoy (ni pasado ni futuro), de modo que
-- adelantar el reloj del dispositivo no infla la racha.
--
-- Idempotente por día gracias a unique(user_id, local_date): un segundo intento
-- el mismo día no vuelve a incrementar la racha ni reconcede recompensas.
-- ---------------------------------------------------------------------------
create function public.complete_daily_activity(
  p_activity_id uuid,
  p_dog_response text default null,
  p_source text default 'daily'
)
returns public.streaks
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_tz text;
  v_today date;
  v_streak public.streaks%rowtype;
  v_new_current integer;
  v_reward record;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  -- Actividad debe existir y estar publicada.
  if not exists (select 1 from public.activities where id = p_activity_id and published) then
    raise exception 'ACTIVITY_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  -- Fecha "de hoy" según la zona horaria del perfil del usuario (fuente de verdad).
  select coalesce(timezone, 'Europe/Madrid') into v_tz from public.profiles where id = v_user;
  v_today := (now() at time zone coalesce(v_tz, 'Europe/Madrid'))::date;

  -- Si ya se completó hoy, es idempotente: devolvemos la racha sin cambios.
  if exists (
    select 1 from public.activity_completions where user_id = v_user and local_date = v_today
  ) then
    select * into v_streak from public.streaks where user_id = v_user;
    return v_streak;
  end if;

  -- Registrar finalización (unique(user_id, local_date) protege de duplicados).
  insert into public.activity_completions (user_id, pet_id, activity_id, local_date, dog_response, source)
  select v_user, p.id, p_activity_id, v_today, nullif(p_dog_response, ''), coalesce(p_source, 'daily')
  from (select id from public.pets where owner_id = v_user and deleted_at is null
        order by created_at asc limit 1) p
  union all select v_user, null, p_activity_id, v_today, nullif(p_dog_response, ''), coalesce(p_source, 'daily')
  where not exists (select 1 from public.pets where owner_id = v_user and deleted_at is null)
  limit 1;

  -- Actualizar racha bajo bloqueo de fila.
  insert into public.streaks (user_id, current_count, best_count, last_completed_date)
  values (v_user, 0, 0, null)
  on conflict (user_id) do nothing;

  select * into v_streak from public.streaks where user_id = v_user for update;

  if v_streak.last_completed_date is null then
    v_new_current := 1;
  elsif v_streak.last_completed_date = v_today - 1 then
    v_new_current := v_streak.current_count + 1; -- día consecutivo
  elsif v_streak.last_completed_date = v_today then
    v_new_current := v_streak.current_count; -- salvaguarda (no debería ocurrir)
  else
    v_new_current := 1; -- se rompió la racha; empieza de nuevo
  end if;

  update public.streaks
  set current_count = v_new_current,
      best_count = greatest(best_count, v_new_current),
      last_completed_date = v_today,
      updated_at = now()
  where user_id = v_user
  returning * into v_streak;

  -- Marcar la recomendación de hoy como completada, si existe.
  update public.daily_recommendations
  set status = 'completed'
  where user_id = v_user and local_date = v_today and status <> 'completed';

  -- Evaluar hitos de racha y conceder recompensas idempotentes.
  for v_reward in
    select * from public.reward_definitions
    where active
      and milestone_streak is not null
      and milestone_streak = v_new_current
      and (activates_at is null or activates_at <= now())
      and (expires_at is null or expires_at > now())
  loop
    -- unique(user_id, reward_id) evita doble concesión; ON CONFLICT no hace nada.
    insert into public.reward_grants (user_id, reward_id, status)
    values (v_user, v_reward.id, case when v_reward.claim_mode = 'auto' then 'claimed' else 'granted' end)
    on conflict (user_id, reward_id) do nothing;

    -- Si es de tipo Huellas, reclamación automática y aún no se abonó, acreditar.
    if found and v_reward.reward_type = 'paws' and v_reward.claim_mode = 'auto'
       and coalesce(v_reward.amount, 0) > 0 then
      -- credit_paws exige service_role; aquí estamos en un definer con privilegios,
      -- así que insertamos directamente en el ledger con idempotency key estable.
      declare
        v_acc public.paw_accounts%rowtype;
        v_key text := 'reward:' || v_reward.id || ':' || v_user::text;
      begin
        if not exists (select 1 from public.paw_ledger where user_id = v_user and idempotency_key = v_key) then
          select * into v_acc from public.paw_accounts where user_id = v_user for update;
          insert into public.paw_ledger
            (user_id, kind, delta, balance_before, balance_after, reason, purchase_ref, idempotency_key)
          values
            (v_user, 'reward', v_reward.amount, v_acc.balance, v_acc.balance + v_reward.amount,
             'reward:' || v_reward.id, v_reward.id, v_key);
          update public.paw_accounts set balance = balance + v_reward.amount, updated_at = now()
          where user_id = v_user;
        end if;
      end;
    end if;
  end loop;

  return v_streak;
end;
$$;

revoke all on function public.complete_daily_activity(uuid, text, text) from public, anon;
grant execute on function public.complete_daily_activity(uuid, text, text) to authenticated;

-- Activa actividades y rachas/recompensas en el cliente.
update public.feature_flags set enabled = true, updated_at = now()
where key in ('activities', 'streaks_rewards');
