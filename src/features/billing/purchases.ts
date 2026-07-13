/**
 * Abstracción de compras y suscripciones.
 *
 * Contrato único que la UI usa para comprar planes y packs de Huellas. Detrás
 * hay adapters intercambiables. Hoy solo existe un adapter MOCK explícito para
 * desarrollo, que NO concede nada: deja constancia de que la compra real no está
 * disponible todavía. En producción se enchufará el adapter de la tienda
 * (App Store / Play) con validación en servidor y webhooks; NUNCA se conceden
 * Pro, Huellas ni recompensas por una respuesta local del dispositivo
 * (docs/09-monetization.md, docs/23 del brief).
 */

export type PurchaseResult =
  | { status: 'unavailable'; reason: string }
  | { status: 'success'; productId: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export interface PurchaseAdapter {
  readonly id: string;
  readonly available: boolean;
  /** Compra una suscripción (pro_monthly | pro_annual). */
  purchaseSubscription(productId: string): Promise<PurchaseResult>;
  /** Compra un pack o una recarga de Huellas (paws). */
  purchasePaws(productId: string, paws: number): Promise<PurchaseResult>;
  /** Restaura compras previas (suscripciones no consumibles). */
  restore(): Promise<PurchaseResult>;
}

/**
 * Adapter mock para desarrollo. No otorga derechos. Devuelve 'unavailable' para
 * que la UI muestre un estado honesto de "compras no disponibles todavía".
 */
export const mockPurchaseAdapter: PurchaseAdapter = {
  id: 'mock',
  available: false,
  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    return { status: 'unavailable', reason: `store_not_configured:${productId}` };
  },
  async purchasePaws(productId: string): Promise<PurchaseResult> {
    return { status: 'unavailable', reason: `store_not_configured:${productId}` };
  },
  async restore(): Promise<PurchaseResult> {
    return { status: 'unavailable', reason: 'store_not_configured' };
  },
};

/**
 * Adapter activo. Cuando exista la integración real (RevenueCat / StoreKit /
 * Play Billing) se seleccionará por plataforma; la UI no cambia.
 */
export const purchases: PurchaseAdapter = mockPurchaseAdapter;
