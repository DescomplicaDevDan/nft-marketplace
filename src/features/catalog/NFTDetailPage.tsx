import { useState } from 'react'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import cartIcon from '@/assets/icons/Cart Icon.svg'
import loginIcon from '@/assets/icons/Logout.svg'
import searchIcon from '@/assets/icons/Search Icon.svg'
import linkedinIcon from '@/assets/icons/linkedin.svg'
import twitterIcon from '@/assets/icons/twitter.svg'
import kurioWordmark from '@/assets/img/Logo.svg'
import { useCommerce } from '@/features/commerce/CommerceProvider'
import { footerGroups, footerHighlights, socialLinks } from '@/mocks/data/homeContent'
import { useNFT, useNFTs } from './api'

const description = [
  'Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.',
  'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
]

function DetailFooter() {
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false)

  return (
    <section className="flex flex-col gap-3">
      <footer className="bg-[#241612] font-mono text-[#f5f1eb]">
        <section aria-label="Benefícios e novidades" className="grid grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:px-10">
          {footerHighlights.map((item) => (
            <article key={item.title} className="border-[#9b6031] lg:border-r lg:px-4 first:lg:pl-0">
              <span className="mb-3 grid size-16 place-items-center rounded-full bg-[#d28a4c] text-lg font-bold text-[#140d0a]">{item.icon}</span>
              <h2 className="mb-2 text-sm font-bold">{item.title}</h2>
              <p className="max-w-[220px] text-xs leading-5 text-[#b8aa9b]">{item.description}</p>
            </article>
          ))}
          <form className="lg:pl-4" onSubmit={(event) => { event.preventDefault(); setNewsletterSubmitted(true) }}>
            <label htmlFor="detail-newsletter-email" className="mb-3 block text-sm font-bold leading-tight">Antecipe-se ao próximo lançamento</label>
            <div className="flex">
              <input id="detail-newsletter-email" type="email" required placeholder="digite seu e-mail..." className="min-w-0 flex-1 rounded-l border border-[#49372b] bg-[#140d0a] px-3 py-2 text-xs outline-none placeholder:text-[#b8aa9b] focus-visible:ring-2 focus-visible:ring-[#e89b55]" />
              <button type="submit" className="rounded-r bg-[#d28a4c] px-3 text-xs font-bold text-[#140d0a]">Enviar</button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#b8aa9b]">Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
            {newsletterSubmitted && <p role="status" className="mt-2 text-xs text-[#e89b55]">Inscrição de demonstração confirmada.</p>}
          </form>
        </section>

        <div className="grid grid-cols-1 gap-4 bg-[#3b2412] px-6 py-5 text-xs sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:px-10">
          <a href="#topo" aria-label="Kurio — início" className="inline-flex"><img src={kurioWordmark} alt="KURIO" className="h-7 w-[120px] object-contain object-left" /></a>
          <p>Feito para colecionadores,<br />criadores e cultura</p>
          <a href="mailto:contato@email.com" className="hover:text-[#e89b55]">contato@email.com</a>
          <a href="tel:+551140028922" className="hover:text-[#e89b55]">+55 11 4002 8922</a>
        </div>

        <section aria-label="Links do rodapé" className="grid grid-cols-1 gap-8 px-6 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-3 text-sm font-bold">{group.title}</h2>
              <ul className="list-none space-y-2 p-0 text-xs text-[#d2c4b7]">
                {group.links.map((label) => <li key={label}><a href="/#catalogo" className="hover:text-[#e89b55]">{label}</a></li>)}
              </ul>
            </nav>
          ))}
          <div>
            <h2 className="mb-3 text-sm font-bold">Redes sociais</h2>
            <div className="mb-5 flex gap-2">
              {socialLinks.map((social) => <a key={social.name} href="#redes-sociais" aria-label={social.name} className="grid size-7 place-items-center rounded border border-[#9b6031] hover:bg-[#3b2412]"><img src={social.icon} alt="" className="size-4" /></a>)}
              <a href="#redes-sociais" aria-label="YouTube" className="grid size-7 place-items-center rounded border border-[#9b6031] text-xs text-[#d28a4c]">▶</a>
            </div>
            <h3 className="mb-2 text-sm font-bold">Carteiras compatíveis</h3>
            <p className="inline-block rounded bg-[#4a2c15] px-2 py-1 text-[8px] uppercase tracking-wide text-[#e69a55]">MetaMask · WalletConnect · Coinbase</p>
          </div>
        </section>
      </footer>
      <p className="py-2 text-center text-xs text-[#b8aa9b]">© 2026 Kurio. Propriedade digital para todos.</p>
    </section>
  )
}

