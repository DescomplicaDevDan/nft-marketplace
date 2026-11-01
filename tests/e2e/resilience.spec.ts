import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByRole('heading', { name: 'Ambiente de demonstração' })).toBeVisible()
  await page.evaluate(async () => { await fetch('/api/demo/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }) })
})

test('aviso de carrinho desaparece sem remover os itens', async ({ page }) => {
  await page.goto('/nft/nft-001')
  await page.getByRole('button', { name: 'COMPRAR', exact: true }).click()
  const notice = page.locator('.commerce-cart-toast')
  await expect(notice).toHaveText('Carrinho atualizado.')
  await expect(notice).toHaveCount(0, { timeout: 5000 })
  await page.goto('/cart')
  await expect(page.locator('.cart-table tbody tr')).toHaveCount(1)
  await expect(page.locator('.cart-summary-total')).toContainText('1.206 ETH')
})

test('rota inexistente informa o erro e oferece retorno ao início', async ({ page }) => {
  await page.goto('/rota-inexistente')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
})

test('cadastro válido cria sessão e mantém a nova conta após refresh', async ({ page }) => {
  await page.goto('/profile')
  await page.locator('.auth-tabs button').nth(1).click()
  await page.locator('#register-username').fill('novo_colecionador')
  await page.locator('#login-email').fill('novo@kurio.demo')
  await page.locator('#login-password').fill('NovaConta123!')
  await page.locator('#register-confirm-password').fill('NovaConta123!')
  await page.locator('.auth-submit').click()
  await expect(page.getByLabel('Nome de usuário', { exact: false })).toHaveValue('novo_colecionador')
  await page.reload()
  await expect(page.locator('.profile-form').getByRole('textbox', { name: 'E-mail' })).toHaveValue('novo@kurio.demo')
})

test('carregamento lento apresenta skeleton e erro permite recuperação', async ({ page }) => {
  await page.evaluate(async () => {
    const { config } = await (await fetch('/api/demo/scenario')).json()
    await fetch('/api/demo/scenario', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...config, scenario: 'server-error', pathPrefix: '/api/nfts', method: 'GET', delayMs: 1500, once: false }) })
  })
  await page.goto('/')
  await expect(page.locator('.desktop-home .kurio-skeleton').first()).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível' }).first()).toBeVisible({ timeout: 15000 })
  await page.evaluate(async () => {
    const { config } = await (await fetch('/api/demo/scenario')).json()
    await fetch('/api/demo/scenario', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...config, scenario: 'normal' }) })
  })
  await page.getByRole('button', { name: 'Tentar novamente' }).filter({ visible: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' }).filter({ visible: true }).first()).toBeVisible()
})

test('diálogo recebe foco, permite teclado e devolve foco ao fechar', async ({ page }) => {
  await page.goto('/')
  const trigger = page.locator('.desktop-home .auth-trigger')
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Tab')
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('filtros combinados e paginação sobrevivem a refresh e histórico', async ({ page }) => {
  await page.goto('/?category=Música&network=Ethereum&sort=price-low&page=2')
  await expect(page.locator('#catalog-sort')).toHaveValue('price-low')
  await page.reload()
  await expect(page).toHaveURL(/page=2/)
  await page.getByRole('button', { name: /^Polygon/ }).click()
  await expect(page).toHaveURL(/page=1/)
  await expect(page).toHaveURL(/network=Polygon/)
  await page.goBack()
  await expect(page).toHaveURL(/network=Ethereum/)
  await expect(page).toHaveURL(/page=2/)
})
