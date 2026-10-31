import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { useNFTs } from '@/features/catalog/api'
import searchIcon from '@/assets/icons/Search Icon.svg'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import loginIcon from '@/assets/icons/Logout.svg'
import { useCommerce } from './CommerceProvider'
import './cart.css'

export default function CartPage() {
  const search = useSearch({ from: '/cart' })
  const { cart, removeFromCart } = useCommerce()
  const { data, isPending, isError } = useNFTs({ page: 1, pageSize: 24 })
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const items = data?.items.filter((item) => cart.includes(item.id)) ?? []

  function changeQuantity(id: string, amount: number) {
    setQuantities((current) => ({ ...current, [id]: Math.max(1, (current[id] ?? 1) + amount) }))
  }

  return (
    <main className="cart-page">
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
          <button type="button"><img src={loginIcon} alt="" />Entrar</button>
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="cart-breadcrumb">
        <Link to="/" search={search}>Início</Link><span>/</span>
        <Link to="/" search={search} hash="catalogo">Mercado</Link><span>/</span>
        <span aria-current="page">Carrinho</span>
      </nav>
      <h1 className="sr-only">Carrinho de NFTs</h1>
      {isPending && <p role="status">Carregando carrinho…</p>}
      {isError && <p role="alert">Não foi possível carregar o carrinho.</p>}
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
                  const [whole, fraction = ''] = item.priceEth.split('.')
                  const totalCents = (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))) * BigInt(quantity)
                  const total = `${totalCents / 100n}.${String(totalCents % 100n).padStart(2, '0')}`
                  return (
                    <tr key={item.id}>
                      <td><Link className="cart-nft" to="/nft/$nftId" params={{ nftId: item.id }} search={search}><img src={item.imageUrl} alt="" /><span><strong>{item.name}</strong><small>ID do token: #{token.padStart(4, '0')}</small></span></Link></td>
                      <td className="cart-price">{item.priceEth} ETH</td>
                      <td><div className="cart-quantity"><button type="button" aria-label={`Diminuir edições de ${item.name}`} disabled={quantity === 1} onClick={() => changeQuantity(item.id, -1)}>−</button><span>{quantity}</span><button type="button" aria-label={`Aumentar edições de ${item.name}`} onClick={() => changeQuantity(item.id, 1)}>+</button></div></td>
                      <td className="cart-line-total">{total} ETH</td>
                      <td><button type="button" className="cart-remove" aria-label={`Remover ${item.name}`} onClick={() => removeFromCart(item.id)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 9l1 12h10l1-12" /></svg></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Link to="/checkout" search={search} className="cart-checkout-link">Continuar para pagamento →</Link>
          </div>
        </div>
      )}
    </main>
  )
}
