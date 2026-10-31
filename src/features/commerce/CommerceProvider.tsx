import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface CommerceState {
  favorites: string[]
  cart: string[]
}

interface CommerceContextValue extends CommerceState {
  toggleFavorite: (id: string) => void
  addToCart: (id: string) => void
  removeFromCart: (id: string) => void
}

const STORAGE_KEY = 'kurio-commerce'
const emptyState: CommerceState = { favorites: [], cart: [] }
const CommerceContext = createContext<CommerceContextValue | null>(null)

function loadState(): CommerceState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState
    const parsed: unknown = JSON.parse(stored)
    if (typeof parsed !== 'object' || parsed === null) return emptyState
    const value = parsed as Record<string, unknown>
    return {
      favorites: Array.isArray(value.favorites) ? value.favorites.filter((id): id is string => typeof id === 'string') : [],
      cart: Array.isArray(value.cart) ? value.cart.filter((id): id is string => typeof id === 'string') : [],
    }
  } catch {
    return emptyState
  }
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value: CommerceContextValue = {
    ...state,
    toggleFavorite: (id) => setState((current) => ({
      ...current,
      favorites: current.favorites.includes(id)
        ? current.favorites.filter((favorite) => favorite !== id)
        : [...current.favorites, id],
    })),
    addToCart: (id) => setState((current) => current.cart.includes(id)
      ? current
      : { ...current, cart: [...current.cart, id] }),
    removeFromCart: (id) => setState((current) => ({
      ...current,
      cart: current.cart.filter((item) => item !== id),
    })),
  }

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
}

export function useCommerce() {
  const context = useContext(CommerceContext)
  if (!context) throw new Error('useCommerce precisa estar dentro de CommerceProvider')
  return context
}
