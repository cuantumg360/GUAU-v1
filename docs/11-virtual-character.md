# 11 — Personaje virtual

## Concepto

Personaje **original** que acompaña y guía; **no** es otra mascota que cuidar. El perro
real sigue siendo el protagonista. Inspiración conceptual: la huella, el vínculo, la
protección, la curiosidad, el acompañamiento. **No** es copia de un perro concreto.

**Nombre provisional:** "Toba" (configurable vía i18n `character.default_name` y, en
producción, `app_config['character.name']`). Alternativas propuestas: Uma, Kiro, Palo.
Decisión reversible (D-009).

## Implementación v0 (`src/features/character/Mascot.tsx`)

Criatura-huella programática con Reanimated: cuerpo-almohadilla redondeado con cuatro
"dedos" que orbitan, ojos que cambian con el estado. Prioriza estados y contención; el
diseño ilustrado de alta fidelidad la sustituirá **manteniendo la API** (`MascotState`,
`size`). Arquitectura preparada para accesorios, nuevos estados/animaciones, entornos,
personalización y conversación futura.

## Estados

`neutral, attentive, happy, celebrating, waiting, sober, error`. (El brief menciona
además curioso/concentrado/aviso/serio: se mapearán a variantes de estos al ampliar el
set de animaciones.)

## Interacción (implementado)

Toba es interactivo, no una sección: tocar al personaje (héroe de Inicio, Toba
del mapa de Caminos, cabecera de Recuerdos o el flotante de Agenda) abre su
**menú contextual** (`CompanionMenu.tsx`): Toba reacciona, saluda con una línea
según el momento y ofrece UNA prioridad principal + máximo tres accesos rápidos,
todos reales: actividad de hoy pendiente, próximo recordatorio, guardar un
recuerdo, ver la racha o personalizarlo. Nunca muestra diez prioridades a la
vez, no bloquea la navegación y se cierra tocando fuera. Eventos:
`companion_opened` (con origen) y `companion_action`.

## Funciones iniciales (según se activen las etapas)

Aparecer en onboarding (implementado), guiar escáneres, indicar encuadre/luz, acompañar
cargas, presentar la actividad diaria, guiar pasos, comunicar recordatorios importantes,
celebrar rachas, entregar recompensas, ayudar a iniciar un recuerdo, acceso contextual,
responder a interacciones simples (tocar, pulsación larga, arrastre limitado, menús). **No**
es un minijuego independiente.

## Regla sanitaria (crítica)

Ante señal física preocupante, alimento problemático, fecha sanitaria importante,
advertencia o error que afecte a información sanitaria, el personaje: reduce movimiento,
evita bromas y celebraciones, adopta tono sobrio y dirige la atención a la información
**sin sustituir el mensaje principal**. Implementado: estados `sober`/`error` desactivan
la animación (también con reduced motion) y usan color `health`. **La información
sanitaria nunca depende solo del personaje.**

## Rendimiento

El personaje no degrada escáneres ni cámara: animación ligera, respeta
`useReducedMotion`, se detiene en estados calmados. Fallback estático implícito (sin
animación) cuando corresponde.
