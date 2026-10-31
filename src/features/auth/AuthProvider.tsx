import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react'
import googleIcon from '@/assets/icons/google 1.svg'
import hideIcon from '@/assets/icons/Hide.svg'
import loginIcon from '@/assets/icons/Logout.svg'
import './auth.css'

const AuthContext = createContext<(() => void) | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
    setShowPassword(false)
    setMessage('')
    form.current?.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Formulário validado. O login demonstrativo ainda não conecta a uma conta real.')
  }

  return (
    <AuthContext.Provider value={() => { setMessage(''); setOpen(true) }}>
      {children}
      <dialog ref={dialog} className="auth-dialog" aria-labelledby="auth-title" onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close() } }}>
        <button type="button" className="auth-close" aria-label="Fechar login" onClick={close}>×</button>
        <div className="auth-tabs"><h2 id="auth-title">Entrar</h2><span aria-hidden="true">|</span><button type="button" onClick={() => setMessage('O formulário de cadastro será adicionado na próxima etapa.')}>Criar conta</button></div>
        <p className="auth-intro">Entre para gerenciar sua carteira, coleção e perfil de criador.</p>
        <form ref={form} onSubmit={submit} className="auth-form">
          <label className="sr-only" htmlFor="login-email">E-mail</label>
          <input id="login-email" name="email" type="email" autoComplete="email" placeholder="contato@email.com" required />
          <div className="auth-password"><label className="sr-only" htmlFor="login-password">Senha</label><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Senha" required /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}><img src={hideIcon} alt="" /></button></div>
          <button type="button" className="auth-forgot" onClick={() => setMessage('A recuperação de senha estará disponível quando a autenticação for conectada.')}>Esqueceu a senha?</button>
          <button type="submit" className="auth-submit">Entrar</button>
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
