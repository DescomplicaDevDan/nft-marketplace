import { http, HttpResponse } from 'msw'
import type { SavedWallets, Wallet } from '@/features/profile/walletApi'
import type { ConnectWallet, WalletConnection } from '@/features/commerce/walletConnection'

const KEY = 'kurio-mock-wallets'
const empty: SavedWallets = { primary: null, secondary: null, same: false }

function read(): Record<string, SavedWallets> {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch { return {} }
}

function validate(value: unknown): value is Wallet {
  if (!value || typeof value !== 'object') return false
  const wallet = value as Wallet
  if (['displayName', 'alias', 'network', 'profileName', 'address', 'type', 'referral', 'email', 'ens'].some((key) => typeof wallet[key as keyof Wallet] !== 'string' || !wallet[key as keyof Wallet].trim())) return false
  if (typeof wallet.secondaryAddress !== 'string' || !['Ethereum', 'Polygon', 'Solana'].includes(wallet.network) || !['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(wallet.type) || !/^\S+@\S+\.\S+$/.test(wallet.email)) return false
  return wallet.network === 'Solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.address) : /^0x[0-9a-fA-F]{40}$/.test(wallet.address)
}

const CONNECTION_KEY = 'kurio-mock-wallet-connections'
function connections(): Record<string, WalletConnection> {
  try {
    const value = JSON.parse(localStorage.getItem(CONNECTION_KEY) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch { return {} }
}

export function sessionWalletConnection(request: Request) {
  return connections()[request.headers.get('authorization') ?? ''] ?? null
}

export function walletHandlers(userId: (request: Request) => string | undefined) {
  return [
    http.get('/api/wallet-connection', ({ request }) => {
      if (!userId(request)) return HttpResponse.json({ message: 'Entre para conectar uma carteira.' }, { status: 401 })
      const token = request.headers.get('authorization') ?? ''
      return HttpResponse.json({ connection: connections()[token] ?? null })
    }),
    http.post('/api/wallet-connection', async ({ request }) => {
      const id = userId(request)
      if (!id) return HttpResponse.json({ message: 'Entre para conectar uma carteira.' }, { status: 401 })
      const body = await request.json().catch(() => null) as ConnectWallet | null
      if (!body || !['accept', 'reject'].includes(body.outcome) || (body.slot !== undefined && !['primary', 'secondary'].includes(body.slot))) return HttpResponse.json({ message: 'Confira os dados da conexão.' }, { status: 400 })
      const saved = read()[id] ?? empty
      const wallet = body.slot === 'primary' ? saved.primary : body.slot === 'secondary' ? saved.same ? saved.primary : saved.secondary : null
      if (body.slot && !wallet) return HttpResponse.json({ message: 'A carteira salva não está mais disponível. Selecione outra carteira.' }, { status: 404 })
      const address = wallet?.address ?? body.address
      const network = wallet?.network ?? body.network
      const provider = wallet?.type ?? body.provider
      if (typeof address !== 'string' || !['Ethereum', 'Polygon', 'Solana'].includes(network) || !['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(provider) || !(network === 'Solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ : /^0x[0-9a-fA-F]{40}$/).test(address)) return HttpResponse.json({ message: 'Confira a rede, o tipo e o formato do endereço da carteira.' }, { status: 400 })
      if (wallet && (address !== body.address || network !== body.network || provider !== body.provider)) return HttpResponse.json({ message: 'A carteira salva mudou. Selecione-a novamente antes de conectar.' }, { status: 409 })
      if (body.outcome === 'reject') {
        const state = connections()
        delete state[request.headers.get('authorization') ?? '']
        try { localStorage.setItem(CONNECTION_KEY, JSON.stringify(state)) } catch { return HttpResponse.json({ message: 'Não foi possível atualizar a conexão.' }, { status: 507 }) }
        return HttpResponse.json({ message: 'Conexão recusada na carteira. Seus itens foram preservados.', code: 'wallet_rejected' }, { status: 403 })
      }
      const token = request.headers.get('authorization') ?? ''
      const state = connections()
      const previous = state[token]
      const connection = previous?.address === address && previous.network === network && previous.provider === provider ? previous : { id: `connection-${crypto.randomUUID()}`, address, network, provider, connectedAt: new Date().toISOString() }
      state[token] = connection
      try { localStorage.setItem(CONNECTION_KEY, JSON.stringify(state)) } catch { return HttpResponse.json({ message: 'Não foi possível conectar a carteira.' }, { status: 507 }) }
      return HttpResponse.json({ connection })
    }),
    http.delete('/api/wallet-connection', ({ request }) => {
      if (!userId(request)) return HttpResponse.json({ message: 'Entre para gerenciar sua carteira.' }, { status: 401 })
      const state = connections()
      delete state[request.headers.get('authorization') ?? '']
      try { localStorage.setItem(CONNECTION_KEY, JSON.stringify(state)) } catch { return HttpResponse.json({ message: 'Não foi possível desconectar a carteira.' }, { status: 507 }) }
      return HttpResponse.json({ connection: null })
    }),
    http.get('/api/wallets', ({ request }) => {
      const id = userId(request)
      if (!id) return HttpResponse.json({ message: 'Entre para acessar suas carteiras.' }, { status: 401 })
      return HttpResponse.json(read()[id] ?? empty)
    }),
    http.put('/api/wallets', async ({ request }) => {
      const id = userId(request)
      if (!id) return HttpResponse.json({ message: 'Entre para salvar suas carteiras.' }, { status: 401 })
      const body = await request.json().catch(() => null) as SavedWallets | null
      if (!body || typeof body.same !== 'boolean' || (body.primary !== null && !validate(body.primary)) || (body.secondary !== null && !validate(body.secondary)) || (body.same && !body.primary)) {
        return HttpResponse.json({ message: 'Confira os campos obrigatórios, a rede e o endereço. Ethereum/Polygon: 0x + 40 caracteres hexadecimais; Solana: 32 a 44 caracteres Base58. Para reutilizar a principal, salve-a primeiro.' }, { status: 400 })
      }
      const value: SavedWallets = { primary: body.primary, secondary: body.secondary, same: body.same }
      const database = read()
      database[id] = value
      try { localStorage.setItem(KEY, JSON.stringify(database)) } catch { return HttpResponse.json({ message: 'Não foi possível salvar as carteiras.' }, { status: 507 }) }
      return HttpResponse.json(value)
    }),
    http.delete('/api/wallets/:slot', ({ request, params }) => {
      const id = userId(request)
      if (!id) return HttpResponse.json({ message: 'Entre para remover carteiras.' }, { status: 401 })
      if (params.slot !== 'primary' && params.slot !== 'secondary') return HttpResponse.json({ message: 'Carteira não encontrada.' }, { status: 404 })
      const database = read()
      const value = { ...(database[id] ?? empty), [params.slot]: null }
      if (params.slot === 'primary') value.same = false
      database[id] = value
      try { localStorage.setItem(KEY, JSON.stringify(database)) } catch { return HttpResponse.json({ message: 'Não foi possível remover a carteira.' }, { status: 507 }) }
      return HttpResponse.json(value)
    }),
  ]
}
