import CartCountBadge from '@/components/CartCountBadge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRef, useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { AuthButton, useAuth } from '@/features/auth/AuthProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { updateProfile, useProfile, type CollectorProfile } from './api'
import searchIcon from '@/assets/icons/Search Icon.svg'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import hideIcon from '@/assets/icons/Hide.svg'
import avatarIcon from '@/assets/icons/Image 2.svg'
import '@/features/commerce/cart.css'
import './profile.css'

export default function ProfilePage() {
  const query = useProfile()
  const { user } = useAuth()
  if (query.isPending) return <main className="auth-route-message" role="status">Carregando perfil…</main>
  if (query.isError) return <main className="auth-route-message" role="alert"><p>Não foi possível carregar o perfil.</p><button type="button" onClick={() => { void query.refetch() }}>Tentar novamente</button></main>
  return <ProfileEditor key={user?.id} initialProfile={query.data} />
}

function ProfileEditor({ initialProfile }: { initialProfile: CollectorProfile }) {
  const search = useSearch({ from: '/profile' })
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const queryClient = useQueryClient()
  const saveMutation = useMutation({ mutationFn: updateProfile, retry: false })
  const [profile, setProfile] = useState(initialProfile)
  const [message, setMessage] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const fileInput = useRef<HTMLInputElement>(null)

  function update(key: keyof CollectorProfile, value: string) {
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
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveMutation.isPending) return
    const target = event.currentTarget
    const data = new FormData(target)
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
      const saved = await saveMutation.mutateAsync({ profile, ...(password ? { currentPassword: current, newPassword: password } : {}) })
      if (queryClient.getQueryData<{ id: string }>(['session'])?.id !== user?.id) return
      queryClient.setQueryData(['profile', user?.id], saved)
      if (user) queryClient.setQueryData(['session'], { id: user.id, username: saved.username, email: saved.email })
      setProfile(saved)
      setMessage(password ? 'Perfil e senha atualizados.' : 'Perfil atualizado.')
      for (const name of ['currentPassword', 'newPassword', 'confirmPassword']) (target.elements.namedItem(name) as HTMLInputElement).value = ''
    } catch (error) {
      setMessage(isAxiosError<{ message: string }>(error) ? error.response?.data?.message ?? 'Não foi possível salvar. Tente novamente.' : 'Não foi possível salvar. Tente novamente.')
    }
  }

  return (
    <main className="cart-page profile-page">
      <header className="cart-header">
        <Link to="/" search={search} className="cart-wordmark">KURIO</Link>
        <nav aria-label="Navegação principal"><Link to="/" search={search} className="active">Início</Link><Link to="/" search={search} hash="catalogo">Mercado</Link><span>Criadores</span><span>Aprenda</span></nav>
        <div className="cart-header-actions"><Link to="/" search={search} hash="catalogo" aria-label="Buscar"><img src={searchIcon} alt="" /></Link><Link to="/cart" search={search} aria-label="Carrinho"><img src={cartIcon} alt="" /><CartCountBadge /></Link><AuthButton /></div>
      </header>
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <h2>Meu perfil</h2>
          <nav aria-label="Menu do perfil">
            <Link to="/profile" search={search} className="selected" aria-current="page"><span aria-hidden="true">♙</span>Dados do perfil</Link>
            <Link to="/wallets" search={search}><span aria-hidden="true">◎</span>Carteiras</Link>
            <Link to="/orders" search={search}><span aria-hidden="true">♧</span>Atividade</Link>
            <Link to="/favorites" search={search}><span aria-hidden="true">♡</span>Lista de interesse</Link>
            {['Ofertas', 'Arquivos baixados', 'Suporte'].map((label) => <button key={label} type="button" onClick={() => setMessage(`${label}: área ainda não disponível.`)}><span aria-hidden="true">◇</span>{label}</button>)}
            <button type="button" className="profile-exit" onClick={() => { void logout().finally(() => navigate({ to: '/', search })) }}><span aria-hidden="true">↪</span>Sair</button>
          </nav>
        </aside>
        <form className="profile-form" onSubmit={save}>
          <h1>Perfil do colecionador</h1>
          <fieldset disabled={saveMutation.isPending} className="profile-edit-fields">
          <div className="profile-fields">
            <label>Nome de exibição<span>*</span><Input value={profile.displayName} onChange={(event) => update('displayName', event.target.value)} autoComplete="name" required /></label>
            <label>Nome de usuário<span>*</span><Input value={profile.username} onChange={(event) => update('username', event.target.value)} autoComplete="username" required /></label>
            <label>E-mail<span>*</span><Input type="email" value={profile.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required /></label>
            <label>Nome ENS<span>*</span><div className="profile-ens"><select aria-label="Sufixo ENS"><option>.eth</option></select><Input aria-label="Nome ENS" value={profile.ens} onChange={(event) => update('ens', event.target.value)} required /></div></label>
            <label>Apelido da carteira<span>*</span><Input value={profile.walletAlias} onChange={(event) => update('walletAlias', event.target.value)} required /></label>
            <div className="profile-avatar"><span>Avatar</span><div>{profile.avatar ? <img src={profile.avatar} alt="Avatar do perfil" /> : <span className="profile-avatar-placeholder" aria-hidden="true"><img src={avatarIcon} alt="" /></span>}<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={avatarChanged} hidden /><button type="button" onClick={() => fileInput.current?.click()}>Alterar</button><button type="button" className="profile-remove-avatar" onClick={() => { update('avatar', ''); if (fileInput.current) fileInput.current.value = '' }}>Remover</button></div></div>
          </div>
          <fieldset className="profile-passwords"><legend>Alterar senha</legend>{[['currentPassword', 'Senha atual'], ['newPassword', 'Nova senha'], ['confirmPassword', 'Confirmar nova senha']].map(([name, label]) => <label key={name}>{label}<div><Input name={name} type={visiblePasswords[name] ? 'text' : 'password'} autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'} minLength={name === 'currentPassword' ? undefined : 8} /><button type="button" aria-label={`${visiblePasswords[name] ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={!!visiblePasswords[name]} onClick={() => setVisiblePasswords((current) => ({ ...current, [name]: !current[name] }))}><img src={hideIcon} alt="" /></button></div></label>)}</fieldset>
          <Button variant="kurio" size="design" type="submit" className="profile-save">{saveMutation.isPending ? 'Salvando…' : 'Salvar'}</Button>
          </fieldset>
          {message && <p role="status" className="profile-message">{message}</p>}
        </form>
      </div>
    </main>
  )
}
