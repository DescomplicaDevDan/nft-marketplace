import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react'
import googleIcon from '@/assets/icons/google 1.svg'
import hideIcon from '@/assets/icons/Hide.svg'
import loginIcon from '@/assets/icons/Logout.svg'
import './auth.css'

const AuthContext = createContext<(() => void) | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [message, setMessage] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const form = useRef<HTMLFormElement>(null)

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
    setMessage('')
    form.current?.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    if (mode === 'register' && fields.get('password') !== fields.get('confirmPassword')) {
      const confirmation = event.currentTarget.elements.namedItem('confirmPassword') as HTMLInputElement
      confirmation.setCustomValidity('As senhas precisam ser iguais.')
      confirmation.reportValidity()
      return
    }
    setMessage(mode === 'register' ? 'Cadastro validado. A criação de uma conta real ainda não está conectada.' : 'Formulário validado. O login demonstrativo ainda não conecta a uma conta real.')
    event.currentTarget.reset()
    setShowPassword(false)
  }

  function changeMode(nextMode: 'login' | 'register') {
    form.current?.reset()
    setMode(nextMode)
    setMessage('')
    setShowPassword(false)
  }

  return (
    <AuthContext.Provider value={() => { setMessage(''); setOpen(true) }}>
      {children}
      <dialog ref={dialog} className={`auth-dialog ${mode === 'register' ? 'auth-register' : ''}`} aria-labelledby="auth-title" onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close() } }}>
        <button type="button" className="auth-close" aria-label="Fechar login" onClick={close}>×</button>
        <h2 id="auth-title" className="auth-tabs"><button type="button" aria-pressed={mode === 'login'} onClick={() => changeMode('login')}>Entrar</button><span aria-hidden="true">|</span><button type="button" aria-pressed={mode === 'register'} onClick={() => changeMode('register')}>Criar conta</button></h2>
        <p className="auth-intro">{mode === 'register' ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.' : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}</p>
        <form ref={form} key={mode} onSubmit={submit} className="auth-form" onInput={() => { const confirmation = form.current?.elements.namedItem('confirmPassword') as HTMLInputElement | null; confirmation?.setCustomValidity(''); setMessage('') }}>
          {mode === 'register' && <><label className="sr-only" htmlFor="register-username">Nome de usuário</label><input id="register-username" name="username" autoComplete="username" placeholder="Nome de usuário" required /></>}
          <label className="sr-only" htmlFor="login-email">E-mail</label>
          <input id="login-email" name="email" type="email" autoComplete="email" placeholder={mode === 'register' ? 'Digite seu e-mail' : 'contato@email.com'} required />
          <div className="auth-password"><label className="sr-only" htmlFor="login-password">Senha</label><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 8 : undefined} placeholder="Senha" required /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}><img src={hideIcon} alt="" /></button></div>
          {mode === 'register' ? <><label className="sr-only" htmlFor="register-confirm-password">Confirmar senha</label><input id="register-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Confirmar senha" required /></> : <button type="button" className="auth-forgot" onClick={() => setMessage('A recuperação de senha estará disponível quando a autenticação for conectada.')}>Esqueceu a senha?</button>}
          <button type="submit" className="auth-submit">{mode === 'register' ? 'Criar conta' : 'Entrar'}</button>
        </form>
        <div className="auth-divider"><span>Ou continue com</span></div>
        <div className="auth-social">
          <button type="button" onClick={() => setMessage('O login com Google ainda não está conectado.')}><img src={googleIcon} alt="" />Continuar com Google</button>
          <button type="button" onClick={() => setMessage('O login com Facebook ainda não está conectado.')}><span className="auth-facebook" aria-hidden="true">f</span>Continuar com Facebook</button>
        </div>
        {message && <p className="auth-message" role="status">{message}</p>}
      </dialog>
    </AuthContext.Provider>
  )
}

export function AuthButton() {
  const openLogin = useContext(AuthContext)
  if (!openLogin) throw new Error('AuthButton precisa de AuthProvider')
  return <button type="button" className="auth-trigger" onClick={openLogin}><img src={loginIcon} alt="" />Entrar</button>
}
