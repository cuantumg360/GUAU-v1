# 16 — Decision log

Registro de decisiones relevantes. Cada entrada indica contexto, decisión, motivo y
cómo revertirla. Las decisiones estratégicas llevan además alternativas evaluadas.

---

## D-001 · Stack por defecto (2026-07-13)

- **Contexto:** repositorio vacío, sin arquitectura previa aprovechable.
- **Decisión (actualizada por D-022):** Expo SDK 54 + React Native 0.81 + TypeScript estricto + expo-router;
  backend Supabase (Postgres 17, Auth, Storage, Edge Functions); TanStack Query; Zod;
  i18next; Vitest para lógica pura.
- **Motivo:** es exactamente la arquitectura por defecto que fija el brief (móvil
  moderna, tipada, multiplataforma, PostgreSQL, funciones de servidor). Plantilla
  oficial estable, sin dependencias experimentales.
- **Reversión:** el dominio está aislado en `src/core` y `src/features`; la capa de
  datos pasa por `src/lib/supabase.ts`, sustituible por otro proveedor Postgres.

## D-002 · Reutilizar el proyecto Supabase "guau v1" (2026-07-13)

- **Contexto:** existía un proyecto pausado con ese nombre en la cuenta del propietario.
- **Decisión:** restaurarlo y usarlo como único backend (región `eu-north-1`, UE).
- **Motivo:** creado para este producto; restaurar no genera coste nuevo; región RGPD.
- **Reversión:** exportar esquema (está en `supabase/migrations/`) y datos a otro
  proyecto; las claves del cliente se cambian en `.env`.

## D-003 · Retirar el prototipo previo de la base de datos (2026-07-13)

- **Contexto:** el proyecto contenía `pets` y `scans` creadas sin migraciones, con 0
  filas verificadas, PK `text` y sin modelo de procedencia ni economía.
- **Decisión:** `drop table` de ambas en la migración `20260713105900`.
- **Motivo:** esquema incompatible con los requisitos (procedencia, confirmación
  humana, ledger); sin datos que preservar.
- **Reversión:** git conserva la migración; el esquema antiguo era trivial (8 columnas).

## D-004 · Conservar el event trigger `ensure_rls` heredado (2026-07-13)

- **Decisión:** mantenerlo (activa RLS automáticamente en cada tabla nueva) y revocar
  su ejecución vía RPC.
- **Motivo:** defensa en profundidad alineada con nuestra política "RLS en todo".
- **Reversión:** `drop event trigger ensure_rls;`.

## D-005 · Ledger de Huellas con cuenta materializada + funciones definer (2026-07-13)

- **Alternativas:** (a) saldo calculado siempre desde el ledger; (b) tabla de saldo
  actualizada por el cliente; (c) ledger append-only + cuenta materializada bloqueada
  por fila y funciones `SECURITY DEFINER` con idempotency key.
- **Decisión:** (c). El cliente solo lee; `spend_paws` es atómica y devuelve el
  movimiento original ante reintentos; `credit_paws` exige `service_role`; el ledger
  tiene trigger que impide UPDATE/DELETE incluso a roles elevados.
- **Motivo:** (a) encarece cada lectura; (b) es manipulable. (c) cumple "sin doble
  cobro, sin saldos negativos, sin manipulación local".
- **Reversión:** las funciones encapsulan el contrato; puede migrarse a otro motor
  manteniendo la firma RPC.

## D-006 · Costes provisionales de operaciones (2026-07-13)

- **Decisión:** sembrar `operation_costs` (physical_scan=2, food_scan=1,
  booklet_scan=2 Huellas) con `is_provisional=true`.
- **Motivo:** el brief prohíbe fijar cantidades definitivas sin análisis de economía;
  las cifras son configurables desde servidor y están marcadas como provisionales.
- **Reversión:** `update operation_costs set paw_cost=…` (sin desplegar código).

## D-007 · Límite de mascotas configurable en servidor (2026-07-13)

- **Decisión:** `app_config['limits.max_pets_free']` (provisional: 3) aplicado por
  trigger en el insert; el cliente no conoce el número.
- **Motivo:** el brief prohíbe inventar límites comerciales hardcodeados.

## D-008 · Onboarding conversacional de una pregunta por pantalla (2026-07-13)

