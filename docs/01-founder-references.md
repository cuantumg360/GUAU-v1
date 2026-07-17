# 01 — Referencias del fundador

Registro obligatorio de las referencias de diseño entregadas por el fundador
(Prioridad 1 de la jerarquía de referencias). Cada referencia se analiza
individualmente: qué señala, qué se adapta, qué NO se copia y qué pantalla de
GUAU afecta. Las referencias originales nunca se pierden: quedan enlazadas aquí.

> Regla de producto aplicable a todo el documento: **no se copia ninguna app
> encontrada en Mobbin**. Las referencias indican patrones e intención, no
> composición, iconografía ni identidad.

## Lote 1 · 2026-07-17 · Tres pantallas de Duolingo (iOS)

Las tres referencias pertenecen a la misma app (Duolingo, iOS). **Hipótesis
registrada:** el fundador no señala la identidad visual de Duolingo (colores
saturados, botones 3D, mascota búho), sino su **lenguaje de progresión**: un
mapa que hace visible el avance, una celebración de racha inmersiva y el estado
(racha/moneda) siempre a la vista en cabecera. El prompt maestro ya anticipa
esta lectura: «la inspiración puede recordar a sistemas de caminos como
Duolingo, pero no debe copiarlo».

### R-001 · Pantalla de progreso con camino de nodos

- **Identificador:** <https://mobbin.com/screens/a7e8c760-e436-4ac3-a933-ff20b392e038>
- **Tipo:** captura de pantalla (Progress screen; Progress Indicator, Top
  Navigation Bar, FAB, Illustration, Tab Bar).
- **Elemento relevante:** camino serpenteante de nodos con estados claros
  (hecho / activo con anillo / futuro apagado), cabecera de sección con el
  color de la unidad y acceso a la guía, personaje ilustrado junto al camino,
  cofre de recompensa dentro del sendero, contadores en cabecera.
- **Qué problema resuelve:** convierte un plan de aprendizaje abstracto en un
  lugar recorrible; el usuario siempre sabe dónde está, qué toca ahora y qué
  viene después, sin leer nada.
- **Por qué encaja con GUAU:** el sistema de Caminos (6 mundos × 4 caminos ×
  4 fases) necesita exactamente esa legibilidad espacial; Toba puede ocupar el
  papel de acompañante del sendero sin robar protagonismo al perro.
- **Qué no debe copiarse:** botones-moneda 3D con brillo, estrellas de
  puntuación por nodo, cofres aleatorios (prohibido loot box), verde/azul
  Duolingo, el búho, el FAB de «saltar adelante» (en GUAU las fases se hacen
  con el perro real: no se salta).
- **Cómo se reinterpreta:** el camino es **el sendero de un paseo**: nodos
  planos tipo almohadilla con el icono de la fase, unidos por pisadas pequeñas;
  cada camino termina en un **hueso** con la recompensa **visible por
  adelantado** (regla: recompensas conocidas antes de completar); cabecera del
  mundo con la identidad cromática del mundo (crema/terracota/ámbar/verde/
  teal/pizarra/ciruela de nuestros tokens); Toba espera junto al siguiente
  nodo (no estático en cada nivel). Sin puntuaciones: una fase está hecha o no.
- **Pantallas afectadas:** pestaña **Caminos** (`src/app/(tabs)/vinculo.tsx`,
  `src/features/paths/PathMap.tsx`), detalle de camino (`src/app/path/[id].tsx`).

### R-002 · Celebración de racha a pantalla completa

- **Identificador:** <https://mobbin.com/screens/84ec5a7b-37ce-4c38-808d-7c3c91c3c0aa>
- **Tipo:** captura de pantalla (Progress Indicator, Illustration).
- **Elemento relevante:** pantalla inmersiva monocolor con ilustración del
  personaje-llama, número enorme, «day streak», fila semanal Lu–Do con días
  marcados y día actual resaltado, botón principal blanco y «Continue».
- **Qué problema resuelve:** hace que el hábito diario tenga un momento de
  recompensa emocional claro y memorable; la semana visualiza el esfuerzo
  acumulado de un vistazo.
