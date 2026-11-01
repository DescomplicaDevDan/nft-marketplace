import { defineConfig } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  projects: base.projects?.filter((project) => project.name === 'desktop'),
  grep: /pagamento confirmed|pagamento mobile|evento de preço|perfil, avatar/,
  use: { ...base.use, baseURL: 'https://nft-marketplace-em67.vercel.app' },
  webServer: undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-deployed-report', open: 'never' }]],
})