- **Contexto:** investigación Mobbin (Fi, Amazon, Walmart, Taobao; ver doc 03).
- **Decisión:** pasos conversacionales (nombre → sexo/esterilización → nacimiento
  exacto o aproximado → raza/cruce → peso/actividad → foto + resumen), sin preguntas
  médicas en el alta.
- **Motivo:** el patrón de Fi es el de mayor calidad percibida; la edad aproximada
  (patrón Amazon) evita el abandono de quien no sabe la fecha; las alergias y
  condiciones llegan después, con el modelo de procedencia.

## D-009 · Personaje virtual v0 programático (2026-07-13)

- **Decisión:** implementar el personaje como componente Reanimated (criatura-huella
  con estados) y no bloquear la Etapa 1 esperando ilustración final. Nombre
  provisional **"Toba"** vía i18n/config remota; candidatos alternativos: Uma, Kiro,
  Palo. API de estados estable (`MascotState`).
- **Motivo:** el brief pide no bloquear el lanzamiento y mantener el nombre
  reemplazable.
- **Reversión:** sustituir el render interno de `Mascot.tsx` (Lottie/Rive) sin tocar
  los call sites.

## D-010 · Salida web `single` en lugar de `static` (2026-07-13)

- **Contexto:** el prerender estático de expo-router ejecuta el árbol en Node y
  AsyncStorage/supabase-js tocan `window` → export roto.
- **Decisión:** `web.output = "single"` (SPA). GUAU es mobile-first; la web no es un
  canal de lanzamiento.
- **Reversión:** reactivar `static` con guardas SSR si algún día la web importa.

## D-011 · Confirmación de correo y usuarios de prueba (2026-07-13)

- **Contexto:** el proyecto Supabase tiene la confirmación de correo activada y el
  SMTP integrado tiene cuota mínima (~2 correos/hora).
- **Decisión:** la app soporta ambos modos (si no hay sesión tras el alta muestra
  "revisa tu correo"); las pruebas e2e crean el usuario por SQL con contraseña
  bcrypt y lo eliminan al terminar vía `delete-account`.
- **Pendiente:** configurar SMTP propio antes de la beta (ver launch checklist).

## D-013 · Unificar CalendarEvent y Reminder en `reminders` (2026-07-13)

- **Contexto:** el brief lista CalendarEvent y Reminder como entidades separadas.
- **Decisión:** una sola tabla `reminders`. En GUAU todo elemento del calendario es
  accionable/notificable (cita, vacuna, paseo, medicación…), así que separarlos
  duplicaría lógica sin aportar valor. El campo `source` (manual|booklet) distingue los
  importados de la cartilla; `category` cubre los 12 tipos del brief.
- **Reversión:** si en el futuro hacen falta eventos no accionables, se añade una vista
  o una columna `kind`.

## D-014 · Notificaciones locales primero; push remotas en hardening (2026-07-13)

- **Decisión:** programar avisos con notificaciones **locales** de expo-notifications
  (funcionan sin backend de push). Se agenda la próxima ocurrencia con sus antelaciones;
  al completar un recurrente se crea la siguiente instancia.
- **Motivo:** las push remotas (Expo Push) requieren credenciales de proyecto EAS aún
  inexistentes. Las locales dan valor real ya y no bloquean la etapa.
- **Reversión:** añadir Expo Push + `push_token` (ya hay columna) en hardening.

## D-015 · Recurrencia y zonas horarias en UTC (2026-07-13)

- **Decisión:** el motor de recurrencia (`src/core/recurrence.ts`) opera sobre instantes
  absolutos (UTC); la hora "de pared" se convierte con el desfase real de la zona (incl.
  horario de verano) vía Intl al crear/mostrar. `due_at` es timestamptz.
- **Motivo:** evita dobles avisos y días perdidos en cambios de DST. Verificado con tests
  del salto CET/CEST de Madrid.

## D-016 · Inmutabilidad del ledger: bloquear solo UPDATE (2026-07-13)

- **Contexto:** el test e2e del hito de racha reveló que el trigger que bloqueaba
  UPDATE **y DELETE** en `paw_ledger` impedía la cascada de borrado de cuenta para
  usuarios con movimientos de Huellas → la eliminación RGPD fallaría.
- **Decisión:** el trigger bloquea solo UPDATE. La garantía append-only para clientes
  la da la RLS (solo SELECT propio; sin políticas de INSERT/UPDATE/DELETE), así que
  ningún cliente puede borrar filas. El DELETE a nivel de motor se permite únicamente
  para la cascada de supresión de cuenta.
