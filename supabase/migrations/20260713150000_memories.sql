-- GUAU · Migración 9 (Etapa 6): cuaderno de recuerdos.
--
-- Reglas del brief: conservar SIEMPRE el relato original y la transcripción
-- original; la versión procesada es aparte y versionada; historial de edición.
-- La IA (versión organizada) llegará por la capa de IA (Edge Function); esta
-- migración soporta texto y voz con transcripción/edición manual sin bloquear.

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  title text check (title is null or char_length(title) <= 140),
  -- Fecha de la experiencia (puede diferir de la de creación).
  experienced_on date,
  -- Origen de la entrada.
  input_kind text not null default 'text' check (input_kind in ('text', 'voice')),
  -- Relato ORIGINAL tal cual lo escribió/dictó el usuario (nunca se sobrescribe).
  original_text text not null check (char_length(original_text) between 1 and 8000),
  -- Transcripción original de la voz, si aplica (también inmutable).
  original_transcript text,
  -- Ruta del audio en el bucket privado, si aplica.
  audio_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.memories enable row level security;

create policy "memories_select_own" on public.memories
  for select using (auth.uid() = owner_id and deleted_at is null);
create policy "memories_insert_own" on public.memories
  for insert with check (
    auth.uid() = owner_id
    and (pet_id is null or exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid()))
  );
create policy "memories_update_own" on public.memories
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create trigger memories_touch before update on public.memories
  for each row execute function public.set_updated_at();

create index memories_owner_idx on public.memories (owner_id, experienced_on desc nulls last, created_at desc)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Versiones del contenido procesado (historial de edición, append-only).
-- version 1 = primera versión editada; el original vive en memories.original_text.
-- ---------------------------------------------------------------------------
create table public.memory_versions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  version integer not null check (version >= 1),
  -- Contenido de esta versión (editado por el usuario o generado y confirmado).
  content text not null check (char_length(content) between 1 and 8000),
  -- Cómo se generó: manual (el usuario) o ai (organización por IA, confirmada).
  produced_by text not null default 'manual' check (produced_by in ('manual', 'ai')),
  created_at timestamptz not null default now(),
  unique (memory_id, version)
);

alter table public.memory_versions enable row level security;

create policy "memory_versions_select_own" on public.memory_versions
  for select using (auth.uid() = owner_id);
create policy "memory_versions_insert_own" on public.memory_versions
  for insert with check (
    auth.uid() = owner_id
    and exists (select 1 from public.memories m where m.id = memory_id and m.owner_id = auth.uid())
  );
-- Sin update/delete: el historial de versiones es append-only. Para "editar" se
-- inserta una versión nueva; el original y las versiones previas se conservan.

create index memory_versions_memory_idx on public.memory_versions (memory_id, version desc);

-- ---------------------------------------------------------------------------
-- Bucket privado para audios de recuerdos.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-audio', 'memory-audio', false, 26214400, -- 25 MB por audio
  array['audio/m4a', 'audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/webm']
)
on conflict (id) do nothing;

create policy "memory_audio_read_own" on storage.objects
  for select using (bucket_id = 'memory-audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "memory_audio_insert_own" on storage.objects
  for insert with check (bucket_id = 'memory-audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "memory_audio_delete_own" on storage.objects
  for delete using (bucket_id = 'memory-audio' and (storage.foldername(name))[1] = auth.uid()::text);

update public.feature_flags set enabled = true, updated_at = now() where key = 'memories';
