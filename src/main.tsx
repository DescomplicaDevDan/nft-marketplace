import { AuthProvider } from './features/auth/AuthProvider'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import './index.css'
import { router } from './router'
import { CommerceProvider } from './features/commerce/CommerceProvider'

const queryClient = new QueryClient()

async function startApp() {
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <CommerceProvider>
          <AuthProvider><RouterProvider router={router} /></AuthProvider>
        </CommerceProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void startApp()
