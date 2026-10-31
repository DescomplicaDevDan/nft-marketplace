import { createContext, useContext, type ReactNode } from 'react'
import { useFavoriteActions } from './favorites'
import { useCartApi, type CartItem } from './cartApi'
import type { CartQuote } from './quoteTypes'

interface CommerceContextValue {
  favorites: string[]
  cart: string[]
  quantities: Record<string, number>
  cartItems: CartItem[]
  cartLoading: boolean
  cartError: boolean
  cartBusy: boolean
  cartMessage: string
  quote: CartQuote | undefined
  quoteLoading: boolean
  quoteError: string
  quoteBusy: boolean
  couponMessage: string
  applyCoupon: (code: string | null) => void
  retryQuote: () => void
  retryCart: () => void
  setCartQuantity: (id: string, quantity: number) => void
  toggleFavorite: (id: string) => void
  addToCart: (id: string, quantity?: number) => Promise<boolean>
  removeFromCart: (id: string) => void
}

const CommerceContext = createContext<CommerceContextValue | null>(null)

export function CommerceProvider({ children }: { children: ReactNode }) {
  const favoriteActions = useFavoriteActions()
  const cartApi = useCartApi()

  const value: CommerceContextValue = {
    cart: cartApi.items.map((item) => item.id),
    quantities: Object.fromEntries(cartApi.items.map((item) => [item.id, item.quantity])),
    cartItems: cartApi.items,
    cartLoading: cartApi.isPending,
    cartError: cartApi.isError,
    cartBusy: cartApi.busy,
    cartMessage: cartApi.message,
    quote: cartApi.quote,
    quoteLoading: cartApi.quoteLoading,
    quoteError: cartApi.quoteError,
    quoteBusy: cartApi.quoteBusy,
    couponMessage: cartApi.couponMessage,
    applyCoupon: cartApi.applyCoupon,
    retryQuote: cartApi.retryQuote,
    retryCart: () => { void cartApi.refetch() },
    setCartQuantity: cartApi.setQuantity,
    favorites: favoriteActions.favorites,
    toggleFavorite: favoriteActions.toggleFavorite,
    addToCart: cartApi.add,
    removeFromCart: cartApi.remove,
  }

  return <CommerceContext.Provider value={value}>{children}<p role="status" aria-live="polite" className="sr-only">{favoriteActions.message}</p>{favoriteActions.message.includes('desfeita') && <p role="alert" className="fixed bottom-4 left-4 right-4 z-50 rounded border border-[#d28a4c] bg-[#241612] p-4 text-[#f5f1eb]">{favoriteActions.message}</p>}{cartApi.message && <p role="status" className="commerce-cart-toast fixed bottom-4 left-4 right-4 z-50 rounded border border-[#d28a4c] bg-[#241612] p-4 text-[#f5f1eb]">{cartApi.message}</p>}</CommerceContext.Provider>
}

export function useCommerce() {
  const context = useContext(CommerceContext)
  if (!context) throw new Error('useCommerce precisa estar dentro de CommerceProvider')
  return context
}
