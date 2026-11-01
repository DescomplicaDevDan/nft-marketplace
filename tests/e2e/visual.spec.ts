import { expect, test } from '@playwright/test'

for (const width of [390, 768, 1440]) {
  test(`regressão visual e overflow em ${width}px`, async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/demo')
    await expect(page.getByRole('heading', { name: 'Ambiente de demonstração' })).toBeVisible()
    await page.evaluate(async () => {
      await fetch('/api/demo/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: 'normal' }) })
    })
    for (const screen of ['home', 'detail', 'cart', 'checkout']) {
      if (screen === 'home') {
        await page.goto('/')
        await expect(page.getByRole('heading', { name: 'Emerald Ape #042' }).filter({ visible: true }).first()).toBeVisible()
      }
      if (screen === 'detail') {
        await page.goto('/nft/nft-001')
        await expect(page.locator(width < 768 ? '.mobile-nft-detail' : '.desktop-nft-detail').getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
      }
      if (screen === 'cart') {
        await page.getByRole('button', { name: width < 768 ? 'Comprar NFT' : 'COMPRAR', exact: true }).click()
        await page.goto('/cart')
        await expect(page.locator('.cart-summary-total')).toContainText('1.206 ETH')
      }
      if (screen === 'checkout') {
        await page.goto('/checkout')
        await page.locator('#login-email').fill('colecionador@kurio.demo')
        await page.locator('#login-password').fill('Kurio123!')
        await page.locator('.auth-submit').click()
        await expect(page.locator('dialog[open]')).toHaveCount(0)
        await expect(page.locator('.checkout-total')).toContainText('1.206 ETH')
      }
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all(Array.from(document.images).filter((image) => image.complete).map((image) => image.decode().catch(() => {})))
      })
      expect(await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter((el) => { const r=el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(el).position !== 'absolute' }).slice(0, 12).map((el) => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })))).toEqual([])
      await expect(page).toHaveScreenshot(`${screen}-${width}.png`, { fullPage: true, animations: 'disabled', mask: [page.locator('.commerce-cart-toast')], maxDiffPixelRatio: 0.01 })
    }
  })
}
