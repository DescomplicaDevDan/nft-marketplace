import { http, HttpResponse } from 'msw'
import { ws } from 'msw/ws'
import { SocketIoExtension } from './SocketIoExtension'
import { listenEvents, publish, bumpInventory, publishInventory } from './eventBus'
import { readCommerce, writeCommerce } from './commerceStore'
import { inventoryNFTs } from './inventory'
import { ethToWei } from '@/lib/eth'
import { resumePendingOrders } from './orders'
import type { RealtimeEvent } from '@/features/realtime/types'

export function realtimeHandlers(resolveUser: (token: string) => string | undefined) {
  const link = ws.link('wss://kurio.local', { extensions: [new SocketIoExtension()] })
  const blocked = new Map<string, number>()
  const active = new Map<string, { owner: string; close: () => void }>()
  return [
    link.addEventListener('connection', ({ client }) => {
      const token = client.url.searchParams.get('token') ?? ''
      const guest = client.url.searchParams.get('guest') ?? ''
      const owner = token || guest
      let unsubscribe = () => {}
      let subscribed = false
      const authorized = () => !token || !!resolveUser(token)
      function send(event: RealtimeEvent) {
        if (!subscribed) return
        if (!authorized()) { client.send(['session.expired']); client.close(1008, 'Session expired'); return }
        if (event.type === 'order.updated' && event.data.userId !== resolveUser(token)) return
        client.send([event.type, event.data])
      }
      client.addEventListener('message', ({ data }) => {
        if (data[0] !== 'subscribe' || subscribed) return
        if (!authorized()) { client.send(['session.expired']); client.close(1008, 'Session expired'); return }
        if ((blocked.get(owner) ?? 0) > Date.now()) { client.close(1012, 'Simulated outage'); return }
        subscribed = true
        unsubscribe = listenEvents(send)
        active.set(client.id, { owner, close: () => client.close(1012, 'Simulated outage') })
        resumePendingOrders()
        client.send(['ready', { userId: resolveUser(token) ?? null }])
      })
      const watchdog = setInterval(() => { if (subscribed && !authorized()) { client.send(['session.expired']); client.close(1008, 'Session expired') } }, 5000)
      function storage(event: StorageEvent) {
        if (event.key !== 'kurio-mock-commerce-v1' || !event.newValue) return
        try {
          const old = JSON.parse(event.oldValue ?? '{}')
          const state = readCommerce()
          for (const nft of inventoryNFTs(state)) {
            if ((old.inventory?.[nft.id]?.version ?? 1) < nft.version) send({ type: 'nft.updated', data: { id: `nft:${nft.id}:${nft.version}`, resourceId: nft.id, version: nft.version, payload: nft } })
          }
          for (const record of Object.values(state.orders)) {
            if ((old.orders?.[record.order.id]?.order.version ?? 0) < record.order.version) send({ type: 'order.updated', data: { id: `order:${record.order.id}:${record.order.version}`, resourceId: record.order.id, version: record.order.version, userId: record.userId, payload: record.order } })
          }
        } catch { /* An incomplete storage update is reconciled through REST on reconnect. */ }
      }
      window.addEventListener('storage', storage)
      client.addEventListener('close', () => { unsubscribe(); active.delete(client.id); clearInterval(watchdog); window.removeEventListener('storage', storage) })
    }),
    http.post('/api/demo/realtime/disconnect', async ({ request }) => {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
      if (token && !resolveUser(token)) return HttpResponse.json({ message: 'Entre novamente.' }, { status: 401 })
      const body = await request.json().catch(() => ({})) as { durationMs?: number }
      const duration = Math.max(1000, Math.min(30000, Number(body.durationMs) || 5000))
      const owner = token || request.headers.get('x-guest-cart') || ''
      blocked.set(owner, Date.now() + duration)
      for (const connection of active.values()) if (connection.owner === owner) connection.close()
      return HttpResponse.json({ reconnectAfterMs: duration })
    }),
    http.post('/api/demo/nfts/:id', async ({ request, params }) => {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
      if (token && !resolveUser(token)) return HttpResponse.json({ message: 'Entre novamente.' }, { status: 401 })
      const body = await request.json().catch(() => null) as { priceEth?: string; available?: number; delivery?: string } | null
      if (!body || (body.priceEth === undefined && body.available === undefined) || (body.available !== undefined && (!Number.isSafeInteger(body.available) || body.available < 0))) return HttpResponse.json({ message: 'Informe preço ou estoque válido.' }, { status: 400 })
      try { if (body.priceEth !== undefined) ethToWei(body.priceEth) } catch { return HttpResponse.json({ message: 'Informe o preço como string decimal ETH.' }, { status: 400 }) }
      const state = readCommerce()
      const nft = inventoryNFTs(state).find((item) => item.id === params.id)
      if (!nft) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
      const override = state.inventory[nft.id] ?? { version: 1 }
      if (body.priceEth !== undefined) override.priceEth = body.priceEth
      if (body.available !== undefined) {
        const reserved = Object.values(state.orders).filter((record) => record.order.status !== 'rejected').flatMap((record) => record.order.items).filter((item) => item.id === nft.id).reduce((sum, item) => sum + item.quantity, 0)
        override.supply = body.available + reserved
      }
      state.inventory[nft.id] = override
      bumpInventory(state, [nft.id])
      writeCommerce(state)
      publishInventory(state, [nft.id])
      if (body.delivery === 'duplicate') publishInventory(state, [nft.id])
      if (body.delivery === 'out-of-order') publish({ type: 'nft.updated', data: { id: `nft:${nft.id}:${nft.version}:old`, resourceId: nft.id, version: nft.version, payload: nft } })
      return HttpResponse.json(inventoryNFTs(state).find((item) => item.id === nft.id))
    }),
    http.post('/api/demo/orders/:id/events', async ({ request, params }) => {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
      const user = resolveUser(token)
      const record = readCommerce().orders[String(params.id)]
      if (!user) return HttpResponse.json({ message: 'Entre novamente.' }, { status: 401 })
      if (!record || record.userId !== user) return HttpResponse.json({ message: 'Pedido não encontrado.' }, { status: 404 })
      const event: RealtimeEvent = { type: 'order.updated', data: { id: `order:${record.order.id}:${record.order.version}`, resourceId: record.order.id, version: record.order.version, userId: user, payload: record.order } }
      publish(event); publish(event)
      if (record.order.version > 1) publish({ type: 'order.updated', data: { ...event.data, id: `order:${record.order.id}:1`, version: 1, payload: { ...record.order, version: 1, status: 'pending', transactionHash: undefined } } })
      return HttpResponse.json({ delivered: true })
    }),
  ]
}
