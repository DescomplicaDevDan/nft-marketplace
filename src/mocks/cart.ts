import { http, HttpResponse } from 'msw'
import { inventoryNFTs } from './inventory'
import { readCommerce, writeCommerce, type StoredCart } from './commerceStore'
import { ethToWei, weiToEth } from '@/lib/eth'
import type { CartQuote } from '@/features/commerce/quoteTypes'

const empty = (): StoredCart => ({ lines: [], version: 0 })

function database(): Record<string, StoredCart> {
  return readCommerce().carts
}

function response(cart: StoredCart, notices: string[] = []) {
  const nfts = inventoryNFTs()
  return { items: cart.lines.flatMap((line) => {
    const nft = nfts.find((item) => item.id === line.id)
    return nft ? [{ ...nft, quantity: line.quantity }] : []
  }), version: cart.version, notices }
}

const coupons: Record<string, { basisPoints: bigint; expiresAt: string }> = {
  KURIO10: { basisPoints: 1000n, expiresAt: '2099-12-31T23:59:59Z' },
  EXPIRADO: { basisPoints: 1000n, expiresAt: '2020-01-01T00:00:00Z' },
}

class QuoteError extends Error {
  readonly status: number
  readonly code: string
  constructor(message: string, status: number, code: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

function couponRate(code: string) {
  const coupon = coupons[code]
  if (!coupon) throw new QuoteError('Código promocional inválido.', 422, 'coupon_invalid')
  if (Date.parse(coupon.expiresAt) <= Date.now()) throw new QuoteError('Este código promocional expirou.', 422, 'coupon_expired')
  return coupon.basisPoints
}

export function quoteCart(cart: StoredCart): CartQuote {
  const nfts = inventoryNFTs()
  if (!cart.lines.length) throw new QuoteError('Seu carrinho está vazio.', 400, 'cart_empty')
  const items = cart.lines.map((line) => {
    const nft = nfts.find((item) => item.id === line.id)
    if (!nft || line.quantity > nft.available || line.quantity < 1 || !Number.isSafeInteger(line.quantity)) throw new QuoteError('O estoque mudou. Revise as quantidades no carrinho.', 409, 'stock_changed')
    return { ...nft, quantity: line.quantity, lineTotalEth: weiToEth(ethToWei(nft.priceEth) * BigInt(line.quantity)) }
  })
  const subtotal = items.reduce((sum, item) => sum + ethToWei(item.lineTotalEth), 0n)
  const discount = cart.coupon ? subtotal * couponRate(cart.coupon) / 10000n : 0n
  const fee = ethToWei('0.016')
  const calculated = { cartVersion: cart.version, coupon: cart.coupon ?? null, items, subtotalEth: weiToEth(subtotal), discountEth: weiToEth(discount), networkFeeEth: weiToEth(fee), totalEth: weiToEth(subtotal - discount + fee) }
  const old = cart.quote
  if (old && Date.parse(old.expiresAt) > Date.now() && JSON.stringify({ ...old, id: undefined, expiresAt: undefined }) === JSON.stringify(calculated)) return old
  return { ...calculated, id: `quote-${crypto.randomUUID()}`, expiresAt: new Date(Date.now() + 120000).toISOString() }
}

export function quoteFailure(error: unknown) {
  return error instanceof QuoteError
    ? HttpResponse.json({ message: error.message, code: error.code }, { status: error.status })
    : HttpResponse.json({ message: 'Não foi possível calcular o total. Tente novamente.', code: 'quote_failed' }, { status: 500 })
}

export function cartHandlers(userId: (request: Request) => string | undefined) {
  function identity(request: Request) {
    const user = userId(request)
    if (request.headers.get('authorization') && !user) return null
    const guest = request.headers.get('x-guest-cart')
    return user ? `user:${user}` : guest && /^[a-z0-9-]{16,80}$/i.test(guest) ? `guest:${guest}` : null
  }
  const unauthorized = () => HttpResponse.json({ message: 'Não foi possível identificar o carrinho. Entre novamente ou atualize a página.' }, { status: 401 })
  function persist(carts: Record<string, StoredCart>) { writeCommerce({ ...readCommerce(), carts }) }
  return [
    http.post('/api/cart/quote', ({ request }) => {
      const owner = identity(request)
      if (!owner) return unauthorized()
      const state = database()
      const cart = state[owner] ?? empty()
      try {
        cart.quote = quoteCart(cart)
        state[owner] = cart
        persist(state)
        return HttpResponse.json(cart.quote)
      } catch (error) { return quoteFailure(error) }
    }),
    http.put('/api/cart/coupon', async ({ request }) => {
      const owner = identity(request)
      if (!owner) return unauthorized()
      const body = await request.json().catch(() => null) as { code?: unknown } | null
      if (typeof body?.code !== 'string' || !body.code.trim()) return HttpResponse.json({ message: 'Digite um código promocional.', code: 'coupon_required' }, { status: 400 })
      const state = database()
      const cart = state[owner] ?? empty()
      try {
        const code = body.code.trim().toUpperCase()
        couponRate(code)
        cart.coupon = code
        cart.version++
        cart.quote = quoteCart(cart)
        state[owner] = cart
        persist(state)
        return HttpResponse.json({ cart: response(cart), quote: cart.quote })
      } catch (error) { return quoteFailure(error) }
    }),
    http.delete('/api/cart/coupon', ({ request }) => {
      const owner = identity(request)
      if (!owner) return unauthorized()
      const state = database()
      const cart = state[owner] ?? empty()
      try {
        delete cart.coupon
        cart.version++
        cart.quote = quoteCart(cart)
        state[owner] = cart
        persist(state)
        return HttpResponse.json({ cart: response(cart), quote: cart.quote })
      } catch (error) { return quoteFailure(error) }
    }),
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
        const nfts = inventoryNFTs()
        if (!target.coupon && source.coupon) target.coupon = source.coupon
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
      const nft = inventoryNFTs().find((item) => item.id === params.id)
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
