# 04 — Sistema de diseño

Fuente de verdad: `src/design/tokens.ts`. Componentes en `src/design/components/`.

## Principio rector: dos registros

- **Cotidiano/emocional:** calidez, movimiento con propósito, personaje, haptics.
  Onboarding, perfil, actividades, recuerdos, rachas, recompensas, navegación.
- **Sanitario:** menos movimiento, mayor contraste, jerarquía estricta, lenguaje
  preciso con fuente/fecha/confianza/limitaciones. Resultados físicos, alertas,
  cartilla, alimentos con atención, errores relevantes.

> La app puede ser divertida durante el cuidado, pero nunca trivializa la salud.
> Implementado como prop `health` en `Card` y estados `sober`/`error` en el personaje.

## Color

Dirección: **crema cálido + tinta carbón + terracota** (vínculo, calidez) con acento
**verde azulado** (calma). El modo sanitario usa **azul pizarra** sobrio. No es "solo
una paleta": la diferenciación nace también de navegación, motion, jerarquía y personaje.

Tokens semánticos (claro/oscuro) en `ColorScheme`: `background, surface, surfaceAlt,
text, textSecondary, primary/onPrimary/primarySoft, accent/accentSoft,
success/warning/danger (+ soft), health/healthSoft, border`. El oscuro usa un carbón
cálido (no negro puro). Contrastes de texto sobre fondo verificados AA.

## Tipografía

Escala en `typography`: `display 30/36·700, title 22/28·700, heading 17/24·600,
body 16/23·400, caption 13/18·400, label 13/18·600`. Titulares con la variante
redondeada del sistema (cálida sin ser infantil). Todo texto pasa por `AppText` con
`variant` + `tone`; nada de estilos sueltos ni textos incrustados.

## Espaciado, radios, superficie

`spacing` 4→48 (xxs…xxl). `radius` sm10/md16/lg24/pill999. Tarjetas con borde de 1px y
esquinas generosas; el modo sanitario cambia fondo y borde a tonos `health`.

## Motion

`motion` = quick150 / standard250 / gentle400 / calm200. El personaje usa `gentle`
para respirar/rebotar en estados alegres y `calm` (o quieto) en estados sobrios. **Se
respeta `useReducedMotion`**: con reduced motion el personaje no anima. Regla: ninguna
animación decorativa continua que gaste batería o compita con información sanitaria.

## Haptics

`Button` y `OptionChip` disparan `Haptics.selectionAsync()` en cada pulsación. Reservado
a confirmaciones e interacciones intencionales.

## Accesibilidad

Área táctil mínima `minTouchTarget = 44`. `Button`/`OptionChip`/`TextField` exponen
`accessibilityRole`, `accessibilityLabel` y `accessibilityState`. El personaje se marca
`importantForAccessibility="no-hide-descendants"` y no transporta información esencial.
Dark mode automático (`useColorScheme`). Reduced motion respetado.

## Componentes base (implementados)

`Screen` (safe-area + scroll + KeyboardAvoiding), `AppText`, `Button`
(primary/secondary/ghost/danger, loading, disabled), `TextField` (label + error),
`Card` (+ variante `health`), `OptionChip` (selección con estado). Todos consumen tokens
y `useTheme()`; ninguno hardcodea color o texto.
