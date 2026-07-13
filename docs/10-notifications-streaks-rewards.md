# 10 — Notificaciones, rachas y recompensas

Estado: diseño y reglas fijadas (Etapas 3–5). Los tokens y el comportamiento del
personaje ya respetan estas reglas; el motor se implementa con sus migraciones.

## Notificaciones

Configurables por el usuario: cuándo recibir el aviso, más de un aviso, repetición,
posponer, marcar como completada. Tipos: citas, vacunas, desparasitaciones, medicación,
compra de comida, peluquería, baños, entrenamientos, actividades, viajes, paseos,
recordatorios personalizados. Preferencias en `NotificationPreference` (Etapa 3).
Push reales con Expo Notifications. **Zonas horarias correctas** (probadas). Los
recordatorios importados de la cartilla se diferencian visualmente de los manuales.

## Actividad diaria (transversal, sin sección "Hoy")

Cada día GUAU puede seleccionar una actividad apropiada y: notificar, mostrarla
contextualmente al abrir, permitir empezar/cambiar/posponer, registrar finalización,
preguntar cómo respondió el perro y usar la respuesta para futuras recomendaciones.
Selección inicial **determinista** por perfil (edad, actividad, dificultad, historial,
preferencias, tiempo, progreso, respuestas). No repite mecánicamente. Evoluciona a
personalización avanzada más tarde.

## Rachas

- Sube **solo** al completar una **actividad diaria válida**. No por abrir la app,
  tocar una pantalla, crear un recordatorio ni simular.
- Contador actual, mejor racha, hitos, historial, estado del día, zona horaria correcta.
- **Protección de reloj local en servidor** (la validez del día no se decide en el
  dispositivo). Reglas configurables desde servidor. Posible recuperación/protección de
  racha futura.
- Tono **motivador, nunca manipulador**. El personaje **no** enferma, llora ni castiga
  por perder una racha (garantizado por el diseño del personaje: sin estados de castigo).

## Recompensas

Motor **configurable, no hardcodeado**. Al alcanzar hitos el usuario puede recibir:
Huellas, actividades especiales, reacciones/animaciones del personaje, accesorios,
elementos visuales, insignias, recuerdos conmemorativos, beneficios temporales.

`RewardDefinition` (hito, tipo, cantidad, activación, límites, elegibilidad, reclamación
automática/manual, caducidad, estado) y `RewardGrant` (concesiones). Prevención de doble
reclamación, manipulación local, duplicados y recompensas sin actividad válida: las
concesiones de Huellas pasan por `credit_paws` (service_role, idempotente) — **ya
implementado**. Cantidades de Huellas gratuitas **no fijadas** aún (pendiente de análisis
de economía; ver decision log).
