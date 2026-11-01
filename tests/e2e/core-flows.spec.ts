import { expect, test } from '@playwright/test'
import type { NFTListResponse } from '../../src/features/catalog/types'
import { ethToWei, weiToEth } from '../../src/lib/eth'

test('perfil, avatar, senha e carteiras persistem com validação da API', async ({ page }) => {
  test.setTimeout(60000)
  await page.goto('/profile')
  await page.locator('#login-email').fill('colecionador@kurio.demo')
  await page.locator('#login-password').fill('Kurio123!')
  await page.locator('.auth-submit').click()
  await page.getByLabel('Nome de exibição').fill('Colecionador Testado')
  await page.getByLabel('Apelido da carteira').fill('Principal')
  await page.getByRole('textbox', { name: 'Nome ENS', exact: true }).fill('colecionador')
  await page.locator('input[type="file"]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') })
  await page.locator('input[name="currentPassword"]').fill('Incorreta123!')
  await page.locator('input[name="newPassword"]').fill('NovaSenha123!')
  await page.locator('input[name="confirmPassword"]').fill('NovaSenha123!')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.locator('.profile-message')).toContainText('senha atual está incorreta')
  await page.locator('input[name="currentPassword"]').fill('Kurio123!')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.locator('.profile-message')).toHaveText('Perfil e senha atualizados.')
  await page.reload()
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador Testado')
  await expect(page.getByAltText('Avatar do perfil')).toBeVisible()
  await page.locator('.profile-exit').click()
  await expect(page.locator('.auth-trigger')).toContainText('Entrar')
  await page.goto('/wallets')
  await page.locator('#login-email').fill('colecionador@kurio.demo')
  await page.locator('#login-password').fill('NovaSenha123!')
  await page.locator('.auth-submit').click()
  async function fillWallet(id: string, alias: string, address: string) {
    const form = page.locator(id)
    for (const [name, value] of Object.entries({ displayName: 'Colecionador', alias, profileName: 'Perfil', address, referral: 'KURIO', email: 'colecionador@kurio.demo', ens: 'colecionador' })) await form.locator(`input[name="${name}"]`).fill(value)
    await form.locator('select[name="network"]').selectOption('Ethereum')
    await form.locator('select[name="type"]').selectOption('MetaMask')
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
  }
  await fillWallet('#primary-wallet', 'Principal', 'invalido')
  await expect(page.locator('.profile-message')).not.toHaveText('Carteiras atualizadas.')
  await fillWallet('#primary-wallet', 'Principal', '0x1111111111111111111111111111111111111111')
  await expect(page.locator('.profile-message')).toHaveText('Carteiras atualizadas.')
  await page.locator('.wallet-secondary-heading').getByRole('button', { name: 'Adicionar' }).click()
  await fillWallet('#secondary-wallet', 'Reserva', '0x2222222222222222222222222222222222222222')
  await expect(page.locator('.profile-message')).toHaveText('Carteiras atualizadas.')
  await page.reload()
  await expect(page.locator('#primary-wallet input[name="alias"]')).toHaveValue('Principal')
  await expect(page.locator('#secondary-wallet input[name="alias"]')).toHaveValue('Reserva')
})

test('favorito otimista sofre rollback após erro e permite recuperação', async ({ page }) => {
  await page.goto('/profile')
  await page.locator('#login-email').fill('colecionador@kurio.demo')
  await page.locator('#login-password').fill('Kurio123!')
  await page.locator('.auth-submit').click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await page.goto('/nft/nft-001')
  const favorite = page.locator('.desktop-nft-detail').getByRole('button', { name: /Favoritar|Favoritado/ })
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await page.evaluate(async () => {
    const { config } = await (await fetch('/api/demo/scenario')).json()
    const response = await fetch('/api/demo/scenario', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, scenario: 'server-error', pathPrefix: '/api/favorites', method: 'PUT', failureRate: 1, delayMs: 1500, once: true }),
    })
    if (!response.ok) throw new Error('Falha ao configurar cenário')
  })
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('alert').filter({ hasText: 'A alteração foi desfeita' })).toBeVisible()
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('status').filter({ hasText: 'NFT salvo nos favoritos.' })).toBeVisible()
  await page.reload()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
})

