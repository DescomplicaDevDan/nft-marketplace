import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthProvider'
import { useCommerce } from '@/features/commerce/CommerceProvider'
import { api } from '@/lib/api'
import { guestCartId } from '@/lib/guestCart'
import type { NFT, NFTListResponse } from '@/features/catalog/types'
import type { Order } from '@/features/commerce/orderTypes'
import type { NFTUpdated, OrderUpdated } from './types'
import { RealtimeContext } from './context'

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const { cart } = useCommerce()
  const cartRef = useRef(cart)
  useEffect(() => { cartRef.current = cart }, [cart])
  const queryClient = useQueryClient()
  const token = user ? localStorage.getItem('kurio-session-token') ?? '' : ''
  const userId = user?.id
  const guest = guestCartId()
  const owner = userId ? `user:${userId}:${token}` : `guest:${guest}`
  const [status, setStatus] = useState({ owner: '', connected: false, message: '' })

  useEffect(() => {
    if (loading || (!import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS !== 'true')) return
    let active = true
    let dispose = () => {}
    // Socket.IO captures WebSocket at import time: load it after worker.start().
    void import('socket.io-client').then(({ io }) => {
    if (!active) return
    let connectedOnce = false
    const seen = new Set<string>()
    const versions = new Map<string, number>()
    const socket = io('https://kurio.local', { transports: ['websocket'], query: { token, guest }, forceNew: true, autoConnect: false, reconnectionDelay: 500, reconnectionDelayMax: 2000 })
    const current = () => active && (localStorage.getItem('kurio-session-token') ?? '') === token
    function accept(type: string, event: { id: string; resourceId: string; version: number }) {
      if (!current() || !event || typeof event.id !== 'string' || typeof event.resourceId !== 'string' || !Number.isSafeInteger(event.version) || event.version < 1 || seen.has(event.id)) return false
      const key = `${type}:${event.resourceId}`
      if (event.version <= (versions.get(key) ?? 0)) return false
      seen.add(event.id)
      versions.set(key, event.version)
      if (seen.size > 500) seen.delete(seen.values().next().value!)
      return true
    }
    function reconcile() {
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      void queryClient.invalidateQueries({ queryKey: ['nft'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: ['order', userId] })
        void queryClient.invalidateQueries({ queryKey: ['orders', userId] })
        void queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      }
    }
    socket.on('connect', () => socket.emit('subscribe'))
    socket.on('ready', (data: { userId: string | null }) => {
      if (!current() || data.userId !== (userId ?? null)) return
      setStatus({ owner, connected: true, message: connectedOnce ? 'Conexão restabelecida. Preços e pedidos estão sendo conferidos pela API.' : '' })
      connectedOnce = true
      reconcile()
    })
    socket.on('disconnect', () => { if (current()) setStatus({ owner, connected: false, message: 'Conexão em tempo real interrompida. Os pedidos continuam sendo consultados pela API.' }) })
    socket.on('connect_error', () => { if (current()) setStatus({ owner, connected: false, message: 'Reconectando às atualizações em tempo real…' }) })
    socket.on('session.expired', () => { if (current() && token) void api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }).catch(() => {}) })
    socket.on('nft.updated', (event: NFTUpdated) => {
      if (!event?.payload || event.payload.id !== event.resourceId || event.payload.version !== event.version || !Number.isSafeInteger(event.payload.available) || event.payload.available < 0 || !accept('nft', event)) return
      const detail = queryClient.getQueryData<NFT>(['nft', event.resourceId])
      const cachedVersion = Math.max(detail?.version ?? 0, ...queryClient.getQueriesData<NFTListResponse>({ queryKey: ['nfts'] }).flatMap(([, data]) => data?.items.filter((item) => item.id === event.resourceId).map((item) => item.version ?? 0) ?? []))
      if (cachedVersion > event.version) return
      void queryClient.cancelQueries({ queryKey: ['nft', event.resourceId] })
      queryClient.setQueryData(['nft', event.resourceId], event.payload)
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      if (userId) void queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      if (cartRef.current.includes(event.resourceId)) {
        setStatus({ owner, connected: true, message: 'Preço ou estoque de um NFT do carrinho mudou. Revise os itens e o total antes de confirmar.' })
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
        void queryClient.resetQueries({ queryKey: ['quote'] })
      }
    })
    socket.on('order.updated', (event: OrderUpdated) => {
      if (!userId || event?.userId !== userId || !event.payload || event.payload.id !== event.resourceId || event.payload.version !== event.version || !['pending', 'confirmed', 'rejected'].includes(event.payload.status) || !accept('order', event)) return
      const key = ['order', userId, event.resourceId]
      const cached = queryClient.getQueryData<Order>(key)
      if (cached && (cached.version >= event.version || (cached.status !== 'pending' && cached.status !== event.payload.status))) return
      void queryClient.cancelQueries({ queryKey: key })
      queryClient.setQueryData(key, event.payload)
      void queryClient.invalidateQueries({ queryKey: ['orders', userId] })
      if (event.payload.status !== 'pending') {
        void queryClient.invalidateQueries({ queryKey: ['cart', `user:${userId}`] })
        void queryClient.resetQueries({ queryKey: ['quote'] })
      }
    })
    const offline = () => socket.io.engine?.close()
    const online = () => { if (!socket.connected) socket.connect() }
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    socket.connect()
    dispose = () => {
      socket.removeAllListeners()
      socket.disconnect()
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
    }).catch(() => { if (active) setStatus({ owner, connected: false, message: 'Tempo real indisponível. Os pedidos continuam sendo consultados pela API.' }) })
    return () => { active = false; dispose() }
  }, [userId, token, guest, owner, loading, queryClient])

  const value = status.owner === owner ? { connected: status.connected, message: status.message } : { connected: false, message: '' }
  return <RealtimeContext.Provider value={value}>{children}{value.message && <p role="status" className="fixed top-2 left-4 right-4 z-50 rounded border border-[#d28a4c] bg-[#241612] p-3 text-sm text-[#f5f1eb]">{value.message}</p>}</RealtimeContext.Provider>
}
