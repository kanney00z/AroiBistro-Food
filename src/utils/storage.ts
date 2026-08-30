/**
 * Safe localStorage utilities to prevent QuotaExceededError crashes
 */

import { Order } from '../types';

/**
 * Safely saves a key-value pair to localStorage with try-catch
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[Storage] Failed to save key "${key}" to localStorage:`, error);
    return false;
  }
}

/**
 * Safely saves orders array to localStorage with progressive fallback/pruning
 * if quota is exceeded (e.g. from uploaded slip images).
 */
export function safeSaveOrdersToStorage(storageKey: string, orders: Order[]): void {
  try {
    // Attempt 1: Direct save
    localStorage.setItem(storageKey, JSON.stringify(orders));
  } catch (err) {
    console.warn('[Storage] Quota exceeded on full orders save. Attempting fallback pruning...', err);

    try {
      // Attempt 2: Keep slipImage only on the 5 most recent orders, strip from older completed/cancelled orders
      const prunedSlipOrders = orders.map((ord, idx) => {
        if (idx < 5) return ord;
        if (ord.slipImage) {
          return { ...ord, slipImage: undefined };
        }
        return ord;
      });

      localStorage.setItem(storageKey, JSON.stringify(prunedSlipOrders));
      return;
    } catch (err2) {
      console.warn('[Storage] Quota still exceeded after pruning old slips. Attempting all slips strip...', err2);
    }

    try {
      // Attempt 3: Strip all slip images from localStorage (they remain in memory for current session)
      const noSlipOrders = orders.map((ord) => ({
        ...ord,
        slipImage: undefined,
      }));

      localStorage.setItem(storageKey, JSON.stringify(noSlipOrders));
      return;
    } catch (err3) {
      console.warn('[Storage] Quota still exceeded after stripping slips. Saving only recent 20 orders...', err3);
    }

    try {
      // Attempt 4: Keep only recent 20 orders with no slips
      const trimmedOrders = orders.slice(0, 20).map((ord) => ({
        ...ord,
        slipImage: undefined,
      }));

      localStorage.setItem(storageKey, JSON.stringify(trimmedOrders));
    } catch (err4) {
      console.error('[Storage] Unable to persist orders to localStorage due to severe quota limits:', err4);
    }
  }
}
