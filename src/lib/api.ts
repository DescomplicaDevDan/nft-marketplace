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
