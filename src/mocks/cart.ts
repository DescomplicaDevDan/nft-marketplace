import { http, HttpResponse } from 'msw'
import { nfts } from './data/nfts'

type Line = { id: string; quantity: number }
type StoredCart = { lines: Line[]; version: number }
const KEY = 'kurio-mock-carts'
const empty = (): StoredCart => ({ lines: [], version: 0 })

function database(): Record<string, StoredCart> {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch { return {} }
}

function response(cart: StoredCart, notices: string[] = []) {
  return { items: cart.lines.flatMap((line) => {
    const nft = nfts.find((item) => item.id === line.id)
    return nft ? [{ ...nft, quantity: line.quantity }] : []
  }), version: cart.version, notices }
}

export function cartHandlers(userId: (request: Request) => string | undefined) {
  function identity(request: Request) {
    const user = userId(request)
    if (request.headers.get('authorization') && !user) return null
    const guest = request.headers.get('x-guest-cart')
    return user ? `user:${user}` : guest && /^[a-z0-9-]{16,80}$/i.test(guest) ? `guest:${guest}` : null
  }
  const unauthorized = () => HttpResponse.json({ message: 'Não foi possível identificar o carrinho. Entre novamente ou atualize a página.' }, { status: 401 })
  function persist(state: Record<string, StoredCart>) { localStorage.setItem(KEY, JSON.stringify(state)) }
  return [
    http.get('/api/cart', ({ request }) => {
      const id = identity(request)
      if (!id) return unauthorized()
      return HttpResponse.json(response(database()[id] ?? empty()))
    }),
    http.post('/api/cart/merge', ({ request }) => {
      const user = userId(request)
      const guest = request.headers.get('x-guest-cart')
      if (!user || !guest || !/^[a-z0-9-]{16,80}$/i.test(guest)) return unauthorized()
      const state = database()
      const target = state[`user:${user}`] ?? empty()
      const source = state[`guest:${guest}`] ?? empty()
      const notices: string[] = []
      if (source.lines.length) {
        for (const line of source.lines) {
          const nft = nfts.find((item) => item.id === line.id)
          const existing = target.lines.find((item) => item.id === line.id)
          const requested = (existing?.quantity ?? 0) + line.quantity
          const quantity = Math.min(requested, nft?.available ?? 0)
          if (quantity < requested) notices.push(`A quantidade de ${nft?.name ?? line.id} foi ajustada ao estoque disponível.`)
          if (existing) existing.quantity = quantity
          else if (quantity > 0) target.lines.push({ id: line.id, quantity })
        }
        target.lines = target.lines.filter((line) => line.quantity > 0)
        target.version++
        state[`user:${user}`] = target
        state[`guest:${guest}`] = { lines: [], version: source.version + 1 }
        try { persist(state) } catch { return HttpResponse.json({ message: 'Não foi possível unir os carrinhos. Seus itens foram preservados.' }, { status: 507 }) }
      }
      return HttpResponse.json(response(target, notices))
    }),
    http.put('/api/cart/items/:id', async ({ request, params }) => {
      const owner = identity(request)
      if (!owner) return unauthorized()
      const body = await request.json().catch(() => null) as { quantity?: unknown; operation?: unknown } | null
      if (!body || !Number.isSafeInteger(body.quantity) || Number(body.quantity) < 1 || !['add', 'set'].includes(String(body.operation))) return HttpResponse.json({ message: 'Informe uma quantidade inteira maior que zero.' }, { status: 400 })
      const nft = nfts.find((item) => item.id === params.id)
      if (!nft) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
      const state = database()
      const cart = state[owner] ?? empty()
      const existing = cart.lines.find((item) => item.id === nft.id)
      const quantity = Number(body.quantity) + (body.operation === 'add' ? existing?.quantity ?? 0 : 0)
      if (!Number.isSafeInteger(quantity) || quantity > nft.available) return HttpResponse.json({ message: `Estoque insuficiente: ${nft.name} tem ${nft.available} edição(ões) disponível(is).` }, { status: 409 })
      if (existing) existing.quantity = quantity
      else cart.lines.push({ id: nft.id, quantity })
      cart.version++
      state[owner] = cart
      try { persist(state) } catch { return HttpResponse.json({ message: 'Não foi possível salvar o carrinho.' }, { status: 507 }) }
      return HttpResponse.json(response(cart))
    }),
    http.delete('/api/cart/items/:id', ({ request, params }) => {
      const owner = identity(request)
      if (!owner) return unauthorized()
      const state = database()
      const cart = state[owner] ?? empty()
      cart.lines = cart.lines.filter((line) => line.id !== params.id)
      cart.version++
      state[owner] = cart
      try { persist(state) } catch { return HttpResponse.json({ message: 'Não foi possível remover o item.' }, { status: 507 }) }
      return HttpResponse.json(response(cart))
    }),
  ]
}
