import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthProvider'
import type { CreateOrder, Order, OrderFailure } from './orderTypes'
import { useRealtime } from '@/features/realtime/context'

type Attempt = { key: string; payload: CreateOrder; orderId?: string }
const attemptKey = (userId: string) => `kurio-order-attempt:${userId}`
function readAttempt(userId: string): Attempt | null {
  try {
    const value = JSON.parse(localStorage.getItem(attemptKey(userId)) ?? 'null')
    return value && typeof value.key === 'string' && value.payload && typeof value.payload.quoteId === 'string' ? value : null
  } catch { return null }
}

export function useOrders() {
  const realtime = useRealtime()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const handled = useRef('')
  const query = useQuery({ queryKey: ['orders', user?.id], enabled: !!user, queryFn: async ({ signal }) => (await api.get<Order[]>('/orders', { signal })).data, retry: 1, refetchInterval: (query) => !realtime.connected && query.state.data?.some((order) => order.status === 'pending') ? 2000 : false })
  useEffect(() => {
    const signature = query.data?.filter((order) => order.status !== 'pending').map((order) => `${order.id}:${order.version}`).join('|')
    if (!user || !signature || handled.current === signature) return
    handled.current = signature
    void queryClient.invalidateQueries({ queryKey: ['cart', `user:${user.id}`] })
    void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    void queryClient.invalidateQueries({ queryKey: ['nft'] })
  }, [query.data, queryClient, user])
  return query
}

export function useOrder(id: string) {
  const realtime = useRealtime()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const handled = useRef('')
  const query = useQuery({ queryKey: ['order', user?.id, id], enabled: !!user, queryFn: async ({ signal }) => (await api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })).data, retry: (count, error) => count < 1 && (!isAxiosError(error) || !error.response || error.response.status >= 500), refetchInterval: (query) => !realtime.connected && query.state.data?.status === 'pending' ? 2000 : false })
  useEffect(() => {
    const order = query.data
    if (!user || !order || order.status === 'pending' || handled.current === `${order.id}:${order.version}`) return
    handled.current = `${order.id}:${order.version}`
    const attempt = readAttempt(user.id)
    if (attempt?.orderId === order.id || attempt?.payload.quoteId === order.quoteId) localStorage.removeItem(attemptKey(user.id))
    void queryClient.invalidateQueries({ queryKey: ['cart', `user:${user.id}`] })
    void queryClient.invalidateQueries({ queryKey: ['orders', user.id] })
    void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    void queryClient.invalidateQueries({ queryKey: ['nft'] })
    void queryClient.invalidateQueries({ queryKey: ['favorites', user.id] })
  }, [query.data, queryClient, user])
  return query
}

export function useCheckoutOrder() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [attempt, setAttempt] = useState<Attempt | null>(() => user ? readAttempt(user.id) : null)
  const [message, setMessage] = useState('')
  const locked = useRef(false)
  const mutation = useMutation({
    mutationFn: async (input: { attempt: Attempt; token: string }) => (await api.post<Order>('/orders', input.attempt.payload, { headers: { 'Idempotency-Key': input.attempt.key, Authorization: `Bearer ${input.token}` } })).data,
    retry: false,
  })
  const recovery = useQuery({
    queryKey: ['orderAttempt', user?.id, attempt?.key],
    enabled: !!user && !!attempt && !mutation.isPending,
    queryFn: async ({ signal }) => (await api.get<Order>(`/orders/by-key/${encodeURIComponent(attempt!.key)}`, { signal })).data,
    retry: false,
  })

  async function submit(saved: Attempt) {
    if (!user || locked.current) return
    locked.current = true
    setMessage('')
    const id = user.id
    const token = localStorage.getItem('kurio-session-token') ?? ''
    try {
      localStorage.setItem(attemptKey(id), JSON.stringify(saved))
      setAttempt(saved)
      let order: Order
      try {
        order = await mutation.mutateAsync({ attempt: saved, token })
      } catch (error) {
        const failure = isAxiosError<OrderFailure>(error) ? error.response?.data : undefined
        if (failure?.quote) {
          queryClient.setQueryData(['quote', `user:${id}`, failure.quote.cartVersion], failure.quote)
          void queryClient.invalidateQueries({ queryKey: ['cart', `user:${id}`] })
        }
        if (failure?.orderId) order = (await api.get<Order>(`/orders/${encodeURIComponent(failure.orderId)}`, { headers: { Authorization: `Bearer ${token}` } })).data
        else if (isAxiosError(error) && error.response && error.response.status < 500 && error.response.status !== 401 && failure?.code !== 'idempotency_conflict') {
          localStorage.removeItem(attemptKey(id))
          setAttempt(null)
          setMessage(failure?.message ?? 'Confira os dados e tente novamente.')
          return
        } else {
          try { order = (await api.get<Order>(`/orders/by-key/${encodeURIComponent(saved.key)}`, { headers: { Authorization: `Bearer ${token}` } })).data }
          catch {
            setMessage('Não foi possível obter o resultado. Verifique o pedido ou reenvie a mesma solicitação; a chave foi preservada para evitar duplicidade.')
            return
          }
        }
      }
      localStorage.setItem(attemptKey(id), JSON.stringify({ ...saved, orderId: order.id }))
      queryClient.setQueryData(['order', id, order.id], order)
      void queryClient.invalidateQueries({ queryKey: ['orders', id] })
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      void queryClient.invalidateQueries({ queryKey: ['nft'] })
      if (queryClient.getQueryData<{ id: string }>(['session'])?.id !== id) return
      setAttempt({ ...saved, orderId: order.id })
      return order
    } catch {
      setMessage('Não foi possível registrar a solicitação. Seus itens foram preservados.')
    } finally { locked.current = false }
  }

  return {
    attempt,
    message,
    busy: mutation.isPending || recovery.isFetching,
    recoveredOrder: recovery.data,
    create: (payload: CreateOrder) => {
      if (attempt) { setMessage('Verifique a solicitação em andamento antes de iniciar outra.'); return Promise.resolve(undefined) }
      return submit({ key: crypto.randomUUID(), payload })
    },
    retry: () => attempt ? submit(attempt) : Promise.resolve(undefined),
    recover: () => { void recovery.refetch() },
  }
}
