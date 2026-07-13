-- GUAU · Migración 11 (Etapa 10, UI): activar la superficie de monetización.
--
-- Los productos, entitlements, ledger y funciones de Huellas ya existen desde la
-- migración 2. Esta migración solo activa el feature flag que muestra el paywall
-- y la compra de Huellas en el cliente. La compra real sigue tras el adapter mock
-- (estado "no disponible"): ningún derecho se concede sin compra verificada en
-- servidor. Ver docs/09-monetization.md y decision log D-021.

update public.feature_flags set enabled = true, updated_at = now() where key = 'paywall';
