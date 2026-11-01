import { AuthButton } from '@/features/auth/AuthProvider'
import { useState } from 'react'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import searchIcon from '@/assets/icons/Search Icon.svg'
import linkedinIcon from '@/assets/icons/linkedin.svg'
import twitterIcon from '@/assets/icons/twitter.svg'
import kurioWordmark from '@/assets/img/Logo.svg'
import { useCommerce } from '@/features/commerce/CommerceProvider'
import SiteFooter from '@/components/SiteFooter'
import { useNFT, useNFTs } from './api'
import { MobileNFTDetail } from './MobileNFTDetail'
import { isAxiosError } from 'axios'
import { defaultEditionId, editionLineId } from './types'

const description = [
  'Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.',
  'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
]

export default function NFTDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const search = useSearch({ from: '/nft/$nftId' })
  const { data: nft, isPending, isError, error, refetch } = useNFT(nftId)
  const { data: catalog } = useNFTs({ page: 1, pageSize: 24 })
  const { favorites, cart, quantities, toggleFavorite, addToCart, cartBusy } = useCommerce()
  const [selectedImage, setSelectedImage] = useState(1)
  const [quantityByNft, setQuantityByNft] = useState<Record<string, number>>({})
  const [editionByNft, setEditionByNft] = useState<Record<string, string>>({})
  const quantity = quantityByNft[nftId] ?? 1
  const setQuantity = (update: number | ((current: number) => number)) => setQuantityByNft((current) => ({ ...current, [nftId]: typeof update === 'function' ? update(current[nftId] ?? 1) : update }))
  const selectedEditionId = editionByNft[nftId]
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')
  const [relatedPage, setRelatedPage] = useState(1)
  const [zoomOpen, setZoomOpen] = useState(false)
  const isFavorite = nft ? favorites.includes(nft.id) : false
  const selectedEdition = nft?.editions?.find((edition) => edition.id === selectedEditionId) ?? nft?.editions?.find((edition) => edition.id === defaultEditionId(nft)) ?? nft?.editions?.find((edition) => edition.available > 0)
  const lineId = nft && selectedEdition ? editionLineId(nft.id, selectedEdition.id) : ''
  const editionRemaining = selectedEdition ? Math.max(0, selectedEdition.available - (quantities[lineId] ?? 0)) : 0
  const tokenNumber = nft?.name.match(/#(\d+)$/)?.[1] ?? '0042'
  const relatedItems = catalog?.items.filter((item) => item.id !== nftId) ?? []
  const visibleRelatedItems = relatedItems.slice(relatedPage * 2, relatedPage * 2 + 5)

  return (
    <>
    <MobileNFTDetail key={nftId} nft={nft} loading={isPending} error={isError} notFound={isAxiosError(error) && error.response?.status === 404} retry={() => { void refetch() }} />
    <main className="desktop-nft-detail nft-detail-page mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-12 bg-[#140d0a] px-5 pt-6 pb-6 font-mono text-[#f5f1eb] sm:px-8 md:gap-24 min-[1440px]:px-[120px]">
      {isPending && <section role="status" aria-label="Carregando detalhe do NFT" className="grid gap-8 lg:grid-cols-[96px_450px_minmax(0,1fr)]">
        <div className="hidden gap-4 lg:grid">{Array.from({ length: 4 }, (_, index) => <div key={index} className="kurio-skeleton size-24 rounded-lg" />)}</div>
        <div className="kurio-skeleton aspect-square w-full rounded-2xl" />
        <div className="space-y-4"><div className="kurio-skeleton h-8 w-3/4 rounded" /><div className="kurio-skeleton h-6 w-1/3 rounded" /><div className="kurio-skeleton h-24 rounded" /><div className="kurio-skeleton h-12 w-full rounded" /></div>
      </section>}
      {isError && <div role="alert" className="py-16 text-center"><h1 className="mb-3 text-2xl font-bold">NFT não encontrado</h1><Link to="/" search={search} className="text-[#e89b55] underline">Voltar ao catálogo</Link></div>}

      {nft && (
        <>
          <section className="nft-detail-top flex flex-col gap-8">
            <header className="nft-detail-header grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-[#49372b] pb-2 lg:grid-cols-[1fr_auto_1fr]">
              <Link to="/" search={search} aria-label="Kurio — início" className="justify-self-start"><img src={kurioWordmark} alt="KURIO" className="h-[22px] w-[100px] sm:h-[35px] sm:w-[160px]" /></Link>
              <nav aria-label="Navegação principal" className="nft-detail-nav flex min-w-0 flex-wrap items-center justify-center gap-x-1 text-[9px] sm:gap-x-3 sm:text-xs lg:gap-7 lg:text-sm">
                <Link to="/" search={search} className="text-[#ead8c5] hover:text-[#e89b55]">Início</Link>
                <Link to="/" search={search} hash="catalogo" className="border-b-2 border-[#e89b55] py-2 font-bold text-[#e89b55]">Mercado</Link>
                <span className="text-[#ead8c5]">Criadores</span><span className="text-[#ead8c5]">Aprenda</span>
              </nav>
              <div className="flex items-center justify-self-end gap-1 sm:gap-3 lg:gap-4">
                <button type="button" aria-label="Buscar" className="p-1"><img src={searchIcon} alt="" className="size-4" /></button>
                <Link to="/cart" search={search} aria-label="Abrir carrinho" className="relative p-1"><img src={cartIcon} alt="" className="size-4" />{cart.length === 6 && <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-[#d28a4c] text-[8px] font-bold text-[#140d0a]">6</span>}</Link>
                <AuthButton />
              </div>
            </header>

            <div className="space-y-4">
              <nav aria-label="Breadcrumb" className="text-sm"><Link to="/" search={search} className="hover:text-[#e89b55]">Início</Link><span className="px-2 text-[#b8aa9b]">/</span><Link to="/" search={search} hash="catalogo" className="hover:text-[#e89b55]">Mercado</Link></nav>
              <div className="nft-detail-overview grid items-start gap-4 sm:gap-6 sm:grid-cols-[64px_minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-cols-[96px_450px_minmax(0,1fr)]">
                <div className="nft-detail-thumbnails order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col sm:gap-3 lg:gap-4">
                  {[0, 1, 2, 3].map((imageIndex) => <button key={imageIndex} type="button" onClick={() => setSelectedImage(imageIndex)} aria-label={`Ver imagem ${imageIndex + 1}`} aria-pressed={selectedImage === imageIndex} className={`nft-detail-thumbnail size-14 flex-none overflow-hidden rounded-lg border p-1 sm:size-16 lg:size-24 ${selectedImage === imageIndex ? 'border-[#e89b55]' : 'border-transparent'}`}><img src={nft.imageUrl} alt="" className="size-full rounded-md object-cover" /></button>)}
                </div>
                <div className="nft-detail-artwork relative order-1 flex aspect-square w-full min-w-0 items-center justify-center bg-[#241612] p-4 sm:order-2 lg:p-5">
                  <img src={nft.imageUrl} alt={nft.name} className="size-full rounded-[20px] object-cover" />
                  <button type="button" aria-label="Ampliar imagem" onClick={() => setZoomOpen(true)} className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-[#140d0a]/80"><img src={searchIcon} alt="" className="size-4" /></button>
                </div>
                <div className="nft-detail-info order-3 min-w-0 space-y-3">
                  <h1 className="text-2xl font-bold leading-7">{nft.name}</h1>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#49372b] pb-2">
                    <p className="nft-detail-price text-xl font-bold text-[#e89b55]">{selectedEdition?.priceEth ?? nft.priceEth} ETH</p>
                    <p className="text-xs text-[#cfb28c]" aria-label="5 estrelas, 19 avaliações"><span className="mr-1 text-[#d28a4c]">★★★★★</span>19 avaliações de colecionadores</p>
                  </div>
                  <div><h2 className="mb-2 text-sm font-bold">Sobre este NFT:</h2><p className="text-sm leading-6 text-[#cfb28c]">Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.</p></div>
                  <div><h2 className="mb-2 text-sm font-bold">Edição:</h2><div className="flex flex-wrap gap-2 text-xs">{(nft.editions ?? []).map((edition) => <button key={edition.id} type="button" aria-pressed={edition.id === selectedEdition?.id} title={`${edition.available} disponíveis`} disabled={edition.available < 1} onClick={() => { setEditionByNft((current) => ({ ...current, [nft.id]: edition.id })); setQuantity(1) }} className={`rounded-full border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 ${edition.id === selectedEdition?.id ? 'border-[#d28a4c] text-[#e89b55]' : 'border-[#49372b]'}`}>{edition.label}</button>)}</div></div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3"><button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid size-10 place-items-center rounded-full bg-[#d28a4c] text-xl font-bold text-[#140d0a] disabled:opacity-50">−</button><span>{quantity}</span><button type="button" aria-label="Aumentar quantidade" disabled={quantity >= editionRemaining} onClick={() => setQuantity((value) => Math.min(editionRemaining, value + 1))} className="grid size-10 place-items-center rounded-full bg-[#d28a4c] text-xl font-bold text-[#140d0a] disabled:opacity-50">+</button></div>
                    <div className="flex gap-2"><button type="button" disabled={cartBusy || !selectedEdition || editionRemaining < 1} onClick={() => { if (selectedEdition) void addToCart(nft.id, Math.min(quantity, editionRemaining), selectedEdition.id) }} className="min-w-[128px] rounded bg-[#d28a4c] px-6 py-2 text-xs font-bold text-[#140d0a] disabled:opacity-50">COMPRAR</button><button type="button" aria-pressed={isFavorite} onClick={() => toggleFavorite(nft.id)} className="rounded border border-[#d28a4c] px-4 py-2 text-xs text-[#d28a4c]">♡ {isFavorite ? 'Favoritado' : 'Favoritar'}</button></div>
                  </div>
                  <div className="space-y-2 pt-1 text-sm text-[#b39463]"><p>ID do token: #{tokenNumber.padStart(4, '0')}</p><p>Coleção: Kurio Apes</p><p>Atributos: Óculos, Esmeralda, Raro</p><p className="flex items-center gap-2 pt-1 font-bold text-[#f5f1eb]">Compartilhar este NFT:<img src={linkedinIcon} alt="LinkedIn" className="size-4" /><span className="text-sm">✉</span><img src={twitterIcon} alt="Twitter" className="size-4" /></p></div>
                </div>
              </div>
            </div>
          </section>

          <section className="nft-detail-description" aria-label="Informações do NFT">
            <div role="tablist" aria-label="Detalhes e avaliações" className="flex gap-8 border-b border-[#49372b] text-base">
              <button type="button" role="tab" aria-selected={activeTab === 'details'} onClick={() => setActiveTab('details')} className={`pb-2 ${activeTab === 'details' ? 'border-b-2 border-[#e89b55] font-bold text-[#e89b55]' : 'text-[#f5f1eb]'}`}>Detalhes do NFT</button>
              <button type="button" role="tab" aria-selected={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} className={`pb-2 ${activeTab === 'reviews' ? 'border-b-2 border-[#e89b55] font-bold text-[#e89b55]' : 'text-[#f5f1eb]'}`}>Avaliações de colecionadores (19)</button>
            </div>
            {activeTab === 'details' ? <div className="space-y-6 pt-3 text-sm leading-6 text-[#b39463]">{description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<p><strong className="text-[#f5f1eb]">Rede:</strong><br />Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.</p><p><strong className="text-[#f5f1eb]">Contrato:</strong><br />Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</p><p><strong className="text-[#f5f1eb]">Direitos autorais:</strong><br />0x7A42...19E8 · Contrato inteligente ERC-721 verificado.</p></div> : <div className="py-5 text-sm text-[#b39463]">★★★★★　4,9 de 5 — 19 avaliações de colecionadores</div>}
          </section>

          <section aria-labelledby="related-title">
            <h2 id="related-title" className="border-b border-[#49372b] pb-2 text-base font-bold text-[#e89b55]">Mais desta coleção</h2>
            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
              {visibleRelatedItems.map((item) => (
                <Link key={item.id} to="/nft/$nftId" params={{ nftId: item.id }} search={search} className="group min-w-0">
                  <div className="flex h-[250px] items-center justify-center bg-[#241612] p-4 transition-colors group-hover:bg-[#2b1b15]">
                    <img src={item.imageUrl} alt={item.name} className="max-h-full max-w-full rounded-xl object-contain" loading="lazy" />
                  </div>
                  <h3 className="mt-3 truncate text-sm leading-4">{item.name}</h3>
                  <p className="mt-1 text-sm font-bold leading-4 text-[#e89b55]">{item.priceEth} ETH</p>
                </Link>
              ))}
            </div>
            <nav aria-label="Páginas de NFTs relacionados" className="mt-7 flex justify-center gap-2">
              {[0, 1, 2].map((page) => (
                <button key={page} type="button" aria-label={`Mostrar grupo ${page + 1} de NFTs`} aria-pressed={relatedPage === page} onClick={() => setRelatedPage(page)} className={`size-3 rounded-full border border-[#d28a4c] ${relatedPage === page ? 'bg-[#d28a4c]' : 'bg-transparent hover:bg-[#d28a4c]/40'}`} />
              ))}
            </nav>
          </section>
          <SiteFooter />
        </>
      )}
      {zoomOpen && nft && <button type="button" aria-label="Fechar imagem ampliada" onClick={() => setZoomOpen(false)} className="fixed inset-0 z-50 grid place-items-center bg-[#140d0a]/90 p-8"><img src={nft.imageUrl} alt={nft.name} className="max-h-full max-w-full rounded-2xl object-contain" /></button>}
    </main>
    </>
  )
}
