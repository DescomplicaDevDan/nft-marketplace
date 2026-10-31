import { useRef, useState, type FormEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { AuthButton } from '@/features/auth/AuthProvider'
import searchIcon from '@/assets/icons/Search Icon.svg'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import '@/features/commerce/cart.css'
import './profile.css'
import './wallets.css'

const blankWallet = { displayName: '', alias: '', network: '', profileName: '', address: '', secondaryAddress: '', type: '', referral: '', email: '', ens: '' }
type Wallet = typeof blankWallet
type SavedWallets = { primary: Wallet; secondary: Wallet | null; same: boolean }
const KEY = 'kurio-wallets'
function readWallets(): SavedWallets {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    const sanitize = (value: unknown): Wallet => Object.fromEntries(Object.entries(blankWallet).map(([key, fallback]) => [key, value && typeof value === 'object' && typeof (value as Record<string, unknown>)[key] === 'string' ? (value as Record<string, string>)[key] : fallback])) as Wallet
    return { primary: sanitize(parsed?.primary), secondary: parsed?.secondary ? sanitize(parsed.secondary) : null, same: parsed?.same === true }
  } catch { return { primary: { ...blankWallet }, secondary: null, same: false } }
}

function WalletForm({ value, onSave, id }: { value: Wallet; onSave: (wallet: Wallet) => void; id: string }) {
  const firstInput = useRef<HTMLInputElement>(null)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSave(Object.fromEntries(Object.keys(blankWallet).map((key) => [key, String(data.get(key) ?? '').trim()])) as Wallet)
  }
  return <form id={id} className="wallet-form" onSubmit={submit}>
    <div className="profile-fields">
      <label>Nome de exibição<span>*</span><input ref={firstInput} name="displayName" defaultValue={value.displayName} autoComplete="name" required /></label>
      <label>Apelido da carteira<span>*</span><input name="alias" defaultValue={value.alias} required /></label>
      <label>Rede<span>*</span><select name="network" defaultValue={value.network} required><option value="" disabled>Selecione uma rede</option><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></label>
      <label>Nome do perfil<span>*</span><input name="profileName" defaultValue={value.profileName} required /></label>
      <label>Endereço da carteira<span>*</span><input name="address" defaultValue={value.address} placeholder="Endereço 0x da carteira" required /></label>
      <label className="wallet-secondary-address"><span className="sr-only">ENS ou carteira secundária</span><input name="secondaryAddress" defaultValue={value.secondaryAddress} placeholder="ENS ou carteira secundária (opcional)" /></label>
      <label>Tipo de carteira<span>*</span><select name="type" defaultValue={value.type} required><option value="" disabled>Selecione uma carteira</option><option>MetaMask</option><option>WalletConnect</option><option>Coinbase Wallet</option></select></label>
      <label>Código de indicação<span>*</span><input name="referral" defaultValue={value.referral} required /></label>
      <label>E-mail<span>*</span><input name="email" type="email" defaultValue={value.email} autoComplete="email" required /></label>
      <label>Nome ENS<span>*</span><div className="profile-ens"><select aria-label="Sufixo ENS"><option>.eth</option></select><input name="ens" defaultValue={value.ens} aria-label="Nome ENS" required /></div></label>
    </div>
    <button className="profile-save wallet-save" type="submit">Salvar carteira</button>
  </form>
}

export default function WalletsPage() {
  const search = useSearch({ from: '/wallets' })
  const [saved, setSaved] = useState(readWallets)
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [message, setMessage] = useState('')
  function persist(next: SavedWallets) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); setSaved(next); setMessage('Carteira salva neste navegador.') }
    catch { setMessage('Não foi possível salvar os dados neste navegador.') }
  }
  return <main className="cart-page profile-page wallets-page">
    <header className="cart-header"><Link to="/" search={search} className="cart-wordmark">KURIO</Link><nav aria-label="Navegação principal"><Link to="/" search={search} className="active">Início</Link><Link to="/" search={search} hash="catalogo">Mercado</Link><span>Criadores</span><span>Aprenda</span></nav><div className="cart-header-actions"><Link to="/" search={search} hash="catalogo" aria-label="Buscar"><img src={searchIcon} alt="" /></Link><Link to="/cart" search={search} aria-label="Carrinho"><img src={cartIcon} alt="" /></Link><AuthButton /></div></header>
    <div className="profile-layout">
      <aside className="profile-sidebar"><h2>Meu perfil</h2><nav aria-label="Menu do perfil"><Link to="/profile" search={search}><span aria-hidden="true">♙</span>Dados do perfil</Link><Link to="/wallets" search={search} className="selected" aria-current="page"><span aria-hidden="true">◎</span>Carteiras</Link><Link to="/orders" search={search}><span aria-hidden="true">♧</span>Atividade</Link><Link to="/favorites" search={search}><span aria-hidden="true">♡</span>Lista de interesse</Link>{['Ofertas', 'Arquivos baixados', 'Suporte'].map((label) => <button key={label} type="button" onClick={() => setMessage(`${label}: área ainda não disponível.`)}><span aria-hidden="true">◇</span>{label}</button>)}<Link to="/" search={search} className="profile-exit"><span aria-hidden="true">↪</span>Sair</Link></nav></aside>
      <section className="profile-form wallets-content">
        <div className="wallet-section-heading"><h1>Carteira principal</h1><button type="button" onClick={() => document.querySelector<HTMLInputElement>('#primary-wallet input')?.focus()}>Adicionar</button></div>
        <p className="wallet-description">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        <WalletForm id="primary-wallet" value={saved.primary} onSave={(primary) => persist({ ...saved, primary })} />
        <div className="wallet-section-heading wallet-secondary-heading"><h2>Carteira secundária</h2><div><label><input type="checkbox" checked={saved.same} onChange={(event) => persist({ ...saved, same: event.target.checked })} />Igual à carteira principal</label><button type="button" onClick={() => { if (saved.same) persist({ ...saved, same: false }); setAddingSecondary(true) }}>Adicionar</button></div></div>
        {saved.same ? <p className="wallet-description">A carteira principal será usada como carteira secundária.</p> : addingSecondary || saved.secondary ? <WalletForm key="secondary" id="secondary-wallet" value={saved.secondary ?? blankWallet} onSave={(secondary) => { persist({ ...saved, secondary, same: false }); setAddingSecondary(false) }} /> : <p className="wallet-description">Você ainda não adicionou uma carteira secundária.</p>}
        {message && <p className="profile-message" role="status">{message}</p>}
      </section>
    </div>
  </main>
}