for (const outcome of ['confirmed', 'rejected', 'timeout', 'mobile', 'expired', 'reconnect', 'repriced', 'exhausted', 'wallet-refused'] as const) {
  test(`compra pela interface: pagamento ${outcome} e estado do carrinho`, async ({ page }) => {
    test.setTimeout(60000)
    if (outcome === 'mobile') {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')
      await page.getByRole('link', { name: 'Ver Emerald Ape #042', exact: true }).click()
      await page.getByRole('button', { name: 'Comprar NFT', exact: true }).click()
      await expect(page).toHaveURL(/\/cart/)
      await page.getByRole('link', { name: 'Conectar e finalizar', exact: true }).click()
    } else {
      await page.goto('/nft/nft-001')
      await page.getByRole('button', { name: 'COMPRAR', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Carrinho atualizado' })).toBeVisible()
      await page.goto('/checkout')
    }
    await page.locator('#login-email').fill('colecionador@kurio.demo')
    await page.locator('#login-password').fill('Kurio123!')
    await page.locator('.auth-submit').click()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    test.setTimeout(60000)
    if (outcome === 'mobile') {
      await page.getByRole('button', { name: 'Editar dados do colecionador' }).focus()
      await page.keyboard.press('Enter')
    }
    for (const [name, value] of Object.entries({ displayName: 'Colecionador', username: 'colecionador', profileName: 'Colecionador', walletAddress: '0x1111111111111111111111111111111111111111', referral: 'KURIO', email: 'colecionador@kurio.demo', ens: 'colecionador' })) {
      await page.locator(`.checkout-fields input[name="${name}"]`).fill(value)
    }
    await page.locator('select[name="network"]').selectOption('Ethereum')
    if (outcome === 'wallet-refused') {
      await page.locator('.checkout-connection select').selectOption('reject')
      await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Conexão recusada' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
      await page.locator('.checkout-connection select').selectOption('accept')
    }
    await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
    if (outcome !== 'mobile') await expect(page.locator('.checkout-connected-message')).toBeVisible()
    if (outcome !== 'mobile' && outcome !== 'expired' && outcome !== 'reconnect' && outcome !== 'repriced' && outcome !== 'exhausted' && outcome !== 'wallet-refused') await page.locator('.checkout-payment-scenario select').selectOption(outcome)
    await expect(page.locator('.checkout-total')).toContainText('1.206 ETH')
    if (outcome === 'expired') {
      await page.evaluate(async () => {
        const response = await fetch('/api/auth/expire', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` } })
        if (!response.ok) throw new Error('Não foi possível expirar a sessão de teste')
      })
      await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
      await expect(page.locator('dialog[open]')).toBeVisible()
      await page.locator('#login-email').fill('colecionador@kurio.demo')
      await page.locator('#login-password').fill('Kurio123!')
      await page.locator('.auth-submit').click()
      await expect(page.locator('dialog[open]')).toHaveCount(0)
      await expect(page.locator('.checkout-fields input[name="displayName"]')).toHaveValue('Colecionador')
      await expect(page.locator('.checkout-items li')).toHaveCount(1)
      if (outcome === 'wallet-refused') {
      await page.locator('.checkout-connection select').selectOption('reject')
      await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Conexão recusada' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
      await page.locator('.checkout-connection select').selectOption('accept')
    }
    await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
      await expect(page.locator('.checkout-connected-message')).toBeVisible()
    }
    if (outcome === 'exhausted') {
      await page.evaluate(async () => {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` }
        await fetch('/api/demo/nfts/nft-001', { method: 'POST', headers, body: JSON.stringify({ available: 0, delivery: 'duplicate' }) })
      })
      await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
      await expect(page.getByRole('alert').first()).toBeVisible()
      const orders = await page.evaluate(async () => (await fetch('/api/orders', { headers: { Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` } })).json())
      expect(orders).toHaveLength(0)
      return
    }
    if (outcome === 'repriced') {
      const stale = await page.evaluate(async () => {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` }
        const quote = await (await fetch('/api/cart/quote', { method: 'POST', headers })).json()
        const { connection } = await (await fetch('/api/wallet-connection', { headers })).json()
        await fetch('/api/demo/nfts/nft-001', { method: 'POST', headers, body: JSON.stringify({ priceEth: '1.25', delivery: 'duplicate' }) })
        const response = await fetch('/api/orders', { method: 'POST', headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ quoteId: quote.id, connectionId: connection.id, wallet: connection, collector: { displayName: 'Colecionador', username: 'colecionador', email: 'colecionador@kurio.demo', profileName: 'Colecionador', referral: 'KURIO', ens: 'colecionador.eth', notes: '' }, scenario: 'confirmed' }) })
        return { status: response.status, body: await response.json(), orders: await (await fetch('/api/orders', { headers })).json() }
      })
      expect(stale.status).toBe(409)
      expect(stale.body.code).toBe('quote_changed')
      expect(stale.orders).toHaveLength(0)
      await expect(page.locator('.checkout-total')).toContainText('1.266 ETH')
      await expect(page).toHaveURL(/checkout/)
    }
    const submitted = page.waitForRequest((request) => request.url().endsWith('/api/orders') && request.method() === 'POST')
    await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: 'Confirmar compra', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); button.click() })
    const originalRequest = await submitted
    if (outcome === 'reconnect') {
      await expect(page.getByRole('heading', { name: 'Seu pedido está em processamento' })).toBeVisible()
      const pendingUrl = page.url()
      await page.evaluate(async () => {
        await fetch('/api/demo/realtime/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` }, body: JSON.stringify({ durationMs: 5000 }) })
      })
      await page.reload()
      await expect(page).toHaveURL(pendingUrl)
    }
    await expect(page).toHaveURL(/\/orders\//, { timeout: 15000 })
    const title = outcome !== 'rejected' ? 'Seu pedido foi confirmado' : 'Pagamento recusado'
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    const receiptUrl = page.url()
    if (outcome === 'confirmed') {
      await page.evaluate(async () => {
        await fetch('/api/demo/nfts/nft-001', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` }, body: JSON.stringify({ priceEth: '9.99' }) })
      })
      await page.reload()
      await expect(page.locator('.confirmation-totals')).toContainText('1.206 ETH')
    }
    const duplicate = await page.evaluate(async ({ headers, body }) => {
      const response = await fetch('/api/orders', { method: 'POST', headers, body })
      const order = await response.json()
      const orders = await (await fetch('/api/orders', { headers })).json()
      return { status: response.status, id: order.id, count: orders.length }
    }, { headers: originalRequest.headers(), body: originalRequest.postData() })
    expect(duplicate.status).toBeLessThan(300)
    expect(receiptUrl).toContain(duplicate.id)
    expect(duplicate.count).toBe(1)
    if (outcome === 'reconnect') {
      await page.evaluate(async (id) => {
        await fetch(`/api/demo/orders/${id}/events`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` } })
      }, duplicate.id)
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
    }
    await page.reload()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page).toHaveURL(receiptUrl)
    await page.goto('/cart')
    if (outcome !== 'rejected') await expect(page.locator('.cart-empty')).toBeVisible()
    else await expect(page.locator('.cart-table tbody tr')).toHaveCount(1)
    if (outcome === 'confirmed') {
      await page.locator('.auth-trigger').click()
      await expect(page.locator('.auth-trigger')).toContainText('Entrar')
      await page.goto('/profile')
      await page.locator('#login-email').fill('sato@kurio.demo')
      await page.locator('#login-password').fill('Sato123!')
      await page.locator('.auth-submit').click()
      await expect(page.getByLabel('Nome de usuário', { exact: false })).toHaveValue('sato')
      await page.goto(receiptUrl)
      await expect(page.getByRole('heading', { name: 'Pedido não encontrado', exact: true })).toBeVisible()
      await expect(page.locator('.confirmation-items')).toHaveCount(0)
      const denied = await page.evaluate(async (id) => {
        const headers = { Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` }
        const response = await fetch(`/api/orders/${id}`, { headers })
        const orders = await (await fetch('/api/orders', { headers })).json()
        return { status: response.status, orders }
      }, duplicate.id)
      expect(denied.status).toBe(404)
      expect(denied.orders).toEqual([])
      await page.reload()
      await expect(page.getByRole('heading', { name: 'Pedido não encontrado', exact: true })).toBeVisible()
      await page.goto('/profile')
      await page.locator('.auth-trigger').click()
      await expect(page.locator('.auth-trigger')).toContainText('Entrar')
      await page.goto(receiptUrl)
      await page.locator('#login-email').fill('colecionador@kurio.demo')
      await page.locator('#login-password').fill('Kurio123!')
      await page.locator('.auth-submit').click()
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
      await expect(page.locator('.confirmation-totals')).toContainText('1.206 ETH')
    }
  })
}

test('troca de usuário isola perfil e favoritos e preserva a conta original', async ({ page }) => {
  async function login(email: string, password: string, username: string) {
    await page.goto('/profile')
    await page.locator('#login-email').fill(email)
    await page.locator('#login-password').fill(password)
    await page.locator('.auth-submit').click()
    await expect(page.getByLabel('Nome de usuário', { exact: false })).toHaveValue(username)
  }
  await login('colecionador@kurio.demo', 'Kurio123!', 'colecionador')
  await page.goto('/nft/nft-001')
  const favorite = page.locator('.desktop-nft-detail').getByRole('button', { name: /Favoritar|Favoritado/ })
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await page.locator('.auth-trigger').click()
  await expect(page.locator('.auth-trigger')).toContainText('Entrar')
  await login('sato@kurio.demo', 'Sato123!', 'sato')
  await page.goto('/nft/nft-001')
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await page.locator('.auth-trigger').click()
  await expect(page.locator('.auth-trigger')).toContainText('Entrar')
  await login('colecionador@kurio.demo', 'Kurio123!', 'colecionador')
  await page.goto('/nft/nft-001')
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
})

test('sessão persiste e logout remove acesso ao perfil privado', async ({ page }) => {
  await page.goto('/profile')
  await page.locator('#login-email').fill('colecionador@kurio.demo')
  await page.locator('#login-password').fill('Kurio123!')
  await page.locator('.auth-submit').click()
  await expect(page.getByLabel('Nome de usuário', { exact: false })).toHaveValue('colecionador')
  await page.reload()
  await expect(page.locator('.auth-trigger')).toContainText('Sair')
  await expect(page.getByLabel('Nome de usuário', { exact: false })).toHaveValue('colecionador')
  await page.locator('.auth-trigger').click()
  await expect(page.locator('.auth-trigger')).toContainText('Entrar')
  await page.goto('/profile')
  await expect(page.locator('dialog[open]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toHaveCount(0)
})

test('evento de preço atualiza edições, carrinho e cotação sem recarregar', async ({ page }) => {
  await page.goto('/nft/nft-001')
  await expect(page.locator('.nft-detail-price')).toHaveText('1.19 ETH')
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carrinho atualizado' })).toBeVisible()
  await page.goto('/cart')
  await expect(page.locator('.cart-price')).toHaveText('1.19 ETH')
  await expect(page.locator('.cart-summary-total')).toContainText('1.206 ETH')
  const result = await page.evaluate(async () => {
    const headers = { 'Content-Type': 'application/json', 'X-Guest-Cart': localStorage.getItem('kurio-guest-cart-id') ?? '' }
    async function json(url: string, init?: RequestInit) {
      const response = await fetch(url, init)
      if (!response.ok) throw new Error(`${url}: ${response.status}`)
      return response.json()
    }
    const before = await json('/api/nfts/nft-001')
    const oldQuote = await json('/api/cart/quote', { method: 'POST', headers })
    const updated = await json('/api/demo/nfts/nft-001', { method: 'POST', headers, body: JSON.stringify({ priceEth: '1.250000000000000001', delivery: 'out-of-order' }) })
    return { before, updated, oldQuoteId: oldQuote.id }
  })
  for (const edition of result.before.editions) {
    const expected = weiToEth(ethToWei(edition.priceEth) * ethToWei('1.250000000000000001') / ethToWei(result.before.priceEth))
    expect(result.updated.editions.find((item: { id: string }) => item.id === edition.id).priceEth).toBe(expected)
  }
  await expect(page.getByRole('status').filter({ hasText: 'Preço ou estoque de um NFT do carrinho mudou' })).toBeVisible()
  await expect(page.locator('.cart-price')).toHaveText('1.250000000000000001 ETH')
  await expect(page.locator('.cart-summary-total')).toContainText('1.266000000000000001 ETH')
  const quote = await page.evaluate(async () => (await fetch('/api/cart/quote', { method: 'POST', headers: { 'X-Guest-Cart': localStorage.getItem('kurio-guest-cart-id') ?? '' } })).json())
  expect(quote.id).not.toBe(result.oldQuoteId)
  expect(quote.items[0].priceEth).toBe('1.250000000000000001')
  await page.goto('/nft/nft-001')
  await expect(page.locator('.nft-detail-price')).toHaveText('1.250000000000000001 ETH')
  await page.goto('/')
  await expect(page.locator('.desktop-home li').filter({ has: page.getByRole('heading', { name: 'Emerald Ape #042' }) })).toContainText('1.250000000000000001 ETH')
})

test('contagens de todas as coleções e redes correspondem ao catálogo completo', async ({ page }) => {
  await expect(page.locator('#catalog-sort')).toBeVisible()
  const checks = await page.evaluate(async () => {
    async function list(params: Record<string, string> = {}): Promise<NFTListResponse> {
      const response = await fetch(`/api/nfts?${new URLSearchParams({ pageSize: '24', ...params })}`)
      if (!response.ok) throw new Error(`Erro no catálogo: ${response.status}`)
      return response.json()
    }
    const first = await list()
    const all = [...first.items]
    for (let page = 2; all.length < first.total; page++) all.push(...(await list({ page: String(page) })).items)
    const checks = []
    for (const item of first.categoryCounts) checks.push({ dimension: 'category', name: item.name, displayed: item.count, actual: all.filter((nft) => nft.category === item.name).length, filtered: (await list({ category: item.name })).total })
    for (const item of first.networkCounts) checks.push({ dimension: 'network', name: item.name, displayed: item.count, actual: all.filter((nft) => nft.network === item.name).length, filtered: (await list({ network: item.name })).total })
    return checks
  })
  for (const check of checks) {
    expect(check.displayed, `${check.dimension}: ${check.name}`).toBe(check.actual)
    expect(check.filtered, `${check.name}: resultado do filtro`).toBe(check.actual)
  }
})

test.beforeEach(async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByRole('heading', { name: 'Ambiente de demonstração' })).toBeVisible()
  await page.evaluate(async () => {
    const response = await fetch('/api/demo/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'normal' }),
    })
    if (!response.ok) throw new Error(`Falha ao restaurar o cenário: ${response.status}`)
  })
  await page.goto('/')
})

test('busca atualiza a URL e um detalhe pode ser aberto diretamente', async ({ page }) => {
  await page.getByRole('button', { name: 'Abrir busca' }).click()
  await page.locator('#nft-search').fill('Neon Vessel')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page).toHaveURL(/search=Neon\+Vessel/)
  await expect(page.getByRole('heading', { name: 'Neon Vessel #552' })).toBeVisible()

  await page.goto('/nft/nft-001')
  await expect(page.locator('.desktop-nft-detail').getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.goto('/nft/nft-missing')
  await expect(page.locator('.desktop-nft-detail').getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
})

test('filtros e ordenação atualizam os parâmetros do catálogo', async ({ page }) => {
  await page.getByRole('button', { name: 'Arte digital' }).click()
  await page.locator('#catalog-sort').selectOption('price-low')
  await expect(page).toHaveURL(/category=Arte\+digital/)
  await expect(page).toHaveURL(/sort=price-low/)
  await expect(page.getByRole('tab', { name: 'Todos os NFTs' })).toHaveAttribute('aria-selected', 'false')
})

test('estoque, preço e linha do carrinho são independentes por edição', async ({ page }) => {
  await page.goto('/nft/nft-001')
  const editionButtons = page.locator('.nft-detail-info button[title$="disponíveis"]')
  await expect(editionButtons).toHaveCount(4)

  await page.getByRole('button', { name: '1/50' }).click()
  await expect(page.locator('.nft-detail-price')).toHaveText('1.19 ETH')
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carrinho atualizado' })).toBeVisible()

  await page.getByRole('button', { name: 'ABERTA' }).click()
  await expect(page.locator('.nft-detail-price')).toHaveText('0.89 ETH')
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carrinho atualizado' })).toBeVisible()

  await page.goto('/cart')
  const rows = page.locator('.cart-table tbody tr')
  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0)).toContainText('Edição: 1/50')
  await expect(rows.nth(0)).toContainText('1.19 ETH')
  await expect(rows.nth(1)).toContainText('Edição: ABERTA')
  await expect(rows.nth(1)).toContainText('0.89 ETH')
  await expect(page.locator('.cart-count-badge')).toHaveText('2')
  await rows.nth(0).getByRole('button', { name: /^Aumentar edições/ }).click()
  await expect(page.locator('.cart-count-badge')).toHaveText('3')
  await rows.nth(0).getByRole('button', { name: /^Remover / }).click()
  await expect(page.locator('.cart-count-badge')).toHaveText('1')
  await rows.nth(0).getByRole('button', { name: /^Remover / }).click()
  await expect(page.locator('.cart-count-badge')).toHaveCount(0)
})

test('cupom é validado pela cotação e permanece no estado após atualizar', async ({ page }) => {
  await page.goto('/nft/nft-001')
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await page.goto('/cart')
  await page.getByLabel('Código promocional').fill('INVALIDO')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.locator('#cart-promo-message')).toContainText('inválido')
  await page.getByLabel('Código promocional').fill('EXPIRADO')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.locator('#cart-promo-message')).toContainText('expirou')
  await page.getByLabel('Código promocional').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.locator('#cart-promo-message')).toContainText('Cupom aplicado.')
  await expect(page.locator('.cart-applied-coupon')).toContainText('KURIO10')
  await page.reload()
  await expect(page.locator('.cart-applied-coupon')).toContainText('KURIO10')
})

test('login restaura o acesso à rota protegida sem recarregar', async ({ page }) => {
  await page.goto('/profile')
  await page.locator('dialog[open]').waitFor()
  await page.locator('#login-email').fill('colecionador@kurio.demo')
  await page.locator('#login-password').fill('Kurio123!')
  await page.locator('.auth-submit').click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page.locator('.auth-trigger')).toContainText('Sair')
})

test('cadastro apresenta conflito devolvido pela API simulada', async ({ page }) => {
  await page.goto('/profile')
  await page.locator('dialog[open]').waitFor()
  await page.locator('.auth-tabs button').nth(1).click()
  await page.locator('#register-username').fill('colecionador')
  await page.locator('#login-email').fill('colecionador@kurio.demo')
  await page.locator('#login-password').fill('SenhaNova123!')
  await page.locator('#register-confirm-password').fill('SenhaNova123!')
  await page.locator('.auth-submit').click()
  await expect(page.locator('.auth-message')).toContainText('já está cadastrado')
})

test('login e cadastro mobile ocupam a viewport inteira', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/profile')
  const dialog = page.locator('dialog[open]')
  await dialog.waitFor()
  await expect(page.locator('.auth-mobile-title')).toHaveText('Entrar')
  await expect.poll(async () => dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)]
  })).toEqual([0, 0, 390, 844])
  await page.getByRole('button', { name: 'Crie uma conta' }).click()
  await expect(page.locator('.auth-mobile-title')).toHaveText('Criar perfil de colecionador')
  await expect.poll(async () => dialog.evaluate((element) => Math.round(element.getBoundingClientRect().height))).toBe(844)
})
