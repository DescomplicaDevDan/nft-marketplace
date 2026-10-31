import { api } from '@/lib/api'

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
  if (!localStorage.getItem(TOKEN_KEY)) return null
  try {
    const { data } = await api.get<{ user: SessionUser }>('/auth/me')
    return data.user
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }
    throw error
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    localStorage.removeItem(TOKEN_KEY)
  }
}
