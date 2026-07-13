-- GUAU · Migración 8: corrección de la inmutabilidad del ledger de Huellas.
--
-- Bug detectado por el test e2e de recompensas (docs/13): el trigger que impedía
-- UPDATE/DELETE sobre paw_ledger también bloqueaba el DELETE en cascada al
-- eliminar un usuario (auth.users on delete cascade). Consecuencia: la
-- eliminación de cuenta (derecho de supresión RGPD) fallaría para cualquier
-- usuario que hubiera ganado o gastado Huellas alguna vez.
--
-- Corrección: el trigger bloquea solo UPDATE. La garantía de "append-only para
-- clientes" la aporta la RLS de paw_ledger (solo SELECT del propio usuario; sin
-- políticas de INSERT/UPDATE/DELETE), de modo que ningún cliente puede borrar
-- filas. El DELETE queda permitido a nivel de motor únicamente para que la
-- cascada de borrado de cuenta funcione. Ver decision log D-016.

drop trigger if exists paw_ledger_no_update on public.paw_ledger;

create trigger paw_ledger_no_update
  before update on public.paw_ledger
  for each row execute function public.paw_ledger_immutable();
