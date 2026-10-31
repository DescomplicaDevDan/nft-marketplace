import { useRef, useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { AuthButton } from '@/features/auth/AuthProvider'
import searchIcon from '@/assets/icons/Search Icon.svg'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import hideIcon from '@/assets/icons/Hide.svg'
import '@/features/commerce/cart.css'
import './profile.css'

const STORAGE_KEY = 'kurio-profile'
const emptyProfile = { displayName: '', username: '', email: '', walletAlias: '', ens: '', avatar: '' }
function loadProfile() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    return Object.fromEntries(Object.entries(emptyProfile).map(([key, fallback]) => [key, typeof data?.[key] === 'string' ? data[key] : fallback])) as typeof emptyProfile
  } catch { return emptyProfile }
}

export default function ProfilePage() {
  const search = useSearch({ from: '/profile' })
  const [profile, setProfile] = useState(loadProfile)
  const [message, setMessage] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const fileInput = useRef<HTMLInputElement>(null)

  function update(key: keyof typeof emptyProfile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }))
    setMessage('')
  }
  function avatarChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setMessage('Escolha uma imagem PNG, JPEG ou WebP de até 2 MB.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => update('avatar', String(reader.result))
    reader.onerror = () => setMessage('Não foi possível carregar a imagem.')
    reader.readAsDataURL(file)
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const current = String(data.get('currentPassword') ?? '')
    const password = String(data.get('newPassword') ?? '')
    const confirmation = String(data.get('confirmPassword') ?? '')
    if (current || password || confirmation) {
      if (!current || password.length < 8 || password !== confirmation) {
        setMessage('Preencha a senha atual e uma nova senha de pelo menos 8 caracteres, com confirmação igual.')
        return
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      setMessage(password ? 'Perfil salvo neste navegador. A alteração de senha ainda depende da autenticação real.' : 'Perfil salvo neste navegador.')
      for (const name of ['currentPassword', 'newPassword', 'confirmPassword']) (event.currentTarget.elements.namedItem(name) as HTMLInputElement).value = ''
    } catch { setMessage('Não foi possível salvar. Tente uma imagem de avatar menor.') }
  }

  return (
    <main className="cart-page profile-page">
      <header className="cart-header">
        <Link to="/" search={search} className="cart-wordmark">KURIO</Link>
        <nav aria-label="Navegação principal"><Link to="/" search={search} className="active">Início</Link><Link to="/" search={search} hash="catalogo">Mercado</Link><span>Criadores</span><span>Aprenda</span></nav>
        <div className="cart-header-actions"><Link to="/" search={search} hash="catalogo" aria-label="Buscar"><img src={searchIcon} alt="" /></Link><Link to="/cart" search={search} aria-label="Carrinho"><img src={cartIcon} alt="" /></Link><AuthButton /></div>
      </header>
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <h2>Meu perfil</h2>
          <nav aria-label="Menu do perfil">
            <Link to="/profile" search={search} className="selected" aria-current="page"><span aria-hidden="true">♙</span>Dados do perfil</Link>
            <button type="button" onClick={() => setMessage('A página de carteiras será adicionada na próxima etapa.')}><span aria-hidden="true">◎</span>Carteiras</button>
            <Link to="/orders" search={search}><span aria-hidden="true">♧</span>Atividade</Link>
            <Link to="/favorites" search={search}><span aria-hidden="true">♡</span>Lista de interesse</Link>
            {['Ofertas', 'Arquivos baixados', 'Suporte'].map((label) => <button key={label} type="button" onClick={() => setMessage(`${label}: área ainda não disponível.`)}><span aria-hidden="true">◇</span>{label}</button>)}
            <Link to="/" search={search} className="profile-exit"><span aria-hidden="true">↪</span>Sair</Link>
          </nav>
        </aside>
        <form className="profile-form" onSubmit={save}>
          <h1>Perfil do colecionador</h1>
          <div className="profile-fields">
            <label>Nome de exibição<span>*</span><input value={profile.displayName} onChange={(event) => update('displayName', event.target.value)} autoComplete="name" required /></label>
            <label>Nome de usuário<span>*</span><input value={profile.username} onChange={(event) => update('username', event.target.value)} autoComplete="username" required /></label>
            <label>E-mail<span>*</span><input type="email" value={profile.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required /></label>
            <label>Nome ENS<span>*</span><div className="profile-ens"><select aria-label="Sufixo ENS"><option>.eth</option></select><input aria-label="Nome ENS" value={profile.ens} onChange={(event) => update('ens', event.target.value)} required /></div></label>
            <label>Apelido da carteira<span>*</span><input value={profile.walletAlias} onChange={(event) => update('walletAlias', event.target.value)} required /></label>
            <div className="profile-avatar"><span>Avatar</span><div>{profile.avatar ? <img src={profile.avatar} alt="Avatar do perfil" /> : <span className="profile-avatar-placeholder" aria-hidden="true">◎</span>}<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={avatarChanged} hidden /><button type="button" onClick={() => fileInput.current?.click()}>Alterar</button><button type="button" className="profile-remove-avatar" onClick={() => { update('avatar', ''); if (fileInput.current) fileInput.current.value = '' }}>Remover</button></div></div>
          </div>
          <fieldset className="profile-passwords"><legend>Alterar senha</legend>{[['currentPassword', 'Senha atual'], ['newPassword', 'Nova senha'], ['confirmPassword', 'Confirmar nova senha']].map(([name, label]) => <label key={name}>{label}<div><input name={name} type={visiblePasswords[name] ? 'text' : 'password'} autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'} minLength={name === 'currentPassword' ? undefined : 8} /><button type="button" aria-label={`${visiblePasswords[name] ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={!!visiblePasswords[name]} onClick={() => setVisiblePasswords((current) => ({ ...current, [name]: !current[name] }))}><img src={hideIcon} alt="" /></button></div></label>)}</fieldset>
          <button type="submit" className="profile-save">Salvar</button>
          {message && <p role="status" className="profile-message">{message}</p>}
        </form>
      </div>
    </main>
  )
}
