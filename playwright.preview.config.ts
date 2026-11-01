import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const baseURL = 'http://127.0.0.1:4175'

// Build with VITE_ENABLE_MOCKS=true before running this production smoke check.
export default defineConfig({
  ...base,
  projects: base.projects?.filter((project) => project.name === 'desktop'),
  grep: /pagamento confirmed|pagamento mobile|evento de preço/,
  use: { ...base.use, baseURL },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4175 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
})
