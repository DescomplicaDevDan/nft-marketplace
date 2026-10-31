import { delay, http, HttpResponse } from 'msw'
import { DEFAULT_SCENARIO, SCENARIOS, type ScenarioConfig, type ScenarioState } from '@/features/demo/types'
import { categoryCounts, featuredNFT, networkCounts } from './data/nfts'

const KEY = 'kurio-demo-scenario'
let epoch = 0
export function readScenario(): ScenarioState {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (value?.config && valid(value.config) && Number.isSafeInteger(value.counter) && value.counter >= 0) return value
  } catch { /* Restore a known, healthy scenario when saved configuration is invalid. */ }
  return { config: { ...DEFAULT_SCENARIO }, counter: 0, consumed: false }
}

function valid(value: ScenarioConfig) {
  return SCENARIOS.includes(value.scenario) && typeof value.pathPrefix === 'string' && value.pathPrefix.startsWith('/api/') && value.pathPrefix.length < 150 && ['ALL', 'GET', 'POST', 'PUT', 'DELETE'].includes(value.method) && Number.isSafeInteger(value.seed) && value.seed >= 0 && value.seed <= 0xffffffff && Number.isFinite(value.delayMs) && value.delayMs >= 0 && value.delayMs <= 15000 && Number.isFinite(value.failureRate) && value.failureRate >= 0 && value.failureRate <= 1 && typeof value.once === 'boolean'
}

function random(seed: number, index: number) {
  let value = (seed + Math.imul(index, 0x9e3779b9)) | 0
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad)
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97)
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296
}

function revoke(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return
  const state = JSON.parse(localStorage.getItem('kurio-auth-mock-db') ?? '{}')
  if (state.sessions?.[token]) {
    delete state.sessions[token]
    localStorage.setItem('kurio-auth-mock-db', JSON.stringify(state))
  }
}

function reset() {
  epoch++
  const keys = ['kurio-auth-mock-db', 'kurio-mock-favorites', 'kurio-mock-wallets', 'kurio-mock-wallet-connections', 'kurio-mock-carts', 'kurio-mock-commerce-v1', 'kurio-session-token', 'kurio-guest-cart-id', 'kurio-commerce', 'kurio-profile', 'kurio-wallets', KEY]
  for (const key of keys) localStorage.removeItem(key)
  for (const key of Object.keys(localStorage)) if (key.startsWith('kurio-order-attempt:')) localStorage.removeItem(key)
  for (const key of Object.keys(sessionStorage)) if (key.startsWith('kurio-checkout-draft:')) sessionStorage.removeItem(key)
}

export const scenarioHandlers = [
  http.get('/api/demo/scenario', () => HttpResponse.json(readScenario())),
  http.put('/api/demo/scenario', async ({ request }) => {
    const config = await request.json().catch(() => null) as ScenarioConfig | null
    if (!config || !valid(config)) return HttpResponse.json({ message: 'Confira cenário, caminho, método, seed, atraso e probabilidade.' }, { status: 400 })
    const state: ScenarioState = { config, counter: 0, consumed: false }
    localStorage.setItem(KEY, JSON.stringify(state))
    return HttpResponse.json(state)
  }),
  http.post('/api/demo/reset', async ({ request }) => {
    const input = await request.json().catch(() => ({})) as Partial<ScenarioConfig>
    const config = { ...DEFAULT_SCENARIO, ...input }
    if (!valid(config)) return HttpResponse.json({ message: 'Configuração inicial inválida.' }, { status: 400 })
    reset()
    const state: ScenarioState = { config, counter: 0, consumed: false }
    localStorage.setItem(KEY, JSON.stringify(state))
    return HttpResponse.json({ ...state, reset: true })
  }),
  http.all('/api/*', async ({ request }) => {
    const url = new URL(request.url)
    // Control endpoints remain usable to leave an offline/error scenario.
    if (url.pathname.startsWith('/api/demo/') || /\/auth\/(login|logout)$/.test(url.pathname)) return
    const state = readScenario()
    const config = state.config
    if (config.scenario === 'normal' || !url.pathname.startsWith(config.pathPrefix) || (config.method !== 'ALL' && config.method !== request.method) || (config.once && state.consumed)) return
    if (config.scenario === 'session-expired' && (!request.headers.get('authorization') || url.pathname === '/api/auth/signup')) return
    const index = ++state.counter
    const selected = random(config.seed, index) < config.failureRate
    if (selected) state.consumed = true
    localStorage.setItem(KEY, JSON.stringify(state))
    if (!selected) return
    const generation = epoch
    if (config.scenario === 'latency') await delay(Math.round(config.delayMs * (0.5 + random(config.seed, index + 10000))))
    else if (config.scenario === 'out-of-order') await delay(index % 2 ? Math.max(1000, config.delayMs * 3) : 30)
    else if (config.scenario === 'timeout') await delay(10000)
    else if (config.delayMs) await delay(config.delayMs)
    if (generation !== epoch) return HttpResponse.error()
    switch (config.scenario) {
      case 'offline': case 'timeout': return HttpResponse.error()
      case 'server-error': return HttpResponse.json({ message: 'Falha temporária simulada. Tente novamente.', code: 'transient_error' }, { status: 503 })
      case 'validation-error': return HttpResponse.json({ message: 'Os dados foram recusados pelo cenário de validação.', code: 'validation_error', errors: { form: 'Revise os campos e tente novamente.' } }, { status: 400 })
      case 'session-expired': revoke(request); return HttpResponse.json({ message: 'Sua sessão expirou. Entre novamente.', code: 'session_expired' }, { status: 401 })
      case 'signup-conflict':
        if (url.pathname === '/api/auth/signup' && request.method === 'POST') return HttpResponse.json({ message: 'Este e-mail ou nome de usuário já está cadastrado.', code: 'signup_conflict' }, { status: 409 })
        return
      case 'empty':
        if (url.pathname === '/api/nfts' && request.method === 'GET') return HttpResponse.json({ items: [], total: 0, featuredNFT, page: Math.max(1, Number(url.searchParams.get('page')) || 1), pageSize: Math.min(24, Math.max(1, Number(url.searchParams.get('pageSize')) || 12)), categoryCounts: categoryCounts.map((item) => ({ ...item, count: 0 })), networkCounts: networkCounts.map((item) => ({ ...item, count: 0 })), priceRange: { minEth: '0', maxEth: '0' } })
        return
      default: return
    }
  }),
]