- **Verificado:** hito concede 1 Huella + 1 grant + 1 ledger; idempotente; UPDATE sigue
  bloqueado; cascada de borrado con ledger presente funciona. Migración 8.

## D-017 · Actividad diaria determinista + protección de reloj de racha (2026-07-13)

- **Decisión:** la actividad diaria se elige con reglas deterministas en cliente
  (`src/core/recommendation.ts`, testeado) y se persiste en `daily_recommendations`.
  La racha se actualiza **solo** vía `complete_daily_activity()` (definer), que calcula
  "hoy" con la zona horaria del perfil en el **servidor** (no con el reloj del
  dispositivo) y es idempotente por día vía `unique(user_id, local_date)`.
- **Motivo:** adelantar el reloj local no infla la racha; la racha no sube por abrir la
  app ni por insertar filas (no hay política de INSERT en completions). Verificado e2e.
- **Recompensas provisionales** (streak_3/7/14/30 → 1/2/3/5 Huellas) marcadas
  `is_provisional`; cantidades sujetas a análisis de economía.

## D-018 · Recuerdos: soft delete y filtro fuera de la política SELECT (2026-07-13)

- **Contexto:** el e2e de recuerdos reveló que incluir `deleted_at IS NULL` en la
  política SELECT de `memories` impedía el soft delete: PostgreSQL aplica la política
  SELECT sobre la fila resultante de un UPDATE, así que fijar `deleted_at` la volvía
  invisible y el UPDATE se rechazaba ("new row violates RLS").
- **Decisión:** la política SELECT filtra solo por propiedad (igual que `pets`); el
  filtro de borrados lógicos vive en las consultas del cliente (`.is('deleted_at', null)`).
- **Verificado:** crear/versionar conserva el original, versiones inmutables (sin política
  UPDATE), soft delete oculta el recuerdo. Migración 10.

## D-019 · Recuerdos por voz: grabación real, transcripción manual; STT pospuesto (2026-07-13)

- **Decisión:** la voz se graba con expo-audio y el audio se guarda en bucket privado;
  la transcripción es editable por el usuario. La transcripción automática (STT) y la
  "versión organizada por IA" llegarán por la capa de IA (Edge Function), conservando
  siempre `original_text`/`original_transcript` y el historial `memory_versions`.
- **Motivo:** STT necesita proveedor de IA en servidor; no bloquear la etapa ni
  presentar como automático algo que no lo es.

## D-020 · Perfil del perro fuera de la barra de pestañas (2026-07-13)

- **Decisión:** con Recuerdos como pestaña, se movió el perfil del perro a una ruta de
  stack (`/dog`) accesible desde la tarjeta del perro en Inicio. Tabs: Inicio · Agenda ·
  Vínculo · Recuerdos · Ajustes (5, límite premium).

## D-021 · Monetización UI con adapter de compras mock explícito (2026-07-13)

- **Contexto:** las cuentas de desarrollador de tienda (Apple/Google) no existen aún;
  el brief permite implementar la interfaz real + adapter + mock explícito + estado de
  no disponibilidad + documentación de activación.
- **Decisión:** `PurchaseAdapter` (contrato único: comprar suscripción/Huellas,
  restaurar) con `mockPurchaseAdapter` que devuelve `unavailable`. La UI (paywall, packs,
  recarga) es completa y muestra precios definitivos del servidor; al pulsar comprar,
  muestra un estado honesto "compras aún no disponibles". **Ningún derecho se concede
  desde el cliente.** El adapter real (tienda + webhooks + validación en servidor) se
  enchufa sin tocar la UI.
- **Verificado e2e:** precios correctos desde servidor (19,95 / 165,95; packs 30 %); el
  cliente no puede concederse Pro (RLS 42501) ni cambiar precios; `validate_custom_topup`
  es solo-servidor (el cliente recibe permission denied — posición deseada) y la
  prevalidación de recarga en cliente está cubierta por unit tests.

## D-022 · Fijar el stack a Expo SDK 54 (2026-07-13)

- **Contexto:** el scaffold inicial (`create-expo-app@latest`) trajo Expo SDK 57
  (RN 0.86, React 19.2). Requisito del proyecto: usar **SDK 54**.
- **Decisión:** downgrade completo a Expo SDK 54 → React Native 0.81.5, React 19.1.0,
  Reanimated 4.1, react-native-worklets 0.5.1, expo-router 6, TypeScript 5.9. Alineado
  con `npx expo install --fix` (fuente de verdad de versiones compatibles).
