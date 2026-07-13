# 12 — Analítica

Implementación: `src/lib/analytics.ts` → tabla `analytics_events` (RLS: insert propio).
**Regla dura:** ningún evento contiene información sanitaria sensible ni contenido libre;
solo nombres de la taxonomía y propiedades planas. Emisión fire-and-forget (nunca rompe
la UX).

## North-star metric (provisional)

> **Acciones significativas de cuidado o vínculo completadas por perro activo cada
> semana.**

- *Acción significativa* = escáner completado, recordatorio marcado como hecho,
  actividad diaria completada, o recuerdo creado. (Excluye abrir la app o navegar.)
- *Perro activo* = perro con ≥1 acción significativa en la ventana de 7 días.
- **Cálculo:** Σ acciones significativas de la semana ÷ nº de perros activos.
- **Limitaciones:** al inicio, escaso volumen; ponderar acciones se decidirá con datos;
  no mezclar semanas parciales.

## Taxonomía

### Adquisición
`app_open, onboarding_started, onboarding_step_viewed, onboarding_completed,
signup_completed` (+ fuente de adquisición cuando exista atribución).

### Activación
`pet_created, pet_photo_added` (primer perro/escáner/recordatorio/actividad/recuerdo y
primera interacción con el personaje se añadirán al activar cada etapa).

### Retención
Actividades diarias completadas, continuación de rachas, recordatorios completados,
recuerdos creados, escáneres repetidos, sesiones semanales (Etapas 3–6).

### Monetización
Paywall visto, plan seleccionado, compra iniciada/completada/fallida, renovación,
cancelación, conversión anual, pack visto/comprado, Huellas gastadas, saldo insuficiente
(Etapa 10).

### Calidad
OCR corregido, captura repetida, resultado rechazado, error de procesamiento, tiempo de
procesamiento, confianza, contacto con soporte (Etapas 7–9).

## Implementado hoy

Eventos activos: `app_open, signup_completed, signin_completed, onboarding_started,
onboarding_step_viewed, onboarding_completed, pet_created, pet_updated, pet_photo_added,
signout, account_delete_requested`. Cada evento lleva `user_id, name, props, session_id,
platform, client_ts`. Tipado con `AnalyticsEvent` para evitar nombres inventados en los
call sites.
