import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { guestCartId } from '@/lib/guestCart'
import { useAuth } from '@/features/auth/AuthProvider'
import type { NFT } from '@/features/catalog/types'

export type CartItem = NFT & { quantity: number }
type CartResponse = { items: CartItem[]; version: number; notices: string[] }
type Change = { id: string; operation: 'add' | 'set' | 'remove'; quantity?: number; owner: string; token: string; guest: string }

export function useCartApi() {
  const { user, loading } = useAuth()
  const guest = guestCartId()
  const owner = user ? `user:${user.id}` : `guest:${guest}`
  const token = user ? localStorage.getItem('kurio-session-token') ?? '' : ''
  const headers = { Authorization: token ? `Bearer ${token}` : '', 'X-Guest-Cart': guest }
  const queryClient = useQueryClient()
  const locked = useRef(false)
  const [notice, setNotice] = useState<{ owner: string; text: string } | null>(null)
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
      const path = `/cart/items/${encodeURIComponent(change.id)}`
      if (change.operation === 'remove') return (await api.delete<CartResponse>(path, config)).data
      return (await api.put<CartResponse>(path, { quantity: change.quantity, operation: change.operation }, config)).data
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

  function change(id: string, operation: Change['operation'], quantity?: number) {
    if (locked.current || loading || !query.isSuccess) return
    locked.current = true
    setNotice(null)
    mutation.mutate({ id, operation, quantity, owner, token, guest })
  }

  return {
    items: query.data?.items ?? [],
    isPending: loading || query.isPending,
    isError: query.isError,
    busy: mutation.isPending || query.isFetching,
    message: notice?.owner === owner ? notice.text : query.data?.notices.join(' ') ?? '',
    refetch: query.refetch,
    add: (id: string, quantity = 1) => change(id, 'add', quantity),
    setQuantity: (id: string, quantity: number) => change(id, 'set', quantity),
    remove: (id: string) => change(id, 'remove'),
  }
}
