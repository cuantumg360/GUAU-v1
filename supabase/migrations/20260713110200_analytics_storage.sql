-- GUAU · Migración 3: analítica de producto y almacenamiento privado de fotos.

-- ---------------------------------------------------------------------------
-- Eventos de analítica
-- Reglas: nunca contienen información sanitaria sensible ni imágenes; solo
-- nombres de evento de la taxonomía documentada y propiedades planas.
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) <= 80),
  props jsonb not null default '{}'::jsonb,
  session_id text,
  app_version text,
  platform text check (platform in ('ios', 'android', 'web') or platform is null),
  client_ts timestamptz,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

-- Los clientes solo insertan eventos propios; no pueden leer los de nadie
-- (la lectura es para herramientas internas con service_role).
create policy "analytics_insert_own" on public.analytics_events
  for insert with check (auth.uid() = user_id);

create index analytics_events_name_idx on public.analytics_events (name, created_at desc);
create index analytics_events_user_idx on public.analytics_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Bucket privado para fotos de perros
-- Estructura de rutas: {user_id}/{pet_id}/{uuid}.jpg
-- Acceso solo mediante URLs firmadas de corta duración generadas por el cliente
-- autenticado sobre sus propios objetos.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  false,
  5242880, -- 5 MB por foto de perfil
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "pet_photos_read_own" on storage.objects
  for select using (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
