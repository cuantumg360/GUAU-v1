-- GUAU · Migración 2: economía de Huellas (ledger inmutable), catálogo de
-- productos, costes de operación y entitlements.
--
-- Principios:
--   * El cliente NUNCA modifica saldos: solo lee su cuenta y su historial.
--   * Todo movimiento pasa por funciones atómicas con idempotency key.
--   * El ledger es append-only; los saldos derivan de él y se verifican con
--     la cuenta materializada (paw_accounts) bajo bloqueo de fila.

-- ---------------------------------------------------------------------------
-- Cuenta materializada de Huellas (una por usuario)
-- ---------------------------------------------------------------------------
create table public.paw_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

alter table public.paw_accounts enable row level security;
create policy "paw_accounts_select_own" on public.paw_accounts
  for select using (auth.uid() = user_id);
-- Sin insert/update/delete para clientes: solo funciones definer / service_role.

-- Ahora que existe paw_accounts, activamos el trigger de alta de usuario.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Ledger inmutable
-- ---------------------------------------------------------------------------
create type public.paw_tx_kind as enum
  ('purchase', 'reward', 'spend', 'refund', 'adjustment', 'subscription_grant');

create type public.paw_tx_status as enum ('completed', 'reversed');

create table public.paw_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.paw_tx_kind not null,
  delta integer not null check (delta <> 0),
  balance_before integer not null check (balance_before >= 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null,
  operation text, -- clave de operation_costs cuando kind = 'spend'
  related_entity text, -- p. ej. id del escaneo que consumió las Huellas
  purchase_ref text, -- referencia de compra/recompensa externa
  idempotency_key text not null,
  status public.paw_tx_status not null default 'completed',
  meta jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

alter table public.paw_ledger enable row level security;
create policy "paw_ledger_select_own" on public.paw_ledger
  for select using (auth.uid() = user_id);
-- Append-only: sin policies de escritura para clientes; ni siquiera el servidor
-- actualiza filas (las reversiones son movimientos nuevos con kind='refund').

create index paw_ledger_user_idx on public.paw_ledger (user_id, created_at desc);

-- Bloquea updates/deletes también para roles elevados por accidente.
create function public.paw_ledger_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'PAW_LEDGER_IMMUTABLE';
end;
$$;

create trigger paw_ledger_no_update before update or delete on public.paw_ledger
  for each row execute function public.paw_ledger_immutable();

-- ---------------------------------------------------------------------------
-- Catálogo de productos y costes de operación (administrables, no hardcodeados)
-- ---------------------------------------------------------------------------
create table public.products (
  id text primary key, -- id lógico estable, p. ej. 'pro_monthly'
  kind text not null check (kind in ('subscription', 'paw_pack', 'paw_custom')),
  title_key text not null, -- clave i18n, el cliente no recibe textos hardcodeados
  paws integer check (paws is null or paws > 0),
  base_price_cents integer not null check (base_price_cents >= 0),
  final_price_cents integer not null check (final_price_cents >= 0),
  currency text not null default 'EUR',
  billing_period text check (billing_period in ('month', 'year') or billing_period is null),
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
create policy "products_read_active" on public.products
  for select using (auth.role() = 'authenticated' and active);

insert into public.products
  (id, kind, title_key, paws, base_price_cents, final_price_cents, currency, billing_period, sort_order)
values
  -- Suscripciones (precios fijados por el brief)
  ('pro_monthly', 'subscription', 'products.proMonthly', null, 1995, 1995, 'EUR', 'month', 1),
  ('pro_annual',  'subscription', 'products.proAnnual',  null, 23940, 16595, 'EUR', 'year', 2),
  -- Packs de Huellas: siempre 30 % de descuento sobre 1 € / Huella
  ('paw_pack_25',  'paw_pack', 'products.pawPack25',  25,  2500,  1750, 'EUR', null, 10),
  ('paw_pack_50',  'paw_pack', 'products.pawPack50',  50,  5000,  3500, 'EUR', null, 11),
  ('paw_pack_100', 'paw_pack', 'products.pawPack100', 100, 10000, 7000, 'EUR', null, 12),
  -- Recarga personalizada: sin descuento, 1 € por Huella; los límites viven en
  -- app_config (paws.custom_topup_min / max). El precio se calcula en servidor.
  ('paw_custom', 'paw_custom', 'products.pawCustom', null, 100, 100, 'EUR', null, 20);

create table public.operation_costs (
  operation text primary key, -- 'physical_scan' | 'food_scan' | 'booklet_scan' | ...
  paw_cost integer not null check (paw_cost >= 0),
  active boolean not null default true,
  is_provisional boolean not null default true, -- pendiente de análisis de economía
  updated_at timestamptz not null default now()
);

alter table public.operation_costs enable row level security;
create policy "operation_costs_read" on public.operation_costs
  for select using (auth.role() = 'authenticated');

-- Costes PROVISIONALES (is_provisional=true): se revisarán con datos reales de
-- coste de inferencia antes del lanzamiento. Nunca se leen desde el cliente para
-- cobrar; el cobro ocurre en spend_paws() en servidor.
insert into public.operation_costs (operation, paw_cost) values
  ('physical_scan', 2),
  ('food_scan', 1),
  ('booklet_scan', 2);

-- ---------------------------------------------------------------------------
-- Entitlements (derechos validados en servidor)
-- ---------------------------------------------------------------------------
create type public.plan_kind as enum ('free', 'pro_monthly', 'pro_annual');

create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan public.plan_kind not null default 'free',
  status text not null default 'active'
    check (status in ('active', 'grace', 'billing_retry', 'expired', 'canceled')),
  current_period_end timestamptz,
  source text not null default 'default'
    check (source in ('default', 'store_apple', 'store_google', 'admin', 'mock')),
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;
create policy "entitlements_select_own" on public.entitlements
  for select using (auth.uid() = user_id);
-- Escritura solo desde servidor (webhooks de tienda / herramientas admin).

-- ---------------------------------------------------------------------------
-- Funciones atómicas de la economía
-- ---------------------------------------------------------------------------

-- Consumo de Huellas. La invoca el servidor (Edge Function) en nombre del
-- usuario autenticado ANTES de lanzar una operación de coste real.
-- Idempotente: si la key ya existe, devuelve el movimiento original sin cobrar.
create function public.spend_paws(
  p_operation text,
  p_idempotency_key text,
  p_related_entity text default null
)
returns public.paw_ledger
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_cost integer;
  v_account public.paw_accounts%rowtype;
  v_existing public.paw_ledger%rowtype;
  v_tx public.paw_ledger%rowtype;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) < 8 then
    raise exception 'INVALID_IDEMPOTENCY_KEY' using errcode = 'P0001';
  end if;

  select * into v_existing
  from public.paw_ledger
  where user_id = v_user and idempotency_key = p_idempotency_key;
  if found then
    return v_existing; -- reintento: no se cobra dos veces
  end if;

  select paw_cost into v_cost
  from public.operation_costs
  where operation = p_operation and active;
  if v_cost is null then
    raise exception 'UNKNOWN_OPERATION' using errcode = 'P0001';
  end if;

  select * into v_account
  from public.paw_accounts
  where user_id = v_user
  for update; -- serializa movimientos concurrentes del mismo usuario
  if not found then
    raise exception 'ACCOUNT_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_cost = 0 then
    -- Operación gratuita según configuración vigente: no se registra cobro.
    raise exception 'OPERATION_IS_FREE' using errcode = 'P0002';
  end if;

  if v_account.balance < v_cost then
    raise exception 'INSUFFICIENT_PAWS' using errcode = 'P0003';
  end if;

  insert into public.paw_ledger
    (user_id, kind, delta, balance_before, balance_after, reason, operation,
     related_entity, idempotency_key)
  values
    (v_user, 'spend', -v_cost, v_account.balance, v_account.balance - v_cost,
     'operation:' || p_operation, p_operation, p_related_entity, p_idempotency_key)
  returning * into v_tx;

  update public.paw_accounts
  set balance = v_tx.balance_after, updated_at = now()
  where user_id = v_user;

  return v_tx;
end;
$$;

-- Abono de Huellas. SOLO service_role (webhooks de compra verificada, motor de
-- recompensas, soporte). No expuesta a usuarios autenticados.
create function public.credit_paws(
  p_user uuid,
  p_kind public.paw_tx_kind,
  p_amount integer,
  p_reason text,
  p_idempotency_key text,
  p_purchase_ref text default null
)
returns public.paw_ledger
language plpgsql
security definer set search_path = public
as $$
declare
  v_account public.paw_accounts%rowtype;
  v_existing public.paw_ledger%rowtype;
  v_tx public.paw_ledger%rowtype;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;
  if p_kind not in ('purchase', 'reward', 'refund', 'adjustment', 'subscription_grant') then
    raise exception 'INVALID_KIND' using errcode = 'P0001';
  end if;

  select * into v_existing
  from public.paw_ledger
  where user_id = p_user and idempotency_key = p_idempotency_key;
  if found then
    return v_existing;
  end if;

  select * into v_account from public.paw_accounts where user_id = p_user for update;
  if not found then
    raise exception 'ACCOUNT_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.paw_ledger
    (user_id, kind, delta, balance_before, balance_after, reason, purchase_ref,
     idempotency_key)
  values
    (p_user, p_kind, p_amount, v_account.balance, v_account.balance + p_amount,
     p_reason, p_purchase_ref, p_idempotency_key)
  returning * into v_tx;

  update public.paw_accounts
  set balance = v_tx.balance_after, updated_at = now()
  where user_id = p_user;

  return v_tx;
end;
$$;

-- Los clientes autenticados pueden invocar spend_paws (el coste y el saldo se
-- validan dentro); credit_paws queda restringida por el check interno.
revoke all on function public.spend_paws(text, text, text) from public;
grant execute on function public.spend_paws(text, text, text) to authenticated;
revoke all on function public.credit_paws(uuid, public.paw_tx_kind, integer, text, text, text) from public;
grant execute on function public.credit_paws(uuid, public.paw_tx_kind, integer, text, text, text) to service_role;

-- Validación de recarga personalizada (se usará desde la Edge Function de compra).
create function public.validate_custom_topup(p_paws integer)
returns integer -- devuelve el precio en céntimos
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_min integer;
  v_max integer;
  v_unit integer;
begin
  select (value ->> 'value')::int into v_min from public.app_config where key = 'paws.custom_topup_min';
  select (value ->> 'value')::int into v_max from public.app_config where key = 'paws.custom_topup_max';
  select (value ->> 'value')::int into v_unit from public.app_config where key = 'paws.unit_price_cents';

  if p_paws is null or p_paws <> floor(p_paws) then
    raise exception 'PAWS_MUST_BE_INTEGER' using errcode = 'P0001';
  end if;
  if p_paws < coalesce(v_min, 5) then
    raise exception 'PAWS_BELOW_MINIMUM' using errcode = 'P0001';
  end if;
  if p_paws > coalesce(v_max, 500) then
    raise exception 'PAWS_ABOVE_MAXIMUM' using errcode = 'P0001';
  end if;
  return p_paws * coalesce(v_unit, 100);
end;
$$;
