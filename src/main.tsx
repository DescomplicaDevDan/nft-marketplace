import { AuthProvider } from './features/auth/AuthProvider'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { RouterProvider } from '@tanstack/react-router'
import './index.css'
import { router } from './router'
import { CommerceProvider } from './features/commerce/CommerceProvider'
import { RealtimeProvider } from './features/realtime/RealtimeProvider'

async function startApp() {
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CommerceProvider><RealtimeProvider><RouterProvider router={router} /></RealtimeProvider></CommerceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void startApp()
