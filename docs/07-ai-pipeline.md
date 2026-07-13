# 07 — Pipeline de IA

Estado: **contrato y arquitectura definidos**; la ejecución de escáneres llega en las
Etapas 7–9 tras Edge Functions con las claves de proveedor. Este documento fija cómo se
integrará para que nada quede acoplado a un modelo ni se guarde salida sin validar.

## Principio: capa de proveedores desacoplada

Interfaces separadas (una responsabilidad cada una), todas server-side:

| Interfaz | Uso |
| --- | --- |
| `Vision` | escáner físico (condición corporal, postura, pelaje observables) |
| `OCR` | comida y cartilla (texto de etiquetas/documentos) |
| `StructuredExtraction` | texto OCR → campos tipados (vacunas, fechas, ingredientes) |
| `Classification` | ingredientes que requieren atención, calidad de imagen |
| `TextGeneration` | organizar recuerdos (sin inventar), explicaciones |
| `SpeechToText` | recuerdos por voz |
| `Comparison` | comparar escaneos cuando son comparables |
| `Moderation` | seguridad de entradas/salidas |

Cada proveedor se implementa como *adapter*; el resto del sistema depende de la interfaz,
no del modelo. Cambiar de proveedor = cambiar el adapter.

## Validación estricta (obligatoria)

Toda respuesta de modelo se valida contra un **esquema Zod** antes de persistir. **No se
guarda texto libre de un modelo como dato sanitario estructurado.** Un dato extraído de
cartilla entra como `pet_profile_fields(source='document'|'ai', status='pending',
confidence, source_ref)` y **requiere confirmación humana** para pasar a `confirmed`.

## Trazabilidad y registro

Cada job registrará: modelo, versión, `prompt_version`, fecha, referencia de input,
output, resultado de validación, errores y confianza (entidades `AIProcessingJob` /
`AIResult`, Etapa 7). Reintentos controlados, timeouts, fallbacks. **No se exponen
razonamientos internos del modelo al usuario.**

## Coste y economía

Las operaciones de IA con coste real consumen Huellas vía `spend_paws` **antes** de
lanzarse, con `idempotency_key` para no recobrar en reintentos (ya implementado y
verificado). Coste por operación desde `operation_costs` (servidor).

## Privacidad

Imágenes y documentos van a Storage privado con URLs firmadas de corta duración; nunca a
logs. Sin uso de datos para entrenar modelos sin consentimiento explícito (`consents`
`kind='ai_training'`). Las Edge Functions reciben referencias, no vuelcan contenido
sensible en telemetría.
