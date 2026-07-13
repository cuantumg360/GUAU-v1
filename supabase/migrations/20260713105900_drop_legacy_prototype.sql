-- GUAU · Migración 0: retirada del prototipo previo.
--
-- El proyecto Supabase "guau v1" contenía dos tablas creadas fuera de control
-- de migraciones (public.pets y public.scans, con columnas en español, PK de
-- tipo text y sin modelo de procedencia). Ambas tenían 0 filas en el momento
-- de esta migración (verificado el 2026-07-13), por lo que no hay pérdida de
-- datos. Ver docs/00-repository-audit.md y decision log D-003.

drop table if exists public.scans cascade;
drop table if exists public.pets cascade;
