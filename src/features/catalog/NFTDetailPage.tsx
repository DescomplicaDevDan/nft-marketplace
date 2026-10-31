import { Link, useParams, useSearch } from '@tanstack/react-router'
import kurioWordmark from '@/assets/img/Logo.svg'
import { useNFT } from './api'
import { useCommerce } from '@/features/commerce/CommerceProvider'

export default function NFTDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const search = useSearch({ from: '/nft/$nftId' })
  const { data: nft, isPending, isError } = useNFT(nftId)
  const { favorites, cart, toggleFavorite, addToCart } = useCommerce()

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-5 py-8 text-[#f5f1eb] sm:px-8 lg:px-[120px]">
      <header className="mb-10 flex items-center justify-between border-b border-[#49372b] pb-5">
        <Link to="/" search={search} aria-label="Kurio — início">
          <img src={kurioWordmark} alt="KURIO" className="h-[22px] w-[100px] sm:h-[35px] sm:w-[160px]" />
        </Link>
        <Link to="/" search={search} className="font-mono text-sm text-[#e69a55] hover:text-[#f5f1eb]">
          ← Voltar ao mercado
        </Link>
      </header>

      {isPending && <p role="status" className="py-16 text-center text-[#b8aa9b]">Carregando NFT…</p>}

      {isError && (
        <div role="alert" className="py-16 text-center">
          <h1 className="mb-3 font-mono text-2xl font-bold">NFT não encontrado</h1>
          <Link to="/" search={search} className="text-[#e69a55] underline">Voltar ao catálogo</Link>
        </div>
      )}

      {nft && (
        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <img src={nft.imageUrl} alt={nft.name} className="w-full rounded-2xl object-cover" />
          <div className="font-mono">
            <p className="mb-3 text-sm text-[#e69a55]">{nft.collection}</p>
            <h1 className="mb-3 text-3xl font-bold sm:text-4xl">{nft.name}</h1>
            <p className="mb-8 text-[#b8aa9b]">Criado por {nft.creator}</p>

            <div className="mb-8 grid grid-cols-2 gap-4 border-y border-[#49372b] py-5">
              <div>
                <p className="mb-1 text-xs text-[#b8aa9b]">Preço atual</p>
                <p className="text-xl font-bold text-[#e69a55]">{nft.priceEth} ETH</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-[#b8aa9b]">Disponíveis</p>
                <p className="text-xl font-bold">{nft.available}</p>
              </div>
            </div>

            <div className="mb-8 flex flex-wrap gap-3 font-sans text-sm">
              <button
                type="button"
                aria-pressed={favorites.includes(nft.id)}
                onClick={() => toggleFavorite(nft.id)}
                className="border border-[#e69a55] px-4 py-3 text-[#e69a55] hover:bg-[#211511]"
              >
                {favorites.includes(nft.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              </button>
              <button
                type="button"
                onClick={() => addToCart(nft.id)}
                disabled={cart.includes(nft.id)}
                className="bg-[#e69a55] px-4 py-3 font-bold text-[#1b1310] hover:brightness-110 disabled:cursor-default disabled:opacity-60"
              >
                {cart.includes(nft.id) ? 'Adicionado ao carrinho' : 'Adicionar ao carrinho'}
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
              <div><dt className="text-xs text-[#b8aa9b]">Categoria</dt><dd className="mt-1">{nft.category}</dd></div>
              <div><dt className="text-xs text-[#b8aa9b]">Rede</dt><dd className="mt-1">{nft.network}</dd></div>
              <div><dt className="text-xs text-[#b8aa9b]">Vendas</dt><dd className="mt-1">{nft.sales}</dd></div>
              <div><dt className="text-xs text-[#b8aa9b]">Criado em</dt><dd className="mt-1">{new Date(nft.createdAt).toLocaleDateString('pt-BR')}</dd></div>
            </dl>
          </div>
        </section>
      )}
    </main>
  )
}
