import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { guestCartId } from '@/lib/guestCart'
import { useAuth } from '@/features/auth/AuthProvider'
import type { NFT } from '@/features/catalog/types'
import { editionLineId, parseEditionLineId } from '@/features/catalog/types'
import type { CartQuote } from './quoteTypes'

export type CartItem = NFT & { quantity: number; lineId: string; editionId: string }
type CartResponse = { items: CartItem[]; version: number; notices: string[] }
type Change = { lineId: string; operation: 'add' | 'set' | 'remove'; quantity?: number; owner: string; token: string; guest: string }

export function useCartApi() {
  const { user, loading } = useAuth()
  const guest = guestCartId()
  const owner = user ? `user:${user.id}` : `guest:${guest}`
  const token = user ? localStorage.getItem('kurio-session-token') ?? '' : ''
  const headers = { Authorization: token ? `Bearer ${token}` : '', 'X-Guest-Cart': guest }
  const queryClient = useQueryClient()
  const locked = useRef(false)
  const [notice, setNotice] = useState<{ owner: string; text: string } | null>(null)
  const [couponNotice, setCouponNotice] = useState<{ owner: string; text: string } | null>(null)
  const query = useQuery({
    queryKey: ['cart', owner],
    enabled: !loading,
    queryFn: async ({ signal }) => {
      if (user) {
        // The server consumes the guest cart atomically, so repeating this merge is safe.
        return (await api.post<CartResponse>('/cart/merge', {}, { signal, headers })).data
      }
      return (await api.get<CartResponse>('/cart', { signal, headers })).data
    },
    retry: 1,
  })
  const mutation = useMutation({
    mutationFn: async (change: Change) => {
      const config = { headers: { Authorization: change.token ? `Bearer ${change.token}` : '', 'X-Guest-Cart': change.guest } }
      const { nftId, editionId } = parseEditionLineId(change.lineId)
      const path = `/cart/items/${encodeURIComponent(nftId)}`
      if (change.operation === 'remove') return (await api.delete<CartResponse>(`${path}?editionId=${encodeURIComponent(editionId)}`, config)).data
      return (await api.put<CartResponse>(path, { quantity: change.quantity, operation: change.operation, editionId }, config)).data
    },
    retry: false,
    onSuccess: (data, change) => {
      queryClient.setQueryData(['cart', change.owner], data)
      setNotice({ owner: change.owner, text: change.operation === 'remove' ? 'NFT removido do carrinho.' : 'Carrinho atualizado.' })
    },
    onError: (error, change) => {
      const text = isAxiosError<{ message: string }>(error) ? error.response?.data?.message ?? 'Não foi possível atualizar o carrinho. Confira os itens antes de tentar novamente.' : 'Não foi possível atualizar o carrinho.'
      setNotice({ owner: change.owner, text })
    },
    onSettled: async (_data, _error, change) => {
      try { await queryClient.invalidateQueries({ queryKey: ['cart', change.owner] }) }
      finally { locked.current = false }
    },
  })

  const quote = useQuery({
    queryKey: ['quote', owner, query.data?.version],
    enabled: query.isSuccess && !query.isFetching && !!query.data.items.length && !mutation.isPending,
    queryFn: async ({ signal }) => (await api.post<CartQuote>('/cart/quote', {}, { signal, headers })).data,
    retry: (count, error) => count < 1 && (!isAxiosError(error) || !error.response || error.response.status >= 500),
    refetchInterval: 60000,
  })

  const couponMutation = useMutation({
    mutationFn: async (change: { code: string | null; owner: string; token: string; guest: string }) => {
      const config = { headers: { Authorization: change.token ? `Bearer ${change.token}` : '', 'X-Guest-Cart': change.guest } }
      return change.code === null
        ? (await api.delete<{ cart: CartResponse; quote: CartQuote }>('/cart/coupon', config)).data
        : (await api.put<{ cart: CartResponse; quote: CartQuote }>('/cart/coupon', { code: change.code }, config)).data
    },
    retry: false,
    onSuccess: (data, change) => {
      queryClient.setQueryData(['cart', change.owner], data.cart)
      queryClient.setQueryData(['quote', change.owner, data.cart.version], data.quote)
      setCouponNotice({ owner: change.owner, text: change.code === null ? 'Cupom removido.' : 'Cupom aplicado.' })
    },
    onError: (error, change) => {
      setCouponNotice({ owner: change.owner, text: isAxiosError<{ message: string }>(error) ? error.response?.data?.message ?? 'Não foi possível alterar o cupom. Tente novamente.' : 'Não foi possível alterar o cupom.' })
    },
    onSettled: () => { locked.current = false },
  })

  function applyCoupon(code: string | null) {
    if (locked.current || !query.isSuccess || !query.data.items.length) return
    locked.current = true
    setCouponNotice(null)
    couponMutation.mutate({ code, owner, token, guest })
  }

  async function change(lineId: string, operation: Change['operation'], quantity?: number): Promise<boolean> {
    if (locked.current || loading || !query.isSuccess) return false
    locked.current = true
    setNotice(null)
    try {
      await mutation.mutateAsync({ lineId, operation, quantity, owner, token, guest })
      return true
    } catch { return false }
  }

  return {
    items: query.data?.items ?? [],
    quote: query.data?.items.length && !quote.isError && quote.data?.cartVersion === query.data.version ? quote.data : undefined,
    quoteLoading: quote.isPending && !!query.data?.items.length,
    quoteError: quote.isError ? (isAxiosError<{ message: string }>(quote.error) ? quote.error.response?.data?.message ?? 'Não foi possível calcular o total.' : 'Não foi possível calcular o total.') : '',
    quoteBusy: quote.isFetching || couponMutation.isPending,
    retryQuote: () => { void quote.refetch() },
    couponMessage: couponNotice?.owner === owner ? couponNotice.text : '',
    applyCoupon,
    isPending: loading || query.isPending,
    isError: query.isError,
    busy: mutation.isPending || query.isFetching || couponMutation.isPending,
    message: notice?.owner === owner ? notice.text : query.data?.notices.join(' ') ?? '',
    refetch: query.refetch,
    add: (id: string, quantity = 1, editionId = 'one-of-fifty') => change(editionLineId(id, editionId), 'add', quantity),
    setQuantity: (id: string, quantity: number) => change(id, 'set', quantity),
    remove: (id: string) => change(id, 'remove'),
  }
}
