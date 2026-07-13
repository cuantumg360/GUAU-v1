-- GUAU · Migración 4: hardening de funciones tras revisión con advisors.
--
-- Supabase concede EXECUTE a anon/authenticated por privilegios por defecto.
-- Restringimos cada función a los roles que realmente deben invocarla y
-- fijamos search_path en las funciones de trigger.

-- Funciones de trigger: nadie debe invocarlas vía RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_pet_limit() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.paw_ledger_immutable() from public, anon, authenticated;

-- Heredada del prototipo previo: event trigger ensure_rls -> rls_auto_enable().
-- Se conserva como red de seguridad (activa RLS en toda tabla nueva) pero no
-- debe ser ejecutable vía RPC.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Economía: spend_paws solo usuarios autenticados; credit_paws y
-- validate_custom_topup solo servidor.
revoke execute on function public.spend_paws(text, text, text) from public, anon;
revoke execute on function public.credit_paws(uuid, public.paw_tx_kind, integer, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.validate_custom_topup(integer) from public, anon, authenticated;
grant execute on function public.validate_custom_topup(integer) to service_role;

-- search_path fijo en funciones de trigger sin él.
alter function public.set_updated_at() set search_path = public;
alter function public.paw_ledger_immutable() set search_path = public;
