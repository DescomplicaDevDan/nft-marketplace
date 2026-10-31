import { http, HttpResponse } from 'msw'
import { categoryCounts, featuredNFT, networkCounts, nfts } from './data/nfts'
import type { NFTListResponse } from '@/features/catalog/types'

type MockUser = { id: string; username: string; email: string; passwordHash: string }
type MockAuthState = { users: MockUser[]; sessions: Record<string, string> }
const AUTH_DB_KEY = 'kurio-auth-mock-db'
const demoAuthState: MockAuthState = {
  users: [
    { id: 'user-collector', username: 'colecionador', email: 'colecionador@kurio.demo', passwordHash: '5967c16c2022d4e40c36c348638237f3846e004c5f74dcde8aa0373f383aa8d4' },
    { id: 'user-creator', username: 'sato', email: 'sato@kurio.demo', passwordHash: '4e469ba0b0928fc4d2eb81d45b22dfe79911064a0dc85be0b29b2e778911b6af' },
  ],
  sessions: {},
}

function readAuthState(): MockAuthState {
  try {
    const stored = localStorage.getItem(AUTH_DB_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as MockAuthState
      if (Array.isArray(parsed?.users) && parsed.users.every((user) => user && ['id', 'username', 'email', 'passwordHash'].every((key) => typeof user[key as keyof MockUser] === 'string')) && parsed.sessions && typeof parsed.sessions === 'object' && !Array.isArray(parsed.sessions)) return parsed
    }
  } catch { /* Restore known demo accounts if saved mock state is invalid. */ }
  return structuredClone(demoAuthState)
}

function writeAuthState(state: MockAuthState) {
  localStorage.setItem(AUTH_DB_KEY, JSON.stringify(state))
}

async function passwordHash(password: string) {
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function publicUser(user: MockUser) {
  return { id: user.id, username: user.username, email: user.email }
}

function sessionUser(request: Request, state: MockAuthState) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const id = token ? state.sessions[token] : undefined
  return state.users.find((user) => user.id === id)
}

function ethToWei(value: string): bigint {
  const [whole, fraction = ''] = value.split('.')
  const paddedFraction = fraction.padEnd(18, '0').slice(0, 18)
  return BigInt(whole || '0') * 10n ** 18n + BigInt(paddedFraction || '0')
}

export const handlers = [
  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json().catch(() => null) as { username?: unknown; email?: unknown; password?: unknown } | null
    const username = typeof body?.username === 'string' ? body.username.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (username.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      return HttpResponse.json({ message: 'Confira o nome, o e-mail e a senha (mínimo de 8 caracteres).' }, { status: 400 })
    }
    const state = readAuthState()
    if (state.users.some((user) => user.email === email || user.username.toLowerCase() === username.toLowerCase())) {
      return HttpResponse.json({ message: 'Este e-mail ou nome de usuário já está cadastrado.' }, { status: 409 })
    }
    const user: MockUser = { id: `user-${crypto.randomUUID()}`, username, email, passwordHash: await passwordHash(password) }
    const token = crypto.randomUUID()
    state.users.push(user)
    state.sessions[token] = user.id
    writeAuthState(state)
    return HttpResponse.json({ user: publicUser(user), token }, { status: 201 })
  }),
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const state = readAuthState()
    const hash = await passwordHash(password)
    const user = state.users.find((item) => item.email === email && item.passwordHash === hash)
    if (!user) return HttpResponse.json({ message: 'E-mail ou senha incorretos.' }, { status: 401 })
    const token = crypto.randomUUID()
    state.sessions[token] = user.id
    writeAuthState(state)
    return HttpResponse.json({ user: publicUser(user), token })
  }),
  http.get('/api/auth/me', ({ request }) => {
    const state = readAuthState()
    const user = sessionUser(request, state)
    return user
      ? HttpResponse.json({ user: publicUser(user) })
      : HttpResponse.json({ message: 'Sua sessão expirou. Entre novamente.' }, { status: 401 })
  }),
  http.post('/api/auth/logout', ({ request }) => {
    const state = readAuthState()
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (token) delete state.sessions[token]
    writeAuthState(state)
    return new HttpResponse(null, { status: 204 })
  }),
  http.get('/api/nfts/:id', ({ params }) => {
    const nft = nfts.find((item) => item.id === params.id)
    return nft
      ? HttpResponse.json(nft)
      : HttpResponse.json({ message: 'NFT não encontrado' }, { status: 404 })
  }),
  http.get('/api/nfts', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.trim().toLowerCase() ?? ''
    const category = url.searchParams.get('category')?.trim().toLowerCase() ?? ''
    const network = url.searchParams.get('network')?.trim().toLowerCase() ?? ''
    const minPrice = url.searchParams.get('minPrice')
    const maxPrice = url.searchParams.get('maxPrice')
    const sort = url.searchParams.get('sort')
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.min(24, Math.max(1, Number(url.searchParams.get('pageSize')) || 12))
    const searchFiltered = nfts.filter((nft) => {
      const matchesSearch = `${nft.name} ${nft.collection} ${nft.creator}`
        .toLowerCase()
        .includes(search)

      return matchesSearch
    })
    const minWei = minPrice ? ethToWei(minPrice) : undefined
    const maxWei = maxPrice ? ethToWei(maxPrice) : undefined
    const filtered = category
      ? searchFiltered.filter((nft) => nft.category.toLowerCase() === category)
      : searchFiltered
    const networkFiltered = network
      ? filtered.filter((nft) => nft.network.toLowerCase() === network)
      : filtered
    const priceFiltered = networkFiltered.filter((nft) => {
      const price = ethToWei(nft.priceEth)
      return (minWei === undefined || price >= minWei) &&
        (maxWei === undefined || price <= maxWei)
    })
    const sorted = [...priceFiltered]
    if (sort === 'recent') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sort === 'popular') sorted.sort((a, b) => b.sales - a.sales)
    if (sort === 'price-low' || sort === 'price-high') {
      sorted.sort((a, b) => {
        const left = ethToWei(a.priceEth)
        const right = ethToWei(b.priceEth)
        if (left === right) return 0
        const ascending = left < right ? -1 : 1
        return sort === 'price-low' ? ascending : -ascending
      })
    }
    const byPrice = [...nfts].sort((a, b) => {
      const left = ethToWei(a.priceEth)
      const right = ethToWei(b.priceEth)
      return left < right ? -1 : left > right ? 1 : 0
    })
    const body: NFTListResponse = {
      items: sorted.slice((page - 1) * pageSize, page * pageSize),
      featuredNFT,
      total: sorted.length,
      page,
      pageSize,
      categoryCounts,
      networkCounts,
      priceRange: {
        minEth: byPrice[0]?.priceEth ?? '0',
        maxEth: byPrice.at(-1)?.priceEth ?? '0',
      },
    }

    return HttpResponse.json(body)
  }),
]
