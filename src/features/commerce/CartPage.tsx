import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AuthButton } from '@/features/auth/AuthProvider'
import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { useNFTs } from '@/features/catalog/api'
import searchIcon from '@/assets/icons/Search Icon.svg'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import { useCommerce } from './CommerceProvider'
import SiteFooter from '@/components/SiteFooter'
import './cart.css'

export default function CartPage() {
  const search = useSearch({ from: '/cart' })
  const { cartItems: items, cartLoading: isPending, cartError: isError, cartBusy, retryCart, removeFromCart, quantities, setCartQuantity, quote, quoteLoading, quoteError, quoteBusy, retryQuote, applyCoupon, couponMessage } = useCommerce()
  const { data } = useNFTs({ page: 1, pageSize: 24 })
  const [promoCode, setPromoCode] = useState('')
  const [recommendationPage, setRecommendationPage] = useState(1)
  const recommendations = data?.items.slice(recommendationPage * 3, recommendationPage * 3 + 5) ?? []
  const cannotCheckout = cartBusy || isError || !quote || quoteBusy || !!quoteError

  function changeQuantity(id: string, amount: number) {
    setCartQuantity(id, Math.max(1, (quantities[id] ?? 1) + amount))
  }

  return (
    <main id="topo" className="cart-page">
      <header className="cart-header">
        <Link to="/" search={search} className="cart-wordmark">KURIO</Link>
        <nav aria-label="Navegação principal">
          <Link to="/" search={search}>Início</Link>
          <Link to="/" search={search} hash="catalogo" className="active">Mercado</Link>
          <span>Criadores</span><span>Aprenda</span>
        </nav>
        <div className="cart-header-actions">
          <Link to="/" search={search} hash="catalogo" aria-label="Buscar NFTs"><img src={searchIcon} alt="" /></Link>
          <Link to="/cart" search={search} aria-label="Carrinho"><img src={cartIcon} alt="" /></Link>
          <AuthButton />
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="cart-breadcrumb">
        <Link to="/" search={search}>Início</Link><span>/</span>
        <Link to="/" search={search} hash="catalogo">Mercado</Link><span>/</span>
        <span aria-current="page">Carrinho</span>
      </nav>
      <h1 className="sr-only">Carrinho de NFTs</h1>
      {isPending && <p role="status">Carregando carrinho…</p>}
      {isError && <div role="alert"><p>Não foi possível carregar o carrinho.</p><button type="button" onClick={retryCart}>Tentar novamente</button></div>}
      {!isPending && !isError && items.length === 0 && <div className="cart-empty"><p>Seu carrinho está vazio.</p><Link to="/" search={search} hash="catalogo">Explorar NFTs</Link></div>}
      {items.length > 0 && (
        <div className="cart-content">
          <div className="cart-table-scroll">
            <table className="cart-table">
              <thead><tr><th scope="col">NFTs</th><th scope="col">Preço</th><th scope="col">Edições</th><th scope="col">Total</th><th scope="col"><span className="sr-only">Remover</span></th></tr></thead>
              <tbody>
                {items.map((item) => {
                  const quantity = quantities[item.id] ?? 1
                  const token = item.name.match(/#(\d+)$/)?.[1] ?? ''
                  const total = quote?.items.find((line) => line.id === item.id)?.lineTotalEth ?? '—'
                  return (
                    <tr key={item.id}>
                      <td><Link className="cart-nft" to="/nft/$nftId" params={{ nftId: item.id }} search={search}><img src={item.imageUrl} alt="" /><span><strong>{item.name}</strong><small>ID do token: #{token.padStart(4, '0')}</small></span></Link></td>
                      <td className="cart-price">{item.priceEth} ETH</td>
                      <td><div className="cart-quantity"><button type="button" aria-label={`Diminuir edições de ${item.name}`} disabled={cartBusy || quantity === 1} onClick={() => changeQuantity(item.id, -1)}>−</button><span>{quantity}</span><button type="button" aria-label={`Aumentar edições de ${item.name}`} disabled={cartBusy || quantity >= item.available} onClick={() => changeQuantity(item.id, 1)}>+</button></div></td>
                      <td className="cart-line-total">{total} ETH</td>
                      <td><button type="button" className="cart-remove" aria-label={`Remover ${item.name}`} onClick={() => removeFromCart(item.id)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 9l1 12h10l1-12" /></svg></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <aside className="cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">Resumo da carteira</h2>
            <form className="cart-promo" onSubmit={(event) => { event.preventDefault(); applyCoupon(promoCode) }}>
              <label htmlFor="cart-promo-code">Código promocional</label>
              <div><Input id="cart-promo-code" value={promoCode} onChange={(event) => setPromoCode(event.target.value)} aria-describedby={couponMessage ? 'cart-promo-message' : undefined} placeholder="Digite o código promocional..." disabled={cartBusy} /><Button variant="kurio" size="design" type="submit" disabled={cartBusy || quoteBusy}>Aplicar</Button></div>
              {couponMessage && <p id="cart-promo-message" role="status">{couponMessage}</p>}
            </form>
            {quote?.coupon && <p className="cart-applied-coupon">{quote.coupon} <button type="button" disabled={cartBusy || quoteBusy} onClick={() => applyCoupon(null)}>Remover cupom</button></p>}
            {(quoteLoading || quoteBusy) && <p role="status">Atualizando total…</p>}
            {quoteError && <div role="alert"><p>{quoteError}</p><button type="button" onClick={retryQuote}>Recalcular total</button></div>}
            <dl className="cart-summary-values" aria-live="polite">
              <div><dt>Subtotal</dt><dd>{quote?.subtotalEth ?? '—'} ETH</dd></div>
              <div><dt>Desconto do lançamento</dt><dd>(−) {quote?.discountEth ?? '—'} ETH</dd></div>
              <div><dt>Taxa de rede</dt><dd>{quote?.networkFeeEth ?? '—'} ETH</dd></div>
            </dl>
            <p className="cart-fee-note">Taxa estimada</p>
            <div className="cart-summary-total"><strong>Total</strong><strong>{quote?.totalEth ?? '—'} ETH</strong></div>
            <Link to="/checkout" search={search} className="cart-finalize" aria-disabled={cannotCheckout} onClick={(event) => { if (cannotCheckout) event.preventDefault() }}>Conectar e finalizar</Link>
            <Link to="/" search={search} hash="catalogo" className="cart-continue">Continuar explorando</Link>
          </aside>
        </div>
      )}
      {recommendations.length > 0 && (
        <section className="cart-recommendations" aria-labelledby="cart-recommendations-title">
          <h2 id="cart-recommendations-title">Colecionadores também viram</h2>
          <div className="cart-recommendation-grid">
            {recommendations.map((item) => (
              <Link key={item.id} to="/nft/$nftId" params={{ nftId: item.id }} search={search} className="cart-recommendation-card">
                <div className="cart-recommendation-artwork">
                  <img src={item.imageUrl} alt={item.name} loading="lazy" style={{ aspectRatio: `${item.imageFrame?.width ?? 250} / ${item.imageFrame?.height ?? 250}` }} />
                </div>
                <h3>{item.name}</h3>
                <p>{item.priceEth} ETH</p>
              </Link>
            ))}
          </div>
          <nav aria-label="Grupos de NFTs recomendados" className="cart-recommendation-dots">
            {[0, 1, 2].map((page) => <button key={page} type="button" aria-label={`Mostrar grupo ${page + 1}`} aria-pressed={recommendationPage === page} onClick={() => setRecommendationPage(page)} />)}
          </nav>
        </section>
      )}
      <div className="cart-footer"><SiteFooter /></div>
    </main>
  )
}
