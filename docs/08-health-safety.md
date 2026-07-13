# 08 — Seguridad sanitaria

GUAU **no** es un sustituto del veterinario. Este documento es normativo para todo el
producto (UI, IA, personaje, textos).

## Lenguaje permitido

- "Observación orientativa", "En las imágenes se aprecia…"
- "La calidad de la imagen limita la valoración"
- "No podemos determinarlo con suficiente confianza"
- "Conviene consultar a un veterinario"
- "Este análisis no sustituye una exploración profesional"

## Lenguaje prohibido

- "Tu perro tiene…", "Diagnóstico confirmado", "No necesita veterinario"
- "Tratamiento recomendado", "Está completamente sano"
- Cualquier afirmación de certeza médica o prescripción.

## Señales críticas → escalado inmediato

Dificultad respiratoria, sangrado, pérdida de consciencia, convulsiones, dolor intenso,
posible intoxicación/ingesta de sustancia peligrosa, y cualquier situación que no deba
esperar. Ante ellas GUAU:

- No da falsa tranquilidad ni diagnostica.
- Recomienda **atención veterinaria inmediata o de urgencias** con mensaje claro.
- Ofrece acceso rápido a contactos registrados si existe esa función.
- **No** esconde la advertencia tras animaciones. El personaje entra en estado
  `sober`/`error` (sin bromas ni celebraciones) y **no** es el canal principal del
  mensaje.

## Presentación (modo sanitario)

Todo resultado sanitario muestra: **fuente, fecha, nivel de confianza, limitaciones y
acción recomendada**. Contraste alto, jerarquía estricta, mínimo movimiento
(`Card health`, tokens `health*`, motion `calm`). Nunca depende solo del personaje.

## Confirmación humana

Ningún dato de cartilla se confirma automáticamente. La IA propone; la persona acepta,
corrige o descarta campo a campo. Fechas ambiguas no se interpretan en silencio: se
piden de nuevo o se marcan como pendientes.

## Reglas para escáneres

- **Físico:** resultados orientativos sobre aspectos *observables* (condición corporal,
  postura, simetría, pelaje, zonas a vigilar), con confianza y limitaciones. Sin
  diagnóstico. Recomendación de revisión profesional cuando proceda. No comparar
  imágenes que no sean comparables.
- **Comida:** qué se detecta, ingredientes relevantes/de atención, datos que faltan,
  adecuación **orientativa** al perfil. No prescribe dietas ni declara un alimento
  seguro para todos los perros. Si faltan datos, se dice claramente.

## Verificación y pruebas

- Contract tests de IA (Zod) garantizan que ninguna salida no conforme se persista.
- Set de pruebas de lenguaje: casos que deben disparar escalado y frases prohibidas que
  no deben aparecer (Etapa 7–9, `13-testing-and-qa.md`).
- Disclaimer visible en cada superficie sanitaria y en el consentimiento
  (`consents kind='camera_analysis'`).

## Estado actual

La política y los tokens/estados sanitarios (Card `health`, Mascot `sober`/`error`,
tarjeta de privacidad sobria en Ajustes) están implementados. Los escáneres que aplican
estas reglas end-to-end llegan en las Etapas 7–9 detrás de sus feature flags.
