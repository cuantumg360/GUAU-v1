# 09 — Monetización

Precios y catálogo viven en la tabla `products` (servidor). Cálculos de presentación en
`src/core/pricing.ts`, **testeados** en `pricing.test.ts`. Nada hardcodeado en la UI.

## Planes

| Plan | Precio | Notas |
| --- | --- | --- |
| Gratuito | 0 € | Valor real con límites configurables (`app_config`), sin regalar lo caro |
| Pro mensual | **19,95 €/mes** | `pro_monthly`, `final_price_cents=1995` |
| Pro anual | **165,95 €/año** | `pro_annual`, `final_price_cents=16595` |

**Ahorro del anual (comunicado con transparencia):** 12 mensualidades = 239,40 €;
ahorro = **73,45 €**; equivalente ≈ **13,83 €/mes**; **30,7 %**. Verificado por tests.

## Huellas (moneda interna)

Referencia comercial: **1 Huella = 1 €** antes de descuentos. En la experiencia diaria se
muestra el coste en Huellas, saldo, packs, ahorro e historial, sin recordar el euro
constantemente.

### Packs (30 % de descuento fijo)

| Pack | Base | Final |
| --- | --- | --- |
| 25 Huellas | 25,00 € | 17,50 € |
| 50 Huellas | 50,00 € | 35,00 € |
| 100 Huellas | 100,00 € | 70,00 € |

### Recarga personalizada

Mínimo **5**, solo enteros, **sin descuento**, 1 €/Huella. Validada en cliente
(`validateCustomTopup`) y en **servidor** (`validate_custom_topup`, mín/máx de
`app_config`). Máximo configurable (protección contra manipulación).

### Uso de Huellas

Solo operaciones de coste real: escáner físico, escáner de comida, cartilla,
procesamientos avanzados, IA de coste variable. Coste por operación en `operation_costs`
(provisional, marcado). **Nunca** se cobran: abrir la app, calendario, crear/editar
recordatorios, consultar resultados ya pagados, completar actividades, mantener rachas,
escribir un recuerdo, editar perfil, navegar.

### Ledger (implementado y verificado)

Libro mayor inmutable con ID, usuario, tipo, cantidad, saldo antes/después, motivo,
operación, referencia, fecha, estado, **idempotency key**. El cliente no modifica el
saldo. `spend_paws` es atómica (bloqueo de fila) e idempotente. Verificado e2e: saldo
insuficiente → `INSUFFICIENT_PAWS`; reintento con misma key no recobra; update directo de
saldo bloqueado; `credit_paws` no invocable por clientes.

## Compras y suscripciones (abstracción, Etapa 10)

Interfaz compatible con tiendas: compra, renovación, restauración, cancelación,
reembolso, grace period, billing retry, expiración, upgrade/downgrade, cambio
mensual/anual, validación en servidor, webhooks, idempotencia. **Nunca** se concede Pro,
Huellas o recompensas de pago solo por una respuesta local del dispositivo:
`entitlements` y `credit_paws` se escriben desde webhooks verificados (service_role).

**Implementado (Etapa 10, UI):** contrato `PurchaseAdapter`
(`src/features/billing/purchases.ts`) con `mockPurchaseAdapter` que devuelve
`unavailable`. Pantallas completas: paywall (mensual/anual con ahorro real calculado
desde el servidor), packs de Huellas, recarga personalizada (prevalidación en cliente
con `validateCustomTopup`, validación vinculante en servidor con la función
`validate_custom_topup` que es **solo service_role**), e historial de movimientos del
ledger. Al pulsar comprar, el mock muestra "compras aún no disponibles". Activación del
adapter real (RevenueCat/StoreKit/Play Billing + webhooks): sustituir `purchases` sin
tocar la UI. Verificado e2e: precios correctos, el cliente no puede concederse Pro ni
alterar precios (RLS).

## Entitlements

Derechos (funciones, límites, nº de perros, historial, prueba, ofertas) configurables y
validados en servidor (`entitlements` + `app_config`), no hardcodeados en la interfaz.