- **Por qué encaja con GUAU:** la racha de GUAU premia **acciones reales con el
  perro** (actividad diaria, ejercicio de camino); merece una celebración
  cálida que refuerce el vínculo, no una tarjeta más en un listado.
- **Qué no debe copiarse:** el personaje-llama con gafas, el naranja Duolingo,
  y sobre todo **«SHARE +20 GEMS»**: pagar por compartir contradice nuestras
  reglas (el usuario nunca debe sentir que cada interacción esconde un
  incentivo económico). Tampoco ningún tono de presión o culpa.
- **Cómo se reinterpreta:** pantalla completa terracota cálido (escena fija,
  igual en tema claro y oscuro), Toba celebrando, número grande + «días de
  racha», semana L-M-X-J-V-S-D con **huellas** como marca de día completado,
  mejor racha y **próximo hito con su recompensa anunciada por adelantado**.
  Sin botón de compartir. Con racha a cero el mensaje es «Empezamos cuando
  estés preparado» (la racha motiva, jamás culpabiliza; Toba nunca castiga).
- **Pantallas afectadas:** `src/app/streak.tsx` (celebración tras completar la
  actividad diaria y consulta de estado desde Home/Caminos).

### R-003 · Camino al inicio de unidad + cartera en cabecera

- **Identificador:** <https://mobbin.com/screens/c8b59f19-238b-4a16-aa26-50ef2e19c87b>
- **Tipo:** captura de pantalla (Wallet & Balance; Progress Indicator, Tab Bar,
  Top Navigation Bar, FAB, Icon).
- **Elemento relevante:** el mismo mapa en el arranque de una unidad (nodo
  inicial dorado, trofeo de fin de unidad) y la **fila de cabecera** con
  bandera/racha/gemas siempre visible.
- **Qué problema resuelve:** el estado importante (progreso, racha, moneda)
  acompaña al usuario sin ocupar navegación principal; el inicio y el fin de
  cada unidad se sienten como umbrales.
- **Por qué encaja con GUAU:** el prompt maestro exige «perfil y Huellas en
  cabecera» y que Huellas y suscripción **no** ocupen pestaña; la racha debe
  representarse «de manera discreta».
- **Qué no debe copiarse:** cuatro contadores compitiendo a la vez, iconos
  gamificados brillantes, trofeos por liga/competición (GUAU no compite contra
  nadie: no es una red social).
- **Cómo se reinterpreta:** dos chips discretos en la cabecera de Inicio
  (llama+racha → pantalla de racha; huella+saldo → Huellas), con borde suave
  del sistema de diseño; el umbral de cada camino es su separador con título y
  el hueso final ya anuncia la recompensa. Conflicto entre referencias
  (cabecera cargada de R-001/R-003 vs. sobriedad GUAU) resuelto a favor de la
  discreción: máximo dos indicadores.
- **Pantallas afectadas:** `src/app/(tabs)/index.tsx` (cabecera), pestaña
  Caminos (chip de racha).

## Síntesis del lote 1 (sistema coherente)

| Patrón señalado | Traducción GUAU | Dónde |
| --- | --- | --- |
| Mapa serpenteante de progreso | Sendero de paseo con almohadillas y pisadas | `PathMap.tsx` |
| Cabecera de sección/unidad | Cabecera de mundo con identidad cromática propia | `vinculo.tsx` |
| Cofre/trofeo de recompensa | Hueso con recompensa visible por adelantado | `PathMap.tsx` |
| Personaje junto al camino | Toba espera en el siguiente nodo | `PathMap.tsx` |
| Celebración de racha inmersiva | Pantalla terracota con huellas semanales, sin culpa | `streak.tsx` |
| Wallet bar en cabecera | Dos chips discretos (racha, Huellas) | `index.tsx` |

Lo que el conjunto **no** arrastra a GUAU: economía visible en cada gesto,
recompensas aleatorias, presión social/competitiva, saltos de contenido, y
cualquier estética que convierta el cuidado del perro en un videojuego. La
experiencia principal sigue ocurriendo fuera de la pantalla, con el perro real.
