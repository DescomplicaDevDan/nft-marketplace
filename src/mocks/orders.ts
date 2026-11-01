import { delay, http, HttpResponse } from 'msw'
import { readCommerce, writeCommerce, type CommerceDatabase, type StoredOrder } from './commerceStore'
import { quoteCart, quoteFailure } from './cart'
import { sessionWalletConnection } from './wallets'
import type { CreateOrder, Order } from '@/features/commerce/orderTypes'
import { bumpInventory, publish, publishInventory } from './eventBus'

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`
  return JSON.stringify(value)
}

function settle(state: CommerceDatabase, record: StoredOrder) {
  if (record.order.status !== 'pending' || Date.now() < record.readyAt) return false
  const order = record.order
  order.status = record.outcome
  order.version++
  if (order.status === 'confirmed') {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    order.transactionHash = `0x${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
    const cart = state.carts[`user:${record.userId}`]
    if (cart) {
      for (const purchased of order.items) {
        const line = cart.lines.find((item) => item.id === purchased.id && (item.editionId ?? 'one-of-fifty') === purchased.editionId)
        if (line) line.quantity = Math.max(0, line.quantity - purchased.quantity)
      }
      cart.lines = cart.lines.filter((line) => line.quantity > 0)
      cart.version++
      delete cart.quote
      if (!cart.lines.length) delete cart.coupon
    }
  } else order.reason = 'Pagamento recusado pela carteira simulada. Seus itens foram preservados.'
  bumpInventory(state, order.items.map((item) => item.id))
  return true
}

function currentDatabase() {
  const state = readCommerce()
  let changed = false
  for (const record of Object.values(state.orders)) changed = settle(state, record) || changed
  if (changed) {
    writeCommerce(state)
    for (const record of Object.values(state.orders)) {
      if (record.order.status === 'pending') continue
      publish({ type: 'order.updated', data: { id: `order:${record.order.id}:${record.order.version}`, resourceId: record.order.id, version: record.order.version, userId: record.userId, payload: record.order } })
    }
    publishInventory(state, Object.keys(state.inventory))
  }
  return state
}

export function resumePendingOrders() {
  const state = currentDatabase()
  for (const record of Object.values(state.orders)) {
    if (record.order.status === 'pending') setTimeout(() => { try { currentDatabase() } catch { /* Retry through REST reconciliation. */ } }, Math.max(0, record.readyAt - Date.now()) + 10)
  }
}

