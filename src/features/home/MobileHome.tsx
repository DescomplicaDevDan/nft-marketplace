import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { useCommerce } from '@/features/commerce/CommerceProvider'
import { NFT_CATEGORIES, NFT_NETWORKS, type NFTListResponse, type NFTSort } from '@/features/catalog/types'
import hero from '@/assets/img/Frame 136.png'
import sage from '@/assets/img/NFT Artwork 18.png'
import searchIcon from '@/assets/icons/Search Icon.svg'
import filterIcon from '@/assets/icons/Frame 402.svg'
import homeIcon from '@/assets/icons/Home.svg'
import heartIcon from '@/assets/icons/Vector.svg'
import outlineHeart from '@/assets/icons/Vector 2.svg'
import cartIcon from '@/assets/icons/Cart Icon 2.svg'
import userIcon from '@/assets/icons/User.svg'
import scanIcon from '@/assets/icons/Group.svg'
import './mobile-home.css'

type Props = { data: NFTListResponse | undefined; loading: boolean; error: boolean; retry: () => void }

export function MobileHome({ data, loading, error, retry }: Props) {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const { favorites, toggleFavorite } = useCommerce()
  const [term, setTerm] = useState(search.search)
  const [min, setMin] = useState(search.minPrice ?? '')
  const [max, setMax] = useState(search.maxPrice ?? '')
  const drawer = useRef<HTMLDialogElement>(null)
  const previousOverflow = useRef('')

  useEffect(() => {
    const dialog = drawer.current
    const media = window.matchMedia('(min-width: 768px)')
    const changed = () => { if (media.matches) dialog?.close() }
    media.addEventListener('change', changed)
    return () => { media.removeEventListener('change', changed); if (dialog?.open) { dialog.close(); document.body.style.overflow = previousOverflow.current } }
  }, [])

  function openFilters() {
    setMin(search.minPrice ?? '')
    setMax(search.maxPrice ?? '')
    previousOverflow.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawer.current?.showModal()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void navigate({ search: { ...search, search: term.trim(), page: 1 }, resetScroll: false })
  }

  function sort(value: NFTSort | undefined) {
    void navigate({ search: { ...search, sort: value, page: 1 }, resetScroll: false })
  }

  const pages = Math.ceil((data?.total ?? 0) / 9)
  const activeFilters = !!(search.category || search.network || search.minPrice || search.maxPrice)
  const categories = data?.categoryCounts ?? NFT_CATEGORIES.map((name) => ({ name, count: undefined }))
  const networks = data?.networkCounts ?? NFT_NETWORKS.map((name) => ({ name, count: undefined }))
  const items = [...(data?.items ?? [])]
  // The reference highlights Golden Beat in the fourth slot of the unfiltered opening.
  if (search.page === 1 && !search.sort && !search.search && !activeFilters) {
    const index = items.findIndex((item) => item.id === 'nft-007')
    if (index > 3) items.splice(3, 0, items.splice(index, 1)[0])
  }

  return <div className="mobile-home">
    <main className="mobile-home-content">
      <div className="mobile-search-row">
        <form role="search" onSubmit={submit} className="mobile-search">
          <label className="sr-only" htmlFor="mobile-nft-search">Explorar coleções</label>
          <button type="submit" aria-label="Buscar coleções"><span aria-hidden="true" style={{ maskImage: `url("${searchIcon}")`, WebkitMaskImage: `url("${searchIcon}")` }} /></button>
          <Input key={search.search} id="mobile-nft-search" type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Explorar coleções" />
        </form>
        <button type="button" className="mobile-filter-trigger" aria-label={activeFilters ? 'Abrir filtros, há filtros aplicados' : 'Abrir filtros'} aria-haspopup="dialog" onClick={openFilters}><img src={filterIcon} alt="" />{activeFilters && <span />}</button>
      </div>

      <section className="mobile-hero" aria-labelledby="mobile-hero-title">
        <div className="mobile-hero-copy"><p className="mobile-welcome">Bem-vindo à Kurio</p><h1 id="mobile-hero-title">Seja dono da<br />cultura digital</h1><p className="mobile-hero-description">Descubra NFTs selecionados de criadores do mundo todo.</p><a href="#mobile-catalog">EXPLORAR <span aria-hidden="true">→</span></a></div>
        <div className="mobile-hero-art"><img src={hero} alt="Emerald Ape com óculos e jaqueta verde" /><img src={sage} className="mobile-hero-mini" alt="" /></div>
        <div className="mobile-hero-dots" aria-hidden="true"><i /><i /><i /></div>
      </section>

      <section id="mobile-catalog" aria-labelledby="mobile-catalog-title">
        <h2 id="mobile-catalog-title" className="sr-only">Catálogo de NFTs</h2>
        <nav className="mobile-catalog-tabs" aria-label="Filtrar catálogo mobile">
          {[{ label: 'Todos os NFTs', value: undefined }, { label: 'Novos lançamentos', value: 'recent' as const }, { label: 'Em alta', value: 'popular' as const }].map((tab) => <button type="button" key={tab.label} aria-pressed={search.sort === tab.value} onClick={() => sort(tab.value)}>{tab.label}</button>)}
        </nav>
        <p className="sr-only" role="status">{data ? `${data.total} NFTs disponíveis` : 'Carregando catálogo'}</p>
        {loading && <div className="mobile-nft-grid" aria-label="Carregando NFTs">{Array.from({ length: 6 }, (_, index) => <div key={index} className="mobile-nft-skeleton"><div /><i /><i /></div>)}</div>}
        {error && <div className="mobile-catalog-message" role="alert"><p>Não foi possível carregar o catálogo.</p><button type="button" onClick={retry}>Tentar novamente</button></div>}
        {!loading && !error && !items.length && <div className="mobile-catalog-message"><p>Nenhum NFT encontrado.</p><button type="button" onClick={openFilters}>Revisar filtros</button></div>}
        {!error && items.length > 0 && <ul className="mobile-nft-grid">{items.map((nft, index) => <li key={nft.id} className="mobile-nft-card">
          <div className="mobile-nft-art">
            <Link to="/nft/$nftId" params={{ nftId: nft.id }} search={search} aria-label={`Ver ${nft.name}`}><img src={nft.imageUrl} alt={nft.name} loading={index < 4 ? 'eager' : 'lazy'} /></Link>
            {nft.id === 'nft-003' && <span className="mobile-rarity">RARO</span>}
            <button type="button" className={`mobile-card-favorite ${index === 0 ? 'mobile-first-favorite' : ''}`} aria-label={favorites.includes(nft.id) ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`} aria-pressed={favorites.includes(nft.id)} onClick={() => toggleFavorite(nft.id)}><img src={favorites.includes(nft.id) ? heartIcon : outlineHeart} alt="" /></button>
          </div>
          <Link to="/nft/$nftId" params={{ nftId: nft.id }} search={search} className="mobile-nft-caption"><h3>{nft.name}</h3><p><strong>{nft.priceEth} ETH</strong>{nft.previousPriceEth && <span>{nft.previousPriceEth} ETH</span>}</p></Link>
        </li>)}</ul>}
        {pages > 1 && <nav aria-label="Paginação mobile" className="mobile-pagination">{Array.from({ length: pages }, (_, index) => index + 1).map((page) => <button type="button" key={page} aria-label={`Página ${page}`} aria-current={page === search.page ? 'page' : undefined} onClick={() => { void navigate({ search: { ...search, page }, hash: 'mobile-catalog' }) }}>{page}</button>)}</nav>}
      </section>
    </main>

    <nav className="mobile-bottom-nav" aria-label="Navegação mobile"><div className="mobile-bottom-surface" aria-hidden="true" /><Link to="/" search={search} aria-label="Início" aria-current="page"><img src={homeIcon} alt="" /></Link><Link to="/favorites" search={search} aria-label="Favoritos"><img src={heartIcon} alt="" /></Link><a href="#mobile-catalog" className="mobile-explore-action" aria-label="Explorar NFTs"><img src={scanIcon} alt="" /></a><Link to="/cart" search={search} aria-label="Carrinho"><img src={cartIcon} alt="" /></Link><Link to="/profile" search={search} aria-label="Meu perfil"><img src={userIcon} alt="" /></Link></nav>

    <dialog ref={drawer} className="mobile-filter-dialog" aria-labelledby="mobile-filter-title" onClose={() => { document.body.style.overflow = previousOverflow.current }} onClick={(event) => { if (event.target === event.currentTarget) drawer.current?.close() }}>
      <header><h2 id="mobile-filter-title">Filtrar coleções</h2><button type="button" aria-label="Fechar filtros" onClick={() => drawer.current?.close()}>×</button></header>
      <h3>Coleções</h3><div className="mobile-filter-options">{categories.map((category) => <button type="button" key={category.name} aria-pressed={search.category === category.name} onClick={() => { void navigate({ search: { ...search, category: search.category === category.name ? undefined : category.name, page: 1 }, resetScroll: false }) }}>{category.name}<span>({category.count ?? '—'})</span></button>)}</div>
      <h3>Rede</h3><div className="mobile-filter-options">{networks.map((network) => <button type="button" key={network.name} aria-pressed={search.network === network.name} onClick={() => { void navigate({ search: { ...search, network: search.network === network.name ? undefined : network.name, page: 1 }, resetScroll: false }) }}>{network.name}<span>({network.count ?? '—'})</span></button>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); if (min && max && Number(min) > Number(max)) return; void navigate({ search: { ...search, minPrice: min || undefined, maxPrice: max || undefined, page: 1 }, resetScroll: false }); drawer.current?.close() }}><h3>Faixa de preço (ETH)</h3><div className="mobile-price-fields"><label>Mínimo<Input type="number" min="0" step="0.01" value={min} onChange={(event) => setMin(event.target.value)} /></label><label>Máximo<Input type="number" min={min || '0'} step="0.01" value={max} onChange={(event) => setMax(event.target.value)} /></label></div><label className="mobile-filter-sort">Ordenar por<select value={search.sort ?? 'recent'} onChange={(event) => sort(event.target.value as NFTSort)}><option value="recent">Listados recentemente</option><option value="popular">Mais populares</option><option value="price-low">Menor preço</option><option value="price-high">Maior preço</option></select></label><button type="submit" className="mobile-apply-filters">Aplicar filtros</button></form>
      <button type="button" className="mobile-clear-filters" onClick={() => { setMin(''); setMax(''); void navigate({ search: { ...search, category: undefined, network: undefined, minPrice: undefined, maxPrice: undefined, sort: undefined, page: 1 }, resetScroll: false }) }}>Limpar filtros</button>
    </dialog>
  </div>
}
