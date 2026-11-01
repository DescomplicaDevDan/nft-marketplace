import { expect, test } from '@playwright/test'
import type { NFTListResponse } from '../../src/features/catalog/types'
import { ethToWei, weiToEth } from '../../src/lib/eth'

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
