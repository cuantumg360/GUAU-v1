# 17 — Limitaciones conocidas

Honestidad sobre lo que **no** está terminado en esta entrega (Etapa 1). Nada de esto se
presenta como funcional en la app: las funciones no listas están tras feature flags de
servidor y se muestran como "en construcción".

## Alcance funcional

- **Escáneres (físico/comida/cartilla), calendario, recordatorios, actividades, actividad
  diaria, rachas, recompensas y recuerdos** aún no están implementados de extremo a
  extremo. Su modelo de datos, contratos y reglas están definidos (docs 06–13) y sus
  feature flags están en `false`.
- **Compras/suscripciones**: el catálogo, entitlements y ledger existen y están probados,
  pero la integración con App Store/Play (webhooks, restauración real) es de la Etapa 10.
  Hasta entonces, ningún derecho de pago se concede desde el cliente.
- **Chat**: intencionadamente pospuesto (flag `chat=false`).

## Técnicas

- **Tests de componentes/e2e de UI**: la verificación de UI se hizo con `tsc`, `lint`,
  export web completo y e2e de backend (13/13). Los tests de componentes con jest-expo y
  e2e con Maestro se añadirán cuando la superficie de UI crezca; hoy la lógica crítica
  vive en `src/core` y está cubierta por Vitest (27 tests).
- **Salida web** en modo `single` (SPA): el prerender estático rompe por
  AsyncStorage/`window` en Node. GUAU es mobile-first; la web no es canal de lanzamiento.
- **Confirmación de correo**: el proyecto Supabase la exige y el SMTP integrado tiene
  cuota baja; la app soporta el flujo "revisa tu correo". Falta SMTP propio para beta.
- **Iconos/splash**: siguen siendo los placeholders de la plantilla Expo; faltan los
  definitivos de marca.
- **Tipos generados**: `database.types.ts` debe regenerarse manualmente tras cada
  migración (proceso documentado; automatizable en CI más adelante).

## Seguridad (pendientes operativos, no de código)

- Activar *leaked password protection* en Auth (advisor WARN).
- Rate limiting y validación de tamaño/contenido de uploads en las Edge Functions de IA
  (llegan con los escáneres).

## Growth (Clay)

- El MCP de Clay tuvo desconexiones intermitentes; aun así se enriquecieron 3 empresas
  reales. Falta ampliar listas, enriquecer contactos y firmografía adicional, y preparar
  borradores de campaña (siempre con aprobación humana antes de enviar).

## Personaje

- Versión 0 programática (Reanimated). El diseño ilustrado de alta fidelidad y el set
  ampliado de estados/animaciones/accesorios son trabajo posterior; la API (`MascotState`)
  ya está estabilizada para no romper call sites al sustituir el render.
