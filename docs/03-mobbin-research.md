# 03 — Investigación Mobbin

Investigación realizada con el MCP de Mobbin (plataforma iOS). Se analizaron flujos y
pantallas reales; a continuación, patrones observados y su traducción a GUAU. **No se
copia** composición, ilustración, iconografía ni identidad de ninguna app: Mobbin se usa
como fuente de patrones y estándares.

> Las referencias entregadas directamente por el fundador (Prioridad 1) se registran y
> analizan en `docs/01-founder-references.md`; este documento recoge la investigación
> propia (Prioridad 3). El lote 1 del fundador (Duolingo: mapa de caminos, celebración
> de racha, cartera en cabecera) dio origen a la pestaña Caminos, la pantalla de racha
> y los chips de cabecera de Inicio.

## Flujos y pantallas analizados

| App | Flujo/pantalla | Enlace |
| --- | --- | --- |
| Fi | Setting up a pet profile (19 pantallas) | https://mobbin.com/flows/3a203fb4-5eef-407c-b16d-6e428223c95e |
| Amazon Shopping | Creating a pet profile (22) | https://mobbin.com/flows/ed9af71d-ccad-492e-89c3-a7c7e9059080 |
| Walmart | Adding a pet info (10) | https://mobbin.com/flows/b4ef0f7a-f960-43a9-9357-a9bcd5330b3b |
| Taobao | Entering pet detail (12) | https://mobbin.com/flows/87242e2b-a596-41e3-94a3-ed85584f7722 |
| MacroFactor | Scanning a food label (6) | https://mobbin.com/flows/e5277407-c11b-4676-8012-cdce55e0897d |
| LINE | Scanning text / OCR (8) | https://mobbin.com/flows/575c875e-96ed-4b25-8927-c92bb2d22d64 |
| Craft | Scanning a document (live text) | https://mobbin.com/flows/bf11aae4-0cc7-41af-ada7-250144711e68 |
| stoic. | Recording a voice note + transcribe | https://mobbin.com/flows/42c5dd12-ff9d-4679-b61f-b037476ea54c |
| Journal (Apple) | Recording an audio | https://mobbin.com/flows/8d896cd3-c8c4-4b58-b852-317e91eece4b |
| ABY Journal | Recording audio / streaks & stats | https://mobbin.com/flows/d09a5ee8-2413-4eb3-bd3c-1a6f2798f585 |
| Mindvalley / NordVPN / Deepstash / Fixtured / Linktree / Hypelist | Paywalls mensual/anual | ver sección paywall |
| Life Reset / Deepstash / Vocabulary | Rachas y celebración | ver sección rachas |

## Onboarding de perfil de mascota

- **Patrón (Fi):** una pregunta por pantalla, barra de progreso, tipografía grande,
  toggle Pure/Mixed para raza, teclado numérico dedicado para el peso. **Ventaja:**
  fricción mínima, sensación premium. **Riesgo:** muchos pasos si se abusa.
- **Patrón (Amazon):** "Enter birth date instead" y edad en años/meses. **Ventaja:**
  no bloquea a quien no sabe la fecha exacta.
- **Patrón (Walmart):** preguntas de salud (medicación, alergias, condiciones) con
  selector grande. **Riesgo para GUAU:** meter salud en el alta es prematuro y choca
  con nuestro modelo de procedencia/confirmación.
- **Decisión GUAU (implementada):** onboarding conversacional de 6 pasos + resumen
  (nombre → sexo/esterilización → nacimiento exacto **o** aproximado → raza/cruce →
  peso/actividad → foto). **Sin** preguntas médicas en el alta: alergias, medicación y
  condiciones se añaden después como `pet_profile_fields` con fuente y confirmación.
  **Diferencia:** el personaje acompaña; la edad aproximada usa chips de años.

## Cámara / escáner / OCR / confirmación

- **Patrón (MacroFactor):** conmutador Barcode/Label, recuadro guía, hoja inferior con
  el resultado estructurado tras "Done". **Patrón (LINE/Craft):** seleccionar el texto
  reconocido y revisarlo antes de insertar.
- **Decisión GUAU (preparada, Etapas 7–9):** captura guiada con control de calidad
  (luz/encuadre/distancia) → OCR → **revisión campo a campo con confianza y zona de
  origen** → confirmación humana obligatoria antes de guardar. La hoja de resultados usa
  el **modo sanitario** (sobrio, con fuente/fecha/confianza/limitaciones), no la estética
  celebratoria de una app de fitness. **Diferencia clave:** ningún dato sanitario se
  autoconfirma.

## Diario por voz y recuerdos

- **Patrón (stoic./Journal/ABY):** grabar → transcribir con toggle → texto editable →
  guardar audio + transcripción. **Ventaja:** el usuario mantiene el control del texto.
- **Decisión GUAU (preparada, Etapa 6):** grabar/escribir → transcripción editable →
  versión "organizada" por IA **conservando siempre original + transcripción + versión
  procesada + historial**. La IA no inventa hechos, sentimientos, diálogos ni personas.

## Rachas y recompensas

- **Patrón (Life Reset/Deepstash/Vocabulary):** contador con llama, hitos, "streak
  started", freezes Pro. **Riesgo:** tono culpabilizador o mascota que "sufre".
- **Decisión GUAU (preparada, Etapa 5):** la racha sube **solo** al completar una
  actividad diaria válida (no por abrir la app). Tono motivador, nunca manipulador; el
  personaje **no** enferma ni castiga. Protección de reloj local en servidor.

## Paywalls mensual/anual y créditos

- **Patrón:** conmutador Monthly/Yearly con "Save X%", plan recomendado, "restore
  purchases", prueba gratuita, precio/mes derivado del anual (Mindvalley 62%, NordVPN
  40%, Fixtured 38%).
- **Decisión GUAU (backend listo, Etapa 10):** dos planes con precios fijos del brief
  (19,95 €/mes; 165,95 €/año) y ahorro comunicado con transparencia (**30,7 %**, 73,45 €,
  ≈13,83 €/mes) calculado en `src/core/pricing.ts` y **testeado**. Packs de Huellas con
  30 % fijo y recarga personalizada (mín. 5, entera, sin descuento) validada en cliente
  y **servidor** (`validate_custom_topup`). **Diferencia:** las Huellas monetizan
  operaciones de coste real, no funciones básicas.
