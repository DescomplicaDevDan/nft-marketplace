import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { NFT } from '@/features/catalog/types'
import { useFavoriteActions } from './favorites'

export interface Order {
  id: string
  items: Array<Pick<NFT, 'id' | 'name' | 'collection' | 'priceEth' | 'imageUrl'> & { quantity?: number }>
  wallet?: string
  networkFeeEth?: string
  transactionHash?: string
  totalEth: string
  createdAt: string
}

interface CommerceState {
  quantities: Record<string, number>
  cart: string[]
  orders: Order[]
}

interface CommerceContextValue extends CommerceState {
  favorites: string[]
  setCartQuantity: (id: string, quantity: number) => void
  toggleFavorite: (id: string) => void
  addToCart: (id: string) => void
  removeFromCart: (id: string) => void
  placeOrder: (order: Order) => void
}

const STORAGE_KEY = 'kurio-commerce'
const emptyState: CommerceState = { cart: [], orders: [], quantities: {} }
const CommerceContext = createContext<CommerceContextValue | null>(null)

function loadState(): CommerceState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState
    const parsed: unknown = JSON.parse(stored)
    if (typeof parsed !== 'object' || parsed === null) return emptyState
    const value = parsed as Record<string, unknown>
    return {
      quantities: typeof value.quantities === 'object' && value.quantities !== null ? Object.fromEntries(Object.entries(value.quantities).filter(([, quantity]) => typeof quantity === 'number' && Number.isSafeInteger(quantity) && quantity > 0)) : {},
      cart: Array.isArray(value.cart) ? value.cart.filter((id): id is string => typeof id === 'string') : [],
      orders: Array.isArray(value.orders) ? value.orders as Order[] : [],
    }
  } catch {
    return emptyState
  }
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState)
  const favoriteActions = useFavoriteActions()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value: CommerceContextValue = {
    ...state,
    setCartQuantity: (id, quantity) => setState((current) => ({ ...current, quantities: { ...current.quantities, [id]: Math.max(1, Math.floor(quantity)) } })),
    favorites: favoriteActions.favorites,
    toggleFavorite: favoriteActions.toggleFavorite,
    addToCart: (id) => setState((current) => current.cart.includes(id)
      ? current
      : { ...current, cart: [...current.cart, id] }),
    removeFromCart: (id) => setState((current) => ({
      ...current,
      cart: current.cart.filter((item) => item !== id),
    })),
    placeOrder: (order) => setState((current) => ({
      ...current,
      cart: [],
      orders: [order, ...current.orders],
    })),
  }

  return <CommerceContext.Provider value={value}>{children}<p role="status" aria-live="polite" className="sr-only">{favoriteActions.message}</p>{favoriteActions.message.includes('desfeita') && <p role="alert" className="fixed bottom-4 left-4 right-4 z-50 rounded border border-[#d28a4c] bg-[#241612] p-4 text-[#f5f1eb]">{favoriteActions.message}</p>}</CommerceContext.Provider>
}

export function useCommerce() {
  const context = useContext(CommerceContext)
  if (!context) throw new Error('useCommerce precisa estar dentro de CommerceProvider')
  return context
}
