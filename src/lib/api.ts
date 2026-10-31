import axios from 'axios'
import { guestCartId } from './guestCart'

export const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kurio-session-token')
  if (token && !config.headers.has('Authorization')) config.headers.set('Authorization', `Bearer ${token}`)
  if (!config.headers.has('X-Guest-Cart')) config.headers.set('X-Guest-Cart', guestCartId())
  return config
})

api.interceptors.response.use((response) => response, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && !/\/auth\/(login|signup|logout)$/.test(error.config?.url ?? '')) {
    const authorization = String(error.config?.headers?.get('Authorization') ?? '')
    const current = localStorage.getItem('kurio-session-token')
    // A late response from an old session must not invalidate a newer login.
    if (current && authorization === `Bearer ${current}`) {
      localStorage.removeItem('kurio-session-token')
      window.dispatchEvent(new CustomEvent('kurio:session-expired', { detail: { token: current } }))
    }
  }
  return Promise.reject(error)
})
