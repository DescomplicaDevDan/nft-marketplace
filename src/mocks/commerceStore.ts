import type { CartQuote } from '@/features/commerce/quoteTypes'
import type { Order } from '@/features/commerce/orderTypes'

export type StoredCart = { lines: Array<{ id: string; quantity: number }>; version: number; coupon?: string; quote?: CartQuote }
export type StoredOrder = { userId: string; payload: string; order: Order; readyAt: number; outcome: 'confirmed' | 'rejected' }
export type CommerceDatabase = {
  carts: Record<string, StoredCart>
  orders: Record<string, StoredOrder>
  keys: Record<string, string>
}
const KEY = 'kurio-mock-commerce-v1'

export function readCommerce(): CommerceDatabase {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (value?.carts && value?.orders && value?.keys) return value
    const old = JSON.parse(localStorage.getItem('kurio-mock-carts') ?? '{}')
    return { carts: old && typeof old === 'object' && !Array.isArray(old) ? old : {}, orders: {}, keys: {} }
  } catch { return { carts: {}, orders: {}, keys: {} } }
}

export function writeCommerce(value: CommerceDatabase) {
  localStorage.setItem(KEY, JSON.stringify(value))
}