- **Limpieza asociada:** se eliminaron paquetes de plantilla no usados
  (`@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `expo-font`,
  `expo-system-ui`, `expo-status-bar`); el único de plantilla que se conserva es
  `expo-device` (usado en notificaciones). `vitest.config.ts` pasó a resolver el alias
  `@` con `path` en lugar de `URL` (choque de tipos DOM/Node en TS 5.9).
- **Verificado:** `tsc` + `expo lint` + 63 tests + export web, todo verde en SDK 54.
- **Reversión:** `npm i expo@~57 && npx expo install --fix`.

## D-023 · Modo prueba con almacén en memoria (2026-07-13)

- **Contexto:** necesidad de recorrer toda la app sin crear cuenta ni guardar datos
  reales (y sin depender de que el proyecto Supabase esté activo).
- **Decisión:** un flag `isDemo` (persistido en AsyncStorage) y un almacén en memoria
  (`src/features/demo/store.ts`) con datos semilla. Cada `api.ts` de feature y
  `lib/remoteConfig.ts` ramifican `if (isDemo())` para operar contra el almacén en vez
  de Supabase. El `AuthProvider` provee una sesión sintética de demo y reacciona a
  activar/salir vía una pequeña suscripción (`subscribeDemo`). Botón "Probar sin cuenta"
  en la bienvenida; salida y aviso en Ajustes; píldora "Modo prueba" en Inicio.
- **Garantías:** en demo no se llama a Supabase para datos de usuario; `track()` no
  escribe (no hay sesión real); las notificaciones/subidas se omiten. El código de
  producción (Supabase, RLS, funciones) queda intacto: es solo una ruta alternativa.
- **Limitación:** los datos de demo se reinician en cada arranque (no persisten entre
  sesiones a propósito). Verificado: tsc + lint + 63 tests + export web en verde.
- **Reversión:** eliminar `src/features/demo`, las ramas `if (isDemo())` y el botón.

## D-024 · Rediseño premium + personaje personalizable (2026-07-13)

- **Contexto:** feedback de usuario: la app se sentía vacía/plana, las secciones
  "divertidas" no lo eran, el onboarding era anodino y faltaba la personalización de la
  mascota prometida.
- **Investigación Mobbin:** Tolan y BitePal (personaje grande y central sobre degradados,
  globos de diálogo, reacciones, celebración), Alan/Notion/Duolingo/Telegram (avatar
  personalizable con preview + color/accesorio + randomize + nombre).
- **Decisión / entrega:**
  - **Mascota "Toba" v2** (`Mascot.tsx`): criatura-huella expresiva (orejas, barriga,
    ojos que parpadean, mejillas, boca por estado), con color y accesorio configurables
    y animaciones (respiración, rebote, wiggle) respetando reduce-motion y la regla
    sanitaria (estados sobrios sin movimiento).
  - **Personalización real** (`mascotConfig.ts` + `/mascot`): nombre, 6 colores, 6
    accesorios (collar/pañuelo/gorra/flor/gafas), "Sorpréndeme"; persistida en el
    dispositivo con pub-sub para actualización en vivo en toda la app. Accesos desde
    Home (toca la mascota) y Ajustes.
  - **Componentes premium:** `Gradient` (expo-linear-gradient), `SpeechBubble`,
    `Confetti`. Héroes con degradado en Home y onboarding.
  - **Onboarding rediseñado:** barra de progreso, mascota que reacciona por paso con
    globos de diálogo, y pantalla final de celebración con confeti.
  - **Home/Vínculo más vivos:** cabecera héroe con mascota + saludo, tarjetas más ricas.
- **Fix de correctness (verificado visualmente):** al entrar/salir del modo prueba se
  limpia la caché de React Query (`queryClient.clear()`), porque las queries cacheadas
  por la ruta Supabase dejaban el gate colgado en el spinner al activar demo.
- **Verificado:** tsc + lint + 63 tests + export web; y **capturas reales** del flujo
  (bienvenida, Home, personalización, Vínculo) confirmando el nuevo aspecto.
- **Nota de honestidad:** la mascota es un personaje programático (formas + Reanimated)
  de alta expresividad, no una ilustración/Lottie final; la API de estados permite
  sustituir el render por arte de alta fidelidad sin tocar los call sites.

## D-012 · Tests de lógica con Vitest; jest-expo pospuesto (2026-07-13)

- **Decisión:** Vitest cubre `src/core` (dinero, fechas, validación). Los tests de
  componentes RN llegarán con jest-expo cuando haya UI compleja que lo justifique.
- **Motivo:** máximo valor de test por complejidad de infraestructura en la Etapa 1;
  la verificación de UI se hizo con export completo del bundle + e2e de backend.

## D-025 · Caminos, racha inmersiva y cabecera con estado (referencias del fundador, lote 1) (2026-07-17)

- **Contexto:** el fundador entregó tres pantallas de Duolingo vía Mobbin (mapa de
  progreso, celebración de racha, camino con cartera en cabecera). Análisis completo
  en `docs/01-founder-references.md`; hipótesis: señalan el lenguaje de progresión,
  no la identidad visual.
- **Decisión / entrega:**
  - **Pestaña Caminos** (antes listado "Vínculo"): mapa serpenteante por mundo con
    nodos-almohadilla por fase, pisadas como conectores, separadores de camino y
    **hueso final con la recompensa visible por adelantado** (`PathMap.tsx`). Toba
    espera junto al siguiente nodo. Selector horizontal de los 6 mundos con identidad
    cromática propia (nuevo tinte ciruela en tokens para Bienestar).
  - **Catálogo local de caminos** (`pathsData.ts`): 6 mundos × 4 caminos × 4 fases
    (Descubrir → Practicar → Jugar → Consolidar) con títulos del prompt maestro;
    recompensas = insignias (sin Huellas hasta que el ledger real las abone en Fase 2;
    nada aleatorio). Progreso local en AsyncStorage (`progress.ts`), común a demo y
    cuenta real durante la Fase 1.
  - **Detalle de camino** (`/path/[id]`): Toba presenta cada fase, plantilla guiada de
    3 pasos por fase, aviso de parada, nota "¿cómo respondió tu perro?" al consolidar
    y celebración con la insignia al completar. Caminos posteriores se abren al
    completar el anterior; el primero de cada mundo está siempre abierto.
  - **Pantalla de racha** (`/streak`): celebración a pantalla completa terracota
    (escena fija en ambos temas) tras la actividad diaria: número grande, semana
    L–D con huellas, mejor racha y **próximo hito con recompensa anunciada**. Sin
    "compartir por recompensa"; con racha 0, «Empezamos cuando estés preparado».
  - **Cabecera de Inicio:** chips discretos de racha y Huellas (máx. dos indicadores;
    Huellas fuera de pestañas, como exige el prompt maestro).
- **No copiado deliberadamente:** botones 3D, estrellas por nodo, cofres/loot,
  saltar contenido, share incentivado, paletas y personajes de Duolingo.
- **Verificado:** tsc + eslint + 63 tests. Fase 1: sin backend nuevo; eventos
  `path_opened / path_phase_completed / path_completed` añadidos a la taxonomía.

## D-026 · Toba interactivo: menú contextual en toda la app (2026-07-17)

- **Contexto:** petición directa del fundador: el personaje no debe ser una
  sección más, sino un compañero que aparece por la app y con el que se
  interactúa. Coincide con el prompt maestro (pantalla del Compañero: al tocar
  el personaje aparecen actividad de hoy, escáner, próximo recordatorio, crear
  recuerdo; contenido según contexto; nunca diez prioridades a la vez).
- **Decisión / entrega:** `CompanionMenu.tsx` con dos piezas:
  - `CompanionOverlay`: hoja contextual con Toba reaccionando, una línea de
    voz según el momento (actividad pendiente / día completado / saludo) y
    UNA acción principal + máx. tres accesos rápidos, todos funcionales
    (actividad de hoy, próximo recordatorio con fecha, guardar recuerdo,
    ver racha, personalizar). Sin acciones muertas: el escáner no aparece
    hasta que su flag lo active.
  - `CompanionFab`: Toba flotante para pantallas sin personaje propio.
  - Integración: héroe de Inicio (antes navegaba a /mascot; personalizar vive
    ahora dentro del menú y en Ajustes), Toba del mapa de Caminos, cabecera de
    Recuerdos y flotante en Agenda.
- **Verificado:** tsc + eslint + 63 tests + capturas reales del menú abierto
  desde Inicio, Agenda y Caminos, y de la navegación real de una acción.
