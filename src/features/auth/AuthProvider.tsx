import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Fragment, createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import googleIcon from '@/assets/icons/google 1.svg'
import hideIcon from '@/assets/icons/Hide.svg'
import loginIcon from '@/assets/icons/Logout.svg'
import { getSession, login, logout, register, type SessionUser } from './api'
import './auth.css'

type AuthContextValue = {
  openLogin: () => void
  user: SessionUser | null
  loading: boolean
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue | null>(null)
const SESSION_KEY = ['session'] as const

function messageFromError(error: unknown) {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'O login demorou demais. Tente novamente.'
    if (!error.response) return 'Não foi possível acessar a API simulada. Atualize a página e tente novamente.'
    if (error.response.status >= 500) return `Falha na API simulada (HTTP ${error.response.status}). Atualize a página e tente novamente.`
  }
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response
    if (response && typeof response === 'object' && 'data' in response) {
      const data = response.data
      if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') return data.message
    }
  }
  return 'Não foi possível concluir. Tente novamente.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: SESSION_KEY, queryFn: getSession, retry: false, staleTime: 30000, refetchInterval: 30000 })
  const loginMutation = useMutation({ mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password), onSuccess: completeSession })
  const registerMutation = useMutation({ mutationFn: ({ username, email, password }: { username: string; email: string; password: string }) => register(username, email, password), onSuccess: completeSession })
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [message, setMessage] = useState('')
  const [sessionNotice, setSessionNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const form = useRef<HTMLFormElement>(null)

  const clearPrivate = useCallback(() => {
    const predicate = (query: { queryKey: readonly unknown[] }) => !['session', 'nfts', 'nft', 'demo'].includes(String(query.queryKey[0]))
    void queryClient.cancelQueries({ predicate })
    queryClient.removeQueries({ predicate })
  }, [queryClient])

  function completeSession(user: SessionUser) {
    clearPrivate()
    queryClient.setQueryData(SESSION_KEY, user)
    setSessionNotice('')
  }

  useEffect(() => {
    function expired() {
      queryClient.setQueryData(SESSION_KEY, null)
      clearPrivate()
      setSessionNotice('Sua sessão expirou. Entre novamente para continuar de onde parou.')
    }
    function changed(event: StorageEvent) {
      if (event.key !== 'kurio-session-token') return
      queryClient.setQueryData(SESSION_KEY, null)
      clearPrivate()
      setSessionNotice(event.newValue ? 'A conta mudou em outra aba. Atualizando sessão…' : 'A sessão foi encerrada em outra aba.')
      if (event.newValue) void queryClient.invalidateQueries({ queryKey: SESSION_KEY }).then(() => {
        if (queryClient.getQueryData(SESSION_KEY)) { setOpen(false); setSessionNotice('') }
      })
    }
    window.addEventListener('kurio:session-expired', expired)
    window.addEventListener('storage', changed)
    return () => { window.removeEventListener('kurio:session-expired', expired); window.removeEventListener('storage', changed) }
  }, [clearPrivate, queryClient])

  useEffect(() => {
    if (open) {
      dialog.current?.showModal()
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = previousOverflow }
    }
    dialog.current?.close()
  }, [open])

  function close() {
    setOpen(false)
    setMode('login')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setMessage('')
    form.current?.reset()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = event.currentTarget
    const fields = new FormData(target)
    const email = String(fields.get('email') ?? '').trim()
    const password = String(fields.get('password') ?? '')
    if (mode === 'register' && password !== fields.get('confirmPassword')) {
      const confirmation = target.elements.namedItem('confirmPassword') as HTMLInputElement
      confirmation.setCustomValidity('As senhas precisam ser iguais.')
      confirmation.reportValidity()
      return
    }
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'register') await registerMutation.mutateAsync({ username: String(fields.get('username') ?? '').trim(), email, password })
      else await loginMutation.mutateAsync({ email, password })
      close()
    } catch (error) {
      setMessage(messageFromError(error))
    } finally {
      setBusy(false)
    }
  }

  function changeMode(nextMode: 'login' | 'register') {
    form.current?.reset()
    setMode(nextMode)
    setMessage('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  async function signOut() {
    const userId = session.data?.id
    await queryClient.cancelQueries()
    try { await logout() } finally {
      if (userId) sessionStorage.removeItem(`kurio-checkout-draft:${userId}`)
      queryClient.setQueryData(SESSION_KEY, null)
      clearPrivate()
      setSessionNotice('')
      if (localStorage.getItem('kurio-session-token')) void queryClient.invalidateQueries({ queryKey: SESSION_KEY })
    }
  }

  const openLogin = useCallback(() => { setMessage(''); setOpen(true) }, [setMessage, setOpen])

  const value: AuthContextValue = {
    openLogin,
    user: session.data ?? null,
    loading: session.isPending,
    logout: signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <dialog ref={dialog} className={`auth-dialog ${mode === 'register' ? 'auth-register' : ''}`} aria-labelledby="auth-title" onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close() } }}>
        <div className="auth-mobile-brand" aria-hidden="true">KURIO</div>
        <button type="button" className="auth-close" aria-label="Fechar login" onClick={close}>×</button>
        <h2 id="auth-title" className="auth-tabs"><button type="button" aria-pressed={mode === 'login'} onClick={() => changeMode('login')}>Entrar</button><span aria-hidden="true">|</span><button type="button" aria-pressed={mode === 'register'} onClick={() => changeMode('register')}>Criar conta</button></h2>
        <h2 className="auth-mobile-title" aria-hidden="true">{mode === 'register' ? 'Criar perfil de colecionador' : 'Entrar'}</h2>
        <p className="auth-intro">{mode === 'register' ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.' : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}</p>
        {sessionNotice && <p className="auth-message" role="status">{sessionNotice}</p>}
        <form ref={form} key={mode} onSubmit={submit} className="auth-form" onInput={() => { const confirmation = form.current?.elements.namedItem('confirmPassword') as HTMLInputElement | null; confirmation?.setCustomValidity(''); setMessage('') }}>
          {mode === 'register' && <><label className="sr-only" htmlFor="register-username">Nome de usuário</label><Input id="register-username" name="username" autoComplete="username" minLength={2} placeholder="Nome de usuário" required /></>}
          <label className="sr-only" htmlFor="login-email">E-mail</label>
          <Input id="login-email" name="email" type="email" autoComplete="email" placeholder={mode === 'register' ? 'Digite seu e-mail' : 'contato@email.com'} required />
          <div className="auth-password"><label className="sr-only" htmlFor="login-password">Senha</label><Input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 8 : undefined} placeholder="Senha" required /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}><img src={hideIcon} alt="" /></button></div>
          {mode === 'register' ? <div className="auth-password"><label className="sr-only" htmlFor="register-confirm-password">Confirmar senha</label><Input id="register-confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Confirmar senha" required /><button type="button" aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} aria-pressed={showConfirmPassword} onClick={() => setShowConfirmPassword((current) => !current)}><img src={hideIcon} alt="" /></button></div> : <button type="button" className="auth-forgot" onClick={() => setMessage('A recuperação de senha não faz parte da autenticação simulada.')}>Esqueceu a senha?</button>}
          <Button variant="kurio" size="design" type="submit" className="auth-submit" disabled={busy}>{busy ? 'Aguarde…' : mode === 'register' ? <><span className="auth-submit-desktop">Criar conta</span><span className="auth-submit-mobile">Criar perfil</span></> : 'Entrar'}</Button>
        </form>
        <div className="auth-divider"><span>Ou continue com</span></div>
        <div className="auth-social">
          <button type="button" onClick={() => setMessage('O login com Google não faz parte da autenticação simulada.')}><img src={googleIcon} alt="" />Continuar com Google</button>
          <button type="button" onClick={() => setMessage('O login com Facebook não faz parte da autenticação simulada.')}><span className="auth-facebook" aria-hidden="true">f</span>Continuar com Facebook</button>
        </div>
        {message && <p className="auth-message" role="status">{message}</p>}
        <p className="auth-mobile-switch">{mode === 'register' ? 'Já tem conta?' : 'Novo na Kurio?'} <button type="button" onClick={() => changeMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Entrar' : 'Crie uma conta'}</button></p>
      </dialog>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa de AuthProvider')
  return context
}

export function RequireAuthentication({ children }: { children: ReactNode }) {
  const { user, loading, openLogin } = useAuth()
  useEffect(() => { if (!loading && !user) openLogin() }, [loading, openLogin, user])
  if (loading) return <main className="auth-route-message" role="status">Carregando sessão…</main>
  if (!user) return <main className="auth-route-message"><p>Entre na sua conta para acessar esta área.</p><button type="button" onClick={openLogin}>Entrar</button></main>
  return <Fragment key={user.id}>{children}</Fragment>
}

export function AuthButton() {
  const { openLogin, user, logout } = useAuth()
  const navigate = useNavigate()
  if (user) return <button type="button" className="auth-trigger" onClick={() => { void logout().finally(() => navigate({ to: '/', search: { search: '', category: undefined, network: undefined, minPrice: undefined, maxPrice: undefined, sort: undefined, page: 1 } })) }}><img src={loginIcon} alt="" />Sair</button>
  return <button type="button" className="auth-trigger" onClick={openLogin}><img src={loginIcon} alt="" />Entrar</button>
}
