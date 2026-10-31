import { AuthButton } from '@/features/auth/AuthProvider'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import SiteFooter from '@/components/SiteFooter'
import searchIcon from '@/assets/icons/Search Icon.svg'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import { useCommerce } from './CommerceProvider'
import './cart.css'
import './checkout.css'

export default function CheckoutScreen() {
  const search = useSearch({ from: '/checkout' })
  const navigate = useNavigate({ from: '/checkout' })
  const { cart, quantities, placeOrder, cartItems: items, cartLoading: isPending, cartError: isError, cartBusy, quote, quoteLoading, quoteBusy, quoteError, retryQuote } = useCommerce()
  const [otherWallet, setOtherWallet] = useState(false)
  const [wallet, setWallet] = useState('coinbase')
  const [submitted, setSubmitted] = useState(false)

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitted || cartBusy || isError || !quote || quoteBusy || quoteError || items.length === 0 || items.length !== cart.length) return
    setSubmitted(true)
    const id = `KURIO-${Date.now().toString(36).toUpperCase()}`
    placeOrder({ id, createdAt: new Date().toISOString(), wallet: wallet === 'coinbase' ? 'Coinbase Wallet' : wallet === 'metamask' ? 'MetaMask' : 'WalletConnect', networkFeeEth: quote.networkFeeEth, discountEth: quote.discountEth, totalEth: quote.totalEth, items: quote.items.map((item) => ({ ...item, priceEth: item.lineTotalEth })) })
    void navigate({ to: '/orders/$orderId', params: { orderId: id }, search })
  }

  return (
    <main id="topo" className="cart-page checkout-page">
      <header className="cart-header">
        <Link to="/" search={search} className="cart-wordmark">KURIO</Link>
        <nav aria-label="Navegação principal"><Link to="/" search={search}>Início</Link><Link to="/" search={search} hash="catalogo" className="active">Mercado</Link><span>Criadores</span><span>Aprenda</span></nav>
        <div className="cart-header-actions"><Link to="/" search={search} hash="catalogo" aria-label="Buscar"><img src={searchIcon} alt="" /></Link><Link to="/cart" search={search} aria-label="Carrinho"><img src={cartIcon} alt="" /></Link><AuthButton /></div>
      </header>
      <nav aria-label="Breadcrumb" className="cart-breadcrumb"><Link to="/" search={search}>Início</Link><span>/</span><Link to="/" search={search} hash="catalogo">Mercado</Link><span>/</span><span aria-current="page">Pagamento</span></nav>
      <h1 className="sr-only">Pagamento</h1>
      {isPending && <p role="status">Carregando seus NFTs…</p>}
      {isError && <p role="alert">Não foi possível carregar o pedido. Volte ao carrinho e tente novamente.</p>}
      {!isPending && !isError && items.length === 0 && <div className="cart-empty">Seu carrinho está vazio. <Link to="/" search={search} hash="catalogo">Explorar NFTs</Link></div>}
      {items.length > 0 && <form className="checkout-layout" onSubmit={confirm}>
        <section className="checkout-profile" aria-labelledby="collector-title">
          <h2 id="collector-title">Perfil do colecionador</h2>
          <div className="checkout-fields">
            <label>Nome de exibição<span>*</span><input name="displayName" autoComplete="name" required /></label>
            <label>Nome de usuário<span>*</span><input name="username" autoComplete="username" required /></label>
            <label>Rede<span>*</span><select name="network" defaultValue="" required><option value="" disabled>Selecione uma rede</option><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></label>
            <label>Nome do perfil<span>*</span><input name="profileName" required /></label>
            <label>Endereço da carteira<span>*</span><input name="walletAddress" placeholder="Endereço 0x da carteira" required /></label>
            <label className="checkout-secondary-wallet"><span className="sr-only">ENS ou carteira secundária</span><input name="secondaryWallet" placeholder="ENS ou carteira secundária (opcional)" /></label>
            <label>Tipo de carteira<span>*</span><select name="walletType" defaultValue="" required><option value="" disabled>Selecione uma carteira</option><option>MetaMask</option><option>WalletConnect</option><option>Coinbase Wallet</option></select></label>
            <label>Código de indicação<span>*</span><input name="referral" required /></label>
            <label>E-mail<span>*</span><input name="email" type="email" autoComplete="email" required /></label>
            <label>Nome ENS<span>*</span><div className="checkout-ens-field"><select name="ensSuffix" className="checkout-ens" aria-label="Sufixo ENS"><option>.eth</option><option>.crypto</option></select><input name="ens" aria-label="Nome ENS" required /></div></label>
          </div>
          <label className="checkout-other"><input type="checkbox" checked={otherWallet} onChange={(event) => setOtherWallet(event.target.checked)} />Usar outra carteira?</label>
          {otherWallet && <label className="checkout-alternative">Outra carteira<input name="alternativeWallet" placeholder="Endereço da outra carteira" required /></label>}
          <label className="checkout-notes">Observação do colecionador (opcional)<textarea name="notes" rows={6} /></label>
        </section>
        <aside className="checkout-order" aria-labelledby="checkout-order-title">
          <h2 id="checkout-order-title">Seus NFTs</h2>
          <div className="checkout-list-heading"><strong>NFTs</strong><span>Subtotal</span></div>
          <ul className="checkout-items">{items.map((item) => <li key={item.id}><img src={item.imageUrl} alt="" /><div><strong>{item.name}</strong><small>ID do token: #{(item.name.match(/#(\d+)$/)?.[1] ?? '').padStart(4, '0')}</small></div><span className="checkout-item-quantity">(× {quantities[item.id] ?? 1})</span><b>{quote?.items.find((line) => line.id === item.id)?.lineTotalEth ?? '—'} ETH</b></li>)}</ul>
          <Link to="/cart" search={search} className="checkout-promo-link">Tem um código promocional? Aplique aqui</Link>
          {(quoteLoading || quoteBusy) && <p role="status">Atualizando total…</p>}
          {quoteError && <div role="alert"><p>{quoteError}</p><button type="button" onClick={retryQuote}>Recalcular total</button></div>}
          <dl className="cart-summary-values"><div><dt>Subtotal</dt><dd>{quote?.subtotalEth ?? '—'} ETH</dd></div><div><dt>Desconto do lançamento</dt><dd>(−) {quote?.discountEth ?? '—'} ETH</dd></div><div><dt>Taxa de rede</dt><dd>{quote?.networkFeeEth ?? '—'} ETH</dd></div></dl>
          <p className="cart-fee-note">Taxa estimada</p>
          <div className="checkout-total"><strong>Total</strong><strong>{quote?.totalEth ?? '—'} ETH</strong></div>
          <fieldset className="checkout-wallets"><legend>Carteira e rede</legend>{[['walletconnect', 'METAMASK · WALLETCONNECT · COINBASE'], ['metamask', 'MetaMask'], ['coinbase', 'Coinbase Wallet']].map(([value, label]) => <label key={value} className={wallet === value ? 'selected' : ''}><input type="radio" name="paymentWallet" value={value} checked={wallet === value} onChange={() => setWallet(value)} />{label}</label>)}</fieldset>
          <button className="checkout-confirm" type="submit" disabled={submitted || cartBusy || quoteBusy || !!quoteError || !quote || items.length !== cart.length}>Confirmar compra</button>
          <p className="checkout-demo">Compra demonstrativa, sem transferência de fundos.</p>
        </aside>
      </form>}
      <div className="cart-footer"><SiteFooter /></div>
    </main>
  )
}