export default function NFTDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const search = useSearch({ from: '/nft/$nftId' })
  const { data: nft, isPending, isError } = useNFT(nftId)
  const { data: catalog } = useNFTs({ page: 1, pageSize: 24 })
  const { favorites, cart, toggleFavorite, addToCart } = useCommerce()
  const [selectedImage, setSelectedImage] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')
  const [relatedPage, setRelatedPage] = useState(1)
  const [zoomOpen, setZoomOpen] = useState(false)
  const isFavorite = nft ? favorites.includes(nft.id) : false
  const tokenNumber = nft?.name.match(/#(\d+)$/)?.[1] ?? '0042'
  const relatedItems = catalog?.items.filter((item) => item.id !== nftId) ?? []
  const visibleRelatedItems = relatedItems.slice(relatedPage * 2, relatedPage * 2 + 5)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-12 bg-[#140d0a] px-5 pt-6 pb-6 font-mono text-[#f5f1eb] sm:px-8 md:gap-24 min-[1440px]:px-[120px]">
      {isPending && <p role="status" className="py-16 text-center text-[#b8aa9b]">Carregando NFT…</p>}
      {isError && <div role="alert" className="py-16 text-center"><h1 className="mb-3 text-2xl font-bold">NFT não encontrado</h1><Link to="/" search={search} className="text-[#e89b55] underline">Voltar ao catálogo</Link></div>}

      {nft && (
        <>
          <section className="flex flex-col gap-8">
            <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#49372b] pb-2">
              <Link to="/" search={search} aria-label="Kurio — início" className="justify-self-start"><img src={kurioWordmark} alt="KURIO" className="h-[22px] w-[100px] sm:h-[35px] sm:w-[160px]" /></Link>
              <nav aria-label="Navegação principal" className="flex items-center gap-7 text-sm">
                <Link to="/" search={search} className="text-[#ead8c5] hover:text-[#e89b55]">Início</Link>
                <Link to="/" search={search} hash="catalogo" className="border-b-2 border-[#e89b55] py-2 font-bold text-[#e89b55]">Mercado</Link>
                <span className="text-[#ead8c5]">Criadores</span><span className="text-[#ead8c5]">Aprenda</span>
              </nav>
              <div className="flex items-center justify-self-end gap-4">
                <button type="button" aria-label="Buscar" className="p-1"><img src={searchIcon} alt="" className="size-4" /></button>
                <Link to="/cart" search={search} aria-label="Abrir carrinho" className="relative p-1"><img src={cartIcon} alt="" className="size-4" />{cart.length === 6 && <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-[#d28a4c] text-[8px] font-bold text-[#140d0a]">6</span>}</Link>
                <button type="button" className="inline-flex items-center gap-1 rounded bg-[#d28a4c] px-2.5 py-1 text-xs font-bold text-[#140d0a]"><img src={loginIcon} alt="" className="size-3.5" />Entrar</button>
              </div>
            </header>

            <div className="space-y-4">
              <nav aria-label="Breadcrumb" className="text-sm"><Link to="/" search={search} className="hover:text-[#e89b55]">Início</Link><span className="px-2 text-[#b8aa9b]">/</span><Link to="/" search={search} hash="catalogo" className="hover:text-[#e89b55]">Mercado</Link></nav>
              <div className="grid items-start gap-6 md:grid-cols-[72px_minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-cols-[96px_450px_minmax(0,1fr)]">
                <div className="order-2 flex gap-4 overflow-x-auto md:order-1 md:flex-col">
                  {[0, 1, 2, 3].map((imageIndex) => <button key={imageIndex} type="button" onClick={() => setSelectedImage(imageIndex)} aria-label={`Ver imagem ${imageIndex + 1}`} aria-pressed={selectedImage === imageIndex} className={`size-24 flex-none overflow-hidden rounded-lg border p-1 md:size-[72px] lg:size-24 ${selectedImage === imageIndex ? 'border-[#e89b55]' : 'border-transparent'}`}><img src={nft.imageUrl} alt="" className="size-full rounded-md object-cover" /></button>)}
                </div>
                <div className="relative order-1 flex aspect-square w-full min-h-0 items-center justify-center bg-[#241612] p-5 md:order-2">
                  <img src={nft.imageUrl} alt={nft.name} className="size-full rounded-[20px] object-cover" />
                  <button type="button" aria-label="Ampliar imagem" onClick={() => setZoomOpen(true)} className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-[#140d0a]/80"><img src={searchIcon} alt="" className="size-4" /></button>
                </div>
                <div className="order-3 min-w-0 space-y-3">
                  <h1 className="text-2xl font-bold leading-7">{nft.name}</h1>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#49372b] pb-2">
                    <p className="text-xl font-bold text-[#e89b55]">{nft.priceEth} ETH</p>
                    <p className="text-xs text-[#cfb28c]" aria-label="5 estrelas, 19 avaliações"><span className="mr-1 text-[#d28a4c]">★★★★★</span>19 avaliações de colecionadores</p>
                  </div>
                  <div><h2 className="mb-2 text-sm font-bold">Sobre este NFT:</h2><p className="text-sm leading-6 text-[#cfb28c]">Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.</p></div>
                  <div><h2 className="mb-2 text-sm font-bold">Edição:</h2><div className="flex gap-2 text-xs"><span className="rounded-full border border-[#49372b] px-2 py-1">1/1</span><span className="rounded-full border border-[#49372b] px-2 py-1">1/10</span><span className="rounded-full border border-[#d28a4c] px-2 py-1 text-[#e89b55]">1/50</span><span className="rounded-full border border-[#49372b] px-2 py-1">ABERTA</span></div></div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3"><button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid size-10 place-items-center rounded-full bg-[#d28a4c] text-xl font-bold text-[#140d0a]">−</button><span>{quantity}</span><button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity((value) => Math.min(nft.available, value + 1))} className="grid size-10 place-items-center rounded-full bg-[#d28a4c] text-xl font-bold text-[#140d0a]">+</button></div>
                    <div className="flex gap-2"><button type="button" onClick={() => addToCart(nft.id)} className="min-w-[128px] rounded bg-[#d28a4c] px-6 py-2 text-xs font-bold text-[#140d0a]">COMPRAR</button><button type="button" aria-pressed={isFavorite} onClick={() => toggleFavorite(nft.id)} className="rounded border border-[#d28a4c] px-4 py-2 text-xs text-[#d28a4c]">♡ {isFavorite ? 'Favoritado' : 'Favoritar'}</button></div>
                  </div>
                  <div className="space-y-2 pt-1 text-sm text-[#b39463]"><p>ID do token: #{tokenNumber.padStart(4, '0')}</p><p>Coleção: Kurio Apes</p><p>Atributos: Óculos, Esmeralda, Raro</p><p className="flex items-center gap-2 pt-1 font-bold text-[#f5f1eb]">Compartilhar este NFT:<img src={linkedinIcon} alt="LinkedIn" className="size-4" /><span className="text-sm">✉</span><img src={twitterIcon} alt="Twitter" className="size-4" /></p></div>
                </div>
              </div>
            </div>
          </section>

          <section aria-label="Informações do NFT">
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
          <DetailFooter />
        </>
      )}
      {zoomOpen && nft && <button type="button" aria-label="Fechar imagem ampliada" onClick={() => setZoomOpen(false)} className="fixed inset-0 z-50 grid place-items-center bg-[#140d0a]/90 p-8"><img src={nft.imageUrl} alt={nft.name} className="max-h-full max-w-full rounded-2xl object-contain" /></button>}
    </main>
  )
}
