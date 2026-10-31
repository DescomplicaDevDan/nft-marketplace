import { api } from '@/lib/api'
import { isAxiosError } from 'axios'

export type SessionUser = {
  id: string
  username: string
  email: string
}

type AuthResponse = { user: SessionUser; token: string }

const TOKEN_KEY = 'kurio-session-token'

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  localStorage.setItem(TOKEN_KEY, data.token)
  return data.user
}

export async function register(username: string, email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/signup', { username, email, password })
  localStorage.setItem(TOKEN_KEY, data.token)
  return data.user
}

export async function getSession(): Promise<SessionUser | null> {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  try {
    const { data } = await api.get<{ user: SessionUser }>('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
    if (localStorage.getItem(TOKEN_KEY) !== token) return getSession()
    return data.user
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      const current = localStorage.getItem(TOKEN_KEY)
      if (current && current !== token) return getSession()
      if (current === token) localStorage.removeItem(TOKEN_KEY)
      return null
    }
    throw error
  }
}

export async function logout() {
  const token = localStorage.getItem(TOKEN_KEY)
  try {
    await api.post('/auth/logout', {}, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
  } finally {
    if (localStorage.getItem(TOKEN_KEY) === token) localStorage.removeItem(TOKEN_KEY)
  }
}
