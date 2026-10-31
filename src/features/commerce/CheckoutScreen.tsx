import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AuthButton, useAuth } from '@/features/auth/AuthProvider'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import SiteFooter from '@/components/SiteFooter'
import searchIcon from '@/assets/icons/Search Icon.svg'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import backIcon from '@/assets/icons/Arrow - Left 2.svg'
import { useCommerce } from './CommerceProvider'
import { useWallets, type Wallet } from '@/features/profile/walletApi'
import { useProfile } from '@/features/profile/api'
import { useWalletConnection } from './walletConnection'
import { useCheckoutOrder } from './orderApi'
import type { CreateOrder } from './orderTypes'
import { readCheckoutDraft, saveCheckoutDraft, clearCheckoutDraft } from './checkoutDraft'
import './cart.css'
import './checkout.css'

export default function CheckoutScreen() {
  const search = useSearch({ from: '/checkout' })
  const navigate = useNavigate({ from: '/checkout' })
  const { user } = useAuth()
  const [initialDraft] = useState(() => readCheckoutDraft(user!.id))
  const { cart, quantities, cartItems: items, cartLoading: isPending, cartError: isError, cartBusy, quote, quoteLoading, quoteBusy, quoteError, retryQuote } = useCommerce()
  const [otherWallet, setOtherWallet] = useState(initialDraft.otherWallet)
  const [collector, setCollector] = useState(initialDraft.collector)
  const [source, setSource] = useState(initialDraft.source)
  const [alternativeAddress, setAlternativeAddress] = useState(initialDraft.alternativeAddress)
  const [outcome, setOutcome] = useState(initialDraft.outcome)
  const [notes, setNotes] = useState(initialDraft.notes)
  const savedWallets = useWallets()
  const profile = useProfile()
  const connection = useWalletConnection()
  const orderRequest = useCheckoutOrder()
  const [paymentScenario, setPaymentScenario] = useState<CreateOrder['scenario']>(initialDraft.paymentScenario)
  const address = (otherWallet ? alternativeAddress : collector.address).trim()
  const sameAddress = collector.network === 'Solana' ? connection.connection?.address === address : connection.connection?.address.toLowerCase() === address.toLowerCase()
  const connected = !!connection.connection && sameAddress && connection.connection.network === collector.network && connection.connection.provider === collector.type && !connection.error

  useEffect(() => {
    if (user) saveCheckoutDraft(user.id, { collector, otherWallet, source, alternativeAddress, outcome, paymentScenario, notes })
  }, [user, collector, otherWallet, source, alternativeAddress, outcome, paymentScenario, notes])

  function updateCollector(key: keyof typeof collector, value: string) {
    setCollector((current) => ({ ...current, [key]: value }))
    setSource('manual')
  }

  function selectWallet(value: 'manual' | 'primary' | 'secondary') {
    setSource(value)
    const saved = savedWallets.data
    const selected: Wallet | null | undefined = value === 'primary' ? saved?.primary : value === 'secondary' ? saved?.same ? saved.primary : saved?.secondary : null
    if (selected) {
      setCollector((current) => ({ ...current, ...selected, username: profile.data?.username ?? selected.profileName }))
      setOtherWallet(false)
    }
  }

  useEffect(() => {
    if (orderRequest.recoveredOrder) {
      if (user) clearCheckoutDraft(user.id)
      void navigate({ to: '/orders/$orderId', params: { orderId: orderRequest.recoveredOrder.id }, search })
    }
  }, [orderRequest.recoveredOrder, navigate, search, user])

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (orderRequest.busy || !connected || connection.busy || cartBusy || isError || !quote || quoteBusy || quoteError || items.length === 0 || items.length !== cart.length) return
    const order = await orderRequest.create({
      quoteId: quote.id, connectionId: connection.connection!.id,
      wallet: { address: connection.connection!.address, network: collector.network, provider: collector.type },
      collector: { displayName: collector.displayName, username: collector.username, email: collector.email, profileName: collector.profileName, referral: collector.referral, ens: `${collector.ens}${collector.ensSuffix}`, notes },
      scenario: paymentScenario,
    })
    if (order) {
      if (user) clearCheckoutDraft(user.id)
      void navigate({ to: '/orders/$orderId', params: { orderId: order.id }, search })
    }
  }

  return (
    <main id="topo" className="cart-page checkout-page">
      <header className="mobile-cart-header checkout-mobile-header">
        <Link to="/cart" search={search} aria-label="Voltar ao carrinho"><img src={backIcon} alt="" /></Link>
        <h1>Pagamento</h1>
        <span aria-hidden="true" />
      </header>
      <header className="cart-header">
        <Link to="/" search={search} className="cart-wordmark">KURIO</Link>
        <nav aria-label="Navegação principal"><Link to="/" search={search}>Início</Link><Link to="/" search={search} hash="catalogo" className="active">Mercado</Link><span>Criadores</span><span>Aprenda</span></nav>
        <div className="cart-header-actions"><Link to="/" search={search} hash="catalogo" aria-label="Buscar"><img src={searchIcon} alt="" /></Link><Link to="/cart" search={search} aria-label="Carrinho"><img src={cartIcon} alt="" /></Link><AuthButton /></div>
      </header>
      <nav aria-label="Breadcrumb" className="cart-breadcrumb"><Link to="/" search={search}>Início</Link><span>/</span><Link to="/" search={search} hash="catalogo">Mercado</Link><span>/</span><span aria-current="page">Pagamento</span></nav>
      <h1 className="sr-only">Pagamento</h1>
      {orderRequest.message && <p role="status">{orderRequest.message}</p>}
      {orderRequest.attempt && <section aria-label="Recuperar pedido" className="checkout-recovery"><p>Existe uma solicitação registrada. Verifique o resultado antes de iniciar outra compra.</p><button type="button" disabled={orderRequest.busy} onClick={orderRequest.recover}>Verificar pedido</button><button type="button" disabled={orderRequest.busy} onClick={() => { void orderRequest.retry().then((order) => { if (order) void navigate({ to: '/orders/$orderId', params: { orderId: order.id }, search }) }) }}>Reenviar a mesma solicitação</button></section>}
      {isPending && <p role="status">Carregando seus NFTs…</p>}
      {isError && <p role="alert">Não foi possível carregar o pedido. Volte ao carrinho e tente novamente.</p>}
      {!isPending && !isError && items.length === 0 && <div className="cart-empty">Seu carrinho está vazio. <Link to="/" search={search} hash="catalogo">Explorar NFTs</Link></div>}
      {items.length > 0 && <form className="checkout-layout" onSubmit={confirm}>
        <section className="checkout-profile" aria-labelledby="collector-title">
          <h2 id="collector-title">Perfil do colecionador</h2>
          <div className="checkout-saved-wallet">
            <label>Carteira salva<select value={source} onChange={(event) => selectWallet(event.target.value as typeof source)} disabled={connection.busy}><option value="manual">Preencher manualmente</option>{savedWallets.data?.primary && <option value="primary">Principal — {savedWallets.data.primary.alias}</option>}{(savedWallets.data?.same ? savedWallets.data.primary : savedWallets.data?.secondary) && <option value="secondary">Secundária — {savedWallets.data?.same ? savedWallets.data.primary?.alias : savedWallets.data?.secondary?.alias}</option>}</select></label>
            {savedWallets.isPending && <p role="status">Carregando carteiras salvas…</p>}
            {savedWallets.isError && <p role="alert">Não foi possível carregar suas carteiras. <button type="button" onClick={() => { void savedWallets.refetch() }}>Tentar novamente</button></p>}
            {savedWallets.isSuccess && !savedWallets.data.primary && !savedWallets.data.secondary && <p>Nenhuma carteira salva. <Link to="/wallets" search={search}>Cadastrar carteira</Link></p>}
          </div>
          <div className="checkout-fields">
            <label>Nome de exibição<span>*</span><Input name="displayName" value={collector.displayName} onChange={(event) => updateCollector('displayName', event.target.value)} autoComplete="name" required /></label>
            <label>Nome de usuário<span>*</span><Input name="username" value={collector.username} onChange={(event) => updateCollector('username', event.target.value)} autoComplete="username" required /></label>
            <label>Rede<span>*</span><select name="network" value={collector.network} onChange={(event) => updateCollector('network', event.target.value)} required><option value="" disabled>Selecione uma rede</option><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></label>
            <label>Nome do perfil<span>*</span><Input name="profileName" value={collector.profileName} onChange={(event) => updateCollector('profileName', event.target.value)} required /></label>
            <label>Endereço da carteira<span>*</span><Input name="walletAddress" value={collector.address} onChange={(event) => updateCollector('address', event.target.value)} placeholder="Endereço 0x da carteira" required /></label>
            <label className="checkout-secondary-wallet"><span className="sr-only">ENS ou carteira secundária</span><Input name="secondaryWallet" value={collector.secondaryAddress} onChange={(event) => updateCollector('secondaryAddress', event.target.value)} placeholder="ENS ou carteira secundária (opcional)" /></label>
            <label>Tipo de carteira<span>*</span><select name="walletType" value={collector.type} onChange={(event) => updateCollector('type', event.target.value)} required><option value="" disabled>Selecione uma carteira</option><option>MetaMask</option><option>WalletConnect</option><option>Coinbase Wallet</option></select></label>
            <label>Código de indicação<span>*</span><Input name="referral" value={collector.referral} onChange={(event) => updateCollector('referral', event.target.value)} required /></label>
            <label>E-mail<span>*</span><Input name="email" type="email" value={collector.email} onChange={(event) => updateCollector('email', event.target.value)} autoComplete="email" required /></label>
            <label>Nome ENS<span>*</span><div className="checkout-ens-field"><select name="ensSuffix" className="checkout-ens" aria-label="Sufixo ENS" value={collector.ensSuffix} onChange={(event) => updateCollector('ensSuffix', event.target.value)}><option>.eth</option><option>.crypto</option></select><Input name="ens" aria-label="Nome ENS" value={collector.ens} onChange={(event) => updateCollector('ens', event.target.value)} required /></div></label>
          </div>
          <label className="checkout-other"><input type="checkbox" checked={otherWallet} onChange={(event) => setOtherWallet(event.target.checked)} />Usar outra carteira?</label>
          {otherWallet && <label className="checkout-alternative">Outra carteira<Input name="alternativeWallet" value={alternativeAddress} onChange={(event) => setAlternativeAddress(event.target.value)} placeholder="Endereço da outra carteira" required /></label>}
          <label className="checkout-notes">Observação do colecionador (opcional)<Textarea name="notes" rows={6} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
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
          <fieldset className="checkout-wallets" disabled={connection.busy}><legend>Carteira e rede</legend>{[['WalletConnect', 'METAMASK · WALLETCONNECT · COINBASE'], ['MetaMask', 'MetaMask'], ['Coinbase Wallet', 'Coinbase Wallet']].map(([value, label]) => <label key={value} className={collector.type === value ? 'selected' : ''}><input type="radio" name="paymentWallet" value={value} checked={collector.type === value} onChange={() => updateCollector('type', value)} />{label}</label>)}</fieldset>
          <div className="checkout-connection">
            <label>Resposta da carteira (demonstração)<select value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)} disabled={connection.busy}><option value="accept">Autorizar conexão</option><option value="reject">Recusar conexão</option></select></label>
            <button type="button" disabled={connection.busy} onClick={() => connection.connect({ ...(source !== 'manual' && !otherWallet ? { slot: source } : {}), address, network: collector.network, provider: collector.type, outcome })}>{connection.busy ? 'Aguarde…' : 'Conectar carteira'}</button>
            {connection.connection && <><p>Conectada: {connection.connection.provider} · {connection.connection.network}<br /><span className="checkout-connected-address">{connection.connection.address}</span></p><button type="button" onClick={connection.disconnect} disabled={connection.busy}>Desconectar</button></>}
            {connection.connection && !connected && <p role="status">Os dados mudaram. Conecte a carteira selecionada para continuar.</p>}
            {connection.message && <p role="status">{connection.message}</p>}
            {connection.error && <p role="alert">Não foi possível verificar a conexão. <button type="button" onClick={connection.retry}>Tentar novamente</button></p>}
          </div>
          <label className="checkout-payment-scenario">Resultado do pagamento (demonstração)<select value={paymentScenario} onChange={(event) => setPaymentScenario(event.target.value as typeof paymentScenario)} disabled={orderRequest.busy}><option value="confirmed">Confirmar pagamento</option><option value="rejected">Recusar pagamento</option><option value="timeout">Demorar resposta e recuperar pedido</option></select></label>
          <Button variant="kurio" size="design" className="checkout-confirm" type="submit" disabled={orderRequest.busy || !!orderRequest.attempt || !connected || connection.busy || cartBusy || quoteBusy || !!quoteError || !quote || items.length !== cart.length}>{orderRequest.busy ? 'Processando…' : 'Confirmar compra'}</Button>
          <p className="checkout-demo">Compra demonstrativa, sem transferência de fundos.</p>
        </aside>
      </form>}
      <div className="cart-footer"><SiteFooter /></div>
    </main>
  )
}
