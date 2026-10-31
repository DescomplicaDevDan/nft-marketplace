import { Link, useSearch } from '@tanstack/react-router'
import { useNFTs } from '@/features/catalog/api'
import type { CatalogSearch } from '@/features/catalog/types'
import { useCommerce } from './CommerceProvider'

type Mode = 'cart' | 'favorites'

function StoredItemsPage({ mode, search }: { mode: Mode; search: CatalogSearch }) {
  const { data, isPending, isError } = useNFTs({ page: 1, pageSize: 24 })
  const { cart, favorites, addToCart, removeFromCart, toggleFavorite } = useCommerce()
  const ids = mode === 'cart' ? cart : favorites
  const items = data?.items.filter((nft) => ids.includes(nft.id)) ?? []
  const isCart = mode === 'cart'
  const title = isCart ? 'Carrinho' : 'Favoritos'

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-5 py-8 text-[#f5f1eb] sm:px-8 lg:px-[120px]">
      <header className="mb-10 flex items-center justify-between border-b border-[#49372b] pb-5">
        <Link to="/" search={search} className="font-mono text-sm text-[#b8aa9b] hover:text-[#f5f1eb]">KURIO</Link>
        <nav className="flex gap-5 font-mono text-sm">
          <Link to="/favorites" search={search} className={!isCart ? 'text-[#e69a55]' : 'text-[#b8aa9b]'}>Favoritos ({favorites.length})</Link>
          <Link to="/cart" search={search} className={isCart ? 'text-[#e69a55]' : 'text-[#b8aa9b]'}>Carrinho ({cart.length})</Link>
          <Link to="/orders" search={search} className="text-[#b8aa9b] hover:text-[#e69a55]">Pedidos</Link>
        </nav>
      </header>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-mono text-3xl font-bold">{title}</h1>
        {isCart && items.length > 0 && (
          <Link to="/checkout" search={search} className="bg-[#e69a55] px-5 py-3 font-bold text-[#1b1310]">Finalizar pedido</Link>
        )}
      </div>
      {isPending && <p role="status" className="text-[#b8aa9b]">Carregando itens…</p>}
      {isError && <p role="alert" className="text-[#e69a55]">Não foi possível carregar seus itens.</p>}
      {!isPending && !isError && items.length === 0 && (
        <div className="border border-[#49372b] p-8 text-center">
          <p className="mb-4 text-[#b8aa9b]">{isCart ? 'Seu carrinho está vazio.' : 'Você ainda não salvou NFTs.'}</p>
          <Link to="/" search={search} className="text-[#e69a55] underline">Explorar o catálogo</Link>
        </div>
      )}

      {items.length > 0 && (
        <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((nft) => (
            <li key={nft.id} className="bg-[#1b1310] p-3">
              <Link to="/nft/$nftId" params={{ nftId: nft.id }} search={search} className="block">
                <img src={nft.imageUrl} alt={nft.name} className="aspect-square w-full object-cover" />
                <div className="flex justify-between gap-3 py-3 font-mono">
                  <span className="truncate">{nft.name}</span>
                  <span className="shrink-0 text-[#e69a55]">{nft.priceEth} ETH</span>
                </div>
              </Link>
              <div className="flex gap-3">
                {isCart ? (
                  <button type="button" onClick={() => removeFromCart(nft.id)} className="text-sm text-[#b8aa9b] underline">Remover</button>
                ) : (
                  <>
                    <button type="button" onClick={() => addToCart(nft.id)} disabled={cart.includes(nft.id)} className="text-sm text-[#e69a55] underline disabled:opacity-50">
                      {cart.includes(nft.id) ? 'No carrinho' : 'Adicionar ao carrinho'}
                    </button>
                    <button type="button" onClick={() => toggleFavorite(nft.id)} className="text-sm text-[#b8aa9b] underline">Remover dos favoritos</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export function CartPage() {
  const search = useSearch({ from: '/cart' })
  return <StoredItemsPage mode="cart" search={search} />
}

export function FavoritesPage() {
  const search = useSearch({ from: '/favorites' })
  return <StoredItemsPage mode="favorites" search={search} />
}
