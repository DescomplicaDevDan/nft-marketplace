import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { NFT } from '@/features/catalog/types'
import { useFavoriteActions } from './favorites'
import { useCartApi, type CartItem } from './cartApi'

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
  orders: Order[]
}

interface CommerceContextValue extends CommerceState {
  favorites: string[]
  cart: string[]
  quantities: Record<string, number>
  cartItems: CartItem[]
  cartLoading: boolean
  cartError: boolean
  cartBusy: boolean
  cartMessage: string
  retryCart: () => void
  setCartQuantity: (id: string, quantity: number) => void
  toggleFavorite: (id: string) => void
  addToCart: (id: string, quantity?: number) => void
  removeFromCart: (id: string) => void
  placeOrder: (order: Order) => void
}

const STORAGE_KEY = 'kurio-commerce'
const emptyState: CommerceState = { orders: [] }
const CommerceContext = createContext<CommerceContextValue | null>(null)

function loadState(): CommerceState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState
    const parsed: unknown = JSON.parse(stored)
    if (typeof parsed !== 'object' || parsed === null) return emptyState
    const value = parsed as Record<string, unknown>
    return {
      orders: Array.isArray(value.orders) ? value.orders as Order[] : [],
    }
  } catch {
    return emptyState
  }
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState)
  const favoriteActions = useFavoriteActions()
  const cartApi = useCartApi()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value: CommerceContextValue = {
    ...state,
    cart: cartApi.items.map((item) => item.id),
    quantities: Object.fromEntries(cartApi.items.map((item) => [item.id, item.quantity])),
    cartItems: cartApi.items,
    cartLoading: cartApi.isPending,
    cartError: cartApi.isError,
    cartBusy: cartApi.busy,
    cartMessage: cartApi.message,
    retryCart: () => { void cartApi.refetch() },
    setCartQuantity: cartApi.setQuantity,
    favorites: favoriteActions.favorites,
    toggleFavorite: favoriteActions.toggleFavorite,
    addToCart: cartApi.add,
    removeFromCart: cartApi.remove,
    placeOrder: (order) => setState((current) => ({
      ...current,
      orders: [order, ...current.orders],
    })),
  }

  return <CommerceContext.Provider value={value}>{children}<p role="status" aria-live="polite" className="sr-only">{favoriteActions.message}</p>{favoriteActions.message.includes('desfeita') && <p role="alert" className="fixed bottom-4 left-4 right-4 z-50 rounded border border-[#d28a4c] bg-[#241612] p-4 text-[#f5f1eb]">{favoriteActions.message}</p>}{cartApi.message && <p role="status" className="fixed bottom-4 left-4 right-4 z-50 rounded border border-[#d28a4c] bg-[#241612] p-4 text-[#f5f1eb]">{cartApi.message}</p>}</CommerceContext.Provider>
}

export function useCommerce() {
  const context = useContext(CommerceContext)
  if (!context) throw new Error('useCommerce precisa estar dentro de CommerceProvider')
  return context
}
