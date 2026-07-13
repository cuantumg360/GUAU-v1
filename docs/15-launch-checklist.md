# 15 — Checklist de lanzamiento

## Estrategia operativa (fases)

Lista de espera → **beta cerrada** (partners de Clay + comunidades) → beta ampliada →
lanzamiento. En cada fase se valida: escáneres, actividades, personaje, precio,
conversión gratuito→Pro, conversión mensual→anual, venta de Huellas, activación de
rachas, retención D7/D30, feedback, errores, soporte.

### Criterios de decisión (gates)

- **Abrir beta:** onboarding + perfil + 1 escáner completos e2e; crash-free ≥99 %.
- **Empezar a cobrar:** escáneres estables, ledger auditado en producción, restauración
  de compras verificada, SMTP propio, política de privacidad y ToS publicados.
- **Ampliar usuarios:** D7 ≥ objetivo interno y coste de inferencia por escáner conocido.
- **Activar plan anual / packs:** conversión mensual sana y economía de Huellas validada
  (costes provisionales → definitivos).
- **Incorporar chat:** funciones principales completas y estables (feature flag `chat`).

## Checklist técnico

### Hecho en esta entrega
- [x] Repo auditado, stack y arquitectura definidos y documentados.
- [x] Backend real (Supabase) con RLS en todas las tablas de cliente.
- [x] Auth real (alta/login/persistencia/borrado de cuenta) verificada e2e.
- [x] Perfil del perro con procedencia + foto en storage privado.
- [x] Economía de Huellas atómica, idempotente e inmutable (verificada e2e).
- [x] Catálogo de precios correcto (tests) y config/flags en servidor.
- [x] Analítica con RLS y taxonomía; sin datos sanitarios en eventos.
- [x] Personaje v0 con regla sanitaria y reduced motion.
- [x] `tsc` + `lint` + `vitest` verdes; export web compila.
- [x] Advisors de seguridad revisados y funciones endurecidas.

### Pendiente para lanzamiento (próximas etapas)
- [ ] Calendario + recordatorios + notificaciones push (Etapa 3).
- [ ] Actividades + actividad diaria + rachas + recompensas (Etapas 4–5).
- [ ] Recuerdos texto/voz con versionado (Etapa 6).
- [ ] Escáneres cartilla/comida/físico con IA server-side + confirmación humana (7–9).
- [ ] Compras/suscripciones reales (App Store/Play) + webhooks + restauración (Etapa 10).
- [ ] Panel/scripts de administración para contenido y config comercial.
- [ ] Exportación de datos del usuario (RGPD) — complementa el borrado ya implementado.

### Store readiness / seguridad / privacidad
- [ ] Cuentas de desarrollador Apple/Google.
- [ ] Activar *leaked password protection* en Supabase Auth.
- [ ] SMTP propio (el integrado tiene cuota mínima).
- [ ] Iconos/splash definitivos de marca (los actuales son placeholders del template).
- [ ] Política de privacidad, ToS y textos de consentimiento publicados.
- [ ] Rate limiting y validación de uploads en las Edge Functions de IA.
- [ ] Revisión de accesibilidad (VoiceOver/TalkBack) y reduced motion en flujos nuevos.

## Growth (Clay)
- [x] ICPs, segmentos, campos, scoring y cadencias definidos.
- [x] Enriquecimiento real de 3 canales-partner ES (Dogfy Diet, Kiwoko, Barkibu).
- [ ] Ampliar listas y contactos; preparar borradores por segmento (revisión humana).
- [ ] Aprobar y lanzar primera campaña de beta (nunca automática).