export function orderHandlers(userId: (request: Request) => string | undefined) {
  const unauthorized = () => HttpResponse.json({ message: 'Sua sessão expirou. Entre para acessar seus pedidos.' }, { status: 401 })
  return [
    http.post('/api/orders', async ({ request }) => {
      const body = await request.json().catch(() => null) as CreateOrder | null
      const user = userId(request)
      if (!user) return unauthorized()
      const key = request.headers.get('idempotency-key')
      if (!key || !/^[a-zA-Z0-9-]{16,100}$/.test(key)) return HttpResponse.json({ message: 'Informe uma chave de idempotência válida.', code: 'idempotency_required' }, { status: 400 })
      const state = currentDatabase()
      const payload = canonical(body)
      const previousId = state.keys[`${user}:${key}`]
      if (previousId) {
        const previous = state.orders[previousId]
        if (previous.payload !== payload) return HttpResponse.json({ message: 'Esta solicitação já foi usada com outros dados.', code: 'idempotency_conflict' }, { status: 409 })
        return HttpResponse.json(previous.order)
      }
      if (!body || typeof body.quoteId !== 'string' || typeof body.connectionId !== 'string' || !['confirmed', 'rejected', 'timeout'].includes(body.scenario) || !body.collector || ['displayName', 'username', 'email', 'profileName', 'referral', 'ens'].some((field) => typeof body.collector[field as keyof CreateOrder['collector']] !== 'string' || !body.collector[field as keyof CreateOrder['collector']].trim()) || !/^\S+@\S+\.\S+$/.test(body.collector.email) || typeof body.collector.notes !== 'string' || body.collector.notes.length > 2000) return HttpResponse.json({ message: 'Confira os dados obrigatórios do colecionador.', code: 'validation_error' }, { status: 400 })
      const pending = Object.values(state.orders).find((record) => record.userId === user && record.order.status === 'pending')
      if (pending) return HttpResponse.json({ message: 'Existe um pedido em processamento. Acompanhe-o antes de iniciar outro.', code: 'order_pending', orderId: pending.order.id }, { status: 409 })
      const connection = sessionWalletConnection(request)
      if (!connection || connection.id !== body.connectionId || !body.wallet || connection.address !== body.wallet.address || connection.network !== body.wallet.network || connection.provider !== body.wallet.provider) return HttpResponse.json({ message: 'Conecte a carteira e a rede selecionadas antes de comprar.', code: 'wallet_disconnected' }, { status: 409 })
      const cart = state.carts[`user:${user}`]
      if (!cart) return HttpResponse.json({ message: 'Seu carrinho está vazio.', code: 'cart_empty' }, { status: 400 })
      try {
        const fresh = quoteCart(cart)
        if (fresh.id !== body.quoteId) {
          cart.quote = fresh
          writeCommerce(state)
          return HttpResponse.json({ message: 'A cotação mudou ou expirou. Revise os valores e confirme novamente.', code: 'quote_changed', quote: fresh }, { status: 409 })
        }
        const id = `KURIO-${crypto.randomUUID()}`
        const order: Order = {
          id, status: 'pending', version: 1, createdAt: new Date().toISOString(), quoteId: fresh.id,
          items: fresh.items.map((item) => ({ id: item.id, lineId: item.lineId, editionId: item.editionId, editionLabel: item.editionLabel ?? '—', name: item.name, collection: item.collection, imageUrl: item.imageUrl, quantity: item.quantity, unitPriceEth: item.priceEth, priceEth: item.lineTotalEth })),
          wallet: connection.provider, walletAddress: connection.address, network: connection.network,
          subtotalEth: fresh.subtotalEth, discountEth: fresh.discountEth, networkFeeEth: fresh.networkFeeEth, totalEth: fresh.totalEth, coupon: fresh.coupon,
        }
        state.orders[id] = { userId: user, order, payload, readyAt: Date.now() + 2500, outcome: body.scenario === 'rejected' ? 'rejected' : 'confirmed' }
        state.keys[`${user}:${key}`] = id
        bumpInventory(state, order.items.map((item) => item.id))
        writeCommerce(state)
        publishInventory(state, order.items.map((item) => item.id))
        publish({ type: 'order.updated', data: { id: `order:${id}:1`, resourceId: id, version: 1, userId: user, payload: order } })
        setTimeout(() => { try { currentDatabase() } catch { /* REST recovery retries persistence after a transient storage failure. */ } }, 2600)
        if (body.scenario === 'timeout') {
          await delay(10000)
          return HttpResponse.json(currentDatabase().orders[id].order)
        }
        return HttpResponse.json(order, { status: 201 })
      } catch (error) { return quoteFailure(error) }
    }),
    http.get('/api/orders/by-key/:key', ({ request, params }) => {
      const user = userId(request)
      if (!user) return unauthorized()
      const state = currentDatabase()
      const id = state.keys[`${user}:${params.key}`]
      return id ? HttpResponse.json(state.orders[id].order) : HttpResponse.json({ message: 'Solicitação ainda não encontrada. Você pode reenviar a mesma solicitação.', code: 'order_not_found' }, { status: 404 })
    }),
    http.get('/api/orders/:id', ({ request, params }) => {
      const user = userId(request)
      if (!user) return unauthorized()
      const record = currentDatabase().orders[String(params.id)]
      return record?.userId === user ? HttpResponse.json(record.order) : HttpResponse.json({ message: 'Pedido não encontrado.' }, { status: 404 })
    }),
    http.get('/api/orders', ({ request }) => {
      const user = userId(request)
      if (!user) return unauthorized()
      return HttpResponse.json(Object.values(currentDatabase().orders).filter((record) => record.userId === user).map((record) => record.order).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }),
  ]
}
