-- GUAU · Migración 10: corrección del soft delete de recuerdos.
--
-- Bug detectado por el e2e de recuerdos (docs/13): la política SELECT de
-- `memories` incluía `deleted_at IS NULL`. PostgreSQL aplica la política SELECT
-- sobre la fila resultante de un UPDATE, así que fijar `deleted_at` hacía que la
-- fila dejara de ser visible y el UPDATE se rechazaba con "new row violates RLS".
-- Resultado: el soft delete era imposible.
--
-- Corrección: la política SELECT filtra solo por propiedad (como en `pets`); el
-- filtro de borrados lógicos se aplica en las consultas del cliente
-- (.is('deleted_at', null)). Ver decision log D-018.

drop policy if exists "memories_select_own" on public.memories;
create policy "memories_select_own" on public.memories
  for select using (auth.uid() = owner_id);
