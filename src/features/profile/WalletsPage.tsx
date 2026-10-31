import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { AuthButton, useAuth } from '@/features/auth/AuthProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { blankWallet, deleteWallet, saveWallets, useWallets, type Wallet, type SavedWallets } from './walletApi'
import searchIcon from '@/assets/icons/Search Icon.svg'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import '@/features/commerce/cart.css'
import './profile.css'
import './wallets.css'

function WalletForm({ value, onSave, id }: { value: Wallet; onSave: (wallet: Wallet) => void; id: string }) {
  const firstInput = useRef<HTMLInputElement>(null)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSave(Object.fromEntries(Object.keys(blankWallet).map((key) => [key, String(data.get(key) ?? '').trim()])) as Wallet)
  }
  return <form id={id} className="wallet-form" onSubmit={submit}>
    <div className="profile-fields">
      <label>Nome de exibição<span>*</span><Input ref={firstInput} name="displayName" defaultValue={value.displayName} autoComplete="name" required /></label>
      <label>Apelido da carteira<span>*</span><Input name="alias" defaultValue={value.alias} required /></label>
      <label>Rede<span>*</span><select name="network" defaultValue={value.network} required><option value="" disabled>Selecione uma rede</option><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></label>
      <label>Nome do perfil<span>*</span><Input name="profileName" defaultValue={value.profileName} required /></label>
      <label>Endereço da carteira<span>*</span><Input name="address" defaultValue={value.address} placeholder="Endereço 0x da carteira" required /></label>
      <label className="wallet-secondary-address"><span className="sr-only">ENS ou carteira secundária</span><Input name="secondaryAddress" defaultValue={value.secondaryAddress} placeholder="ENS ou carteira secundária (opcional)" /></label>
      <label>Tipo de carteira<span>*</span><select name="type" defaultValue={value.type} required><option value="" disabled>Selecione uma carteira</option><option>MetaMask</option><option>WalletConnect</option><option>Coinbase Wallet</option></select></label>
      <label>Código de indicação<span>*</span><Input name="referral" defaultValue={value.referral} required /></label>
      <label>E-mail<span>*</span><Input name="email" type="email" defaultValue={value.email} autoComplete="email" required /></label>
      <label>Nome ENS<span>*</span><div className="profile-ens"><select aria-label="Sufixo ENS"><option>.eth</option></select><Input name="ens" defaultValue={value.ens} aria-label="Nome ENS" required /></div></label>
    </div>
    <Button variant="kurio" size="design" className="profile-save wallet-save" type="submit">Salvar carteira</Button>
  </form>
}

export default function WalletsPage() {
  const search = useSearch({ from: '/wallets' })
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const query = useWallets()
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [message, setMessage] = useState('')
  const mutation = useMutation({ mutationFn: async (input: { next: SavedWallets } | { remove: 'primary' | 'secondary' }) => 'next' in input ? saveWallets(input.next) : deleteWallet(input.remove), retry: false })
  async function persist(input: { next: SavedWallets } | { remove: 'primary' | 'secondary' }) {
    if (mutation.isPending) return
    setMessage('')
    try {
      const value = await mutation.mutateAsync(input)
      if (queryClient.getQueryData<{ id: string }>(['session'])?.id !== user?.id) return
      queryClient.setQueryData(['wallets', user?.id], value)
      setAddingSecondary(false)
      setMessage('remove' in input ? 'Carteira removida.' : 'Carteiras atualizadas.')
    } catch (error) { setMessage(isAxiosError<{ message: string }>(error) ? error.response?.data?.message ?? 'Não foi possível salvar. Tente novamente.' : 'Não foi possível salvar. Tente novamente.') }
  }
  if (query.isPending) return <main className="auth-route-message" role="status">Carregando carteiras…</main>
  if (query.isError) return <main className="auth-route-message" role="alert"><p>Não foi possível carregar suas carteiras.</p><button type="button" onClick={() => { void query.refetch() }}>Tentar novamente</button></main>
  const saved = query.data
  return <main className="cart-page profile-page wallets-page">
    <header className="cart-header"><Link to="/" search={search} className="cart-wordmark">KURIO</Link><nav aria-label="Navegação principal"><Link to="/" search={search} className="active">Início</Link><Link to="/" search={search} hash="catalogo">Mercado</Link><span>Criadores</span><span>Aprenda</span></nav><div className="cart-header-actions"><Link to="/" search={search} hash="catalogo" aria-label="Buscar"><img src={searchIcon} alt="" /></Link><Link to="/cart" search={search} aria-label="Carrinho"><img src={cartIcon} alt="" /></Link><AuthButton /></div></header>
    <div className="profile-layout">
      <aside className="profile-sidebar"><h2>Meu perfil</h2><nav aria-label="Menu do perfil"><Link to="/profile" search={search}><span aria-hidden="true">♙</span>Dados do perfil</Link><Link to="/wallets" search={search} className="selected" aria-current="page"><span aria-hidden="true">◎</span>Carteiras</Link><Link to="/orders" search={search}><span aria-hidden="true">♧</span>Atividade</Link><Link to="/favorites" search={search}><span aria-hidden="true">♡</span>Lista de interesse</Link>{['Ofertas', 'Arquivos baixados', 'Suporte'].map((label) => <button key={label} type="button" onClick={() => setMessage(`${label}: área ainda não disponível.`)}><span aria-hidden="true">◇</span>{label}</button>)}<button type="button" className="profile-exit" onClick={() => { void logout().finally(() => navigate({ to: '/', search })) }}><span aria-hidden="true">↪</span>Sair</button></nav></aside>
      <section className="profile-form wallets-content">
        <fieldset disabled={mutation.isPending} className="profile-edit-fields">
        <div className="wallet-section-heading"><h1>Carteira principal</h1><button type="button" onClick={() => document.querySelector<HTMLInputElement>('#primary-wallet input')?.focus()}>Adicionar</button></div>
        <p className="wallet-description">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        <WalletForm key={`primary-${JSON.stringify(saved.primary)}`} id="primary-wallet" value={saved.primary ?? blankWallet} onSave={(primary) => { void persist({ next: { ...saved, primary } }) }} />
        {saved.primary && <button type="button" onClick={() => { void persist({ remove: 'primary' }) }}>Remover carteira principal</button>}
        <div className="wallet-section-heading wallet-secondary-heading"><h2>Carteira secundária</h2><div><label><input type="checkbox" checked={saved.same} disabled={!saved.primary} onChange={(event) => { void persist({ next: { ...saved, same: event.target.checked } }) }} />Igual à carteira principal</label><button type="button" onClick={() => setAddingSecondary(true)}>Adicionar</button></div></div>
        {addingSecondary || (!saved.same && saved.secondary) ? <WalletForm key={`secondary-${JSON.stringify(saved.secondary)}`} id="secondary-wallet" value={saved.secondary ?? blankWallet} onSave={(secondary) => { void persist({ next: { ...saved, secondary, same: false } }) }} /> : saved.same ? <p className="wallet-description">A carteira principal será usada como carteira secundária.</p> : <p className="wallet-description">Você ainda não adicionou uma carteira secundária.</p>}
        {saved.secondary && <button type="button" onClick={() => { void persist({ remove: 'secondary' }) }}>Remover carteira secundária</button>}
        </fieldset>
        {message && <p className="profile-message" role="status">{message}</p>}
      </section>
    </div>
  </main>
}
