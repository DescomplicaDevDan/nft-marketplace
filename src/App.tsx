import CartCountBadge from '@/components/CartCountBadge'
import { AuthButton } from '@/features/auth/AuthProvider'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import searchIcon from './assets/icons/Search Icon.svg'
import cartIcon from './assets/icons/Cart Icon.svg'
import heroArtwork from './assets/img/Frame 136.webp'
import kurioWordmark from './assets/img/Logo.svg'
import { useNFTs } from '@/features/catalog/api'
import type { NFTNetwork, NFTSort } from '@/features/catalog/types'
import { useCommerce } from '@/features/commerce/CommerceProvider'
import { featuredCollections, footerGroups, footerHighlights, journalArticles, socialLinks } from '@/mocks/data/homeContent'
import { MobileHome } from '@/features/home/MobileHome'

const PAGE_SIZE = 9

function SearchForm({
  value,
  onSearch,
}: {
  value: string
  onSearch: (value: string) => void
}) {
  const [input, setInput] = useState(value)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(input.trim())
  }

  return (
    <form onSubmit={submit} role="search" className="flex w-full max-w-md gap-2">
      <label className="sr-only" htmlFor="nft-search">Buscar por NFT, coleção ou artista</label>
      <div className="relative min-w-0 flex-1">
        <img src={searchIcon} alt="" aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2" />
        <input
          id="nft-search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Buscar NFTs, coleções ou artistas"
          className="h-11 w-full min-w-0 rounded-md border border-[#49372b] bg-[#1b1310] pl-10 pr-3 text-sm text-[#f5f1eb] outline-none placeholder:text-[#b8aa9b] focus-visible:ring-2 focus-visible:ring-[#e69a55]"
        />
      </div>
      <button className="h-11 rounded-md bg-[#e69a55] px-4 text-sm font-medium text-[#1b1310] hover:opacity-90" type="submit">Buscar</button>
    </form>
  )
}

function PriceRangeFilter({
  minEth,
  maxEth,
  currentMin,
  currentMax,
  onApply,
}: {
  minEth: string
  maxEth: string
  currentMin?: string
  currentMax?: string
  onApply: (min: string, max: string) => void
}) {
  const rangeMin = Number(minEth)
  const rangeMax = Number(maxEth)
  const [min, setMin] = useState(Number(currentMin ?? minEth))
  const [max, setMax] = useState(Number(currentMax ?? maxEth))
  const minCents = Math.round(rangeMin * 100)
  const maxCents = Math.round(rangeMax * 100)
  const rangeWidth = Math.max(1, maxCents - minCents)
  const minPosition = ((Math.round(min * 100) - minCents) / rangeWidth) * 100
  const maxPosition = ((Math.round(max * 100) - minCents) / rangeWidth) * 100

  return (
    <form
      className="flex w-full max-w-[270px] flex-col gap-3 tracking-[0]"
      onSubmit={(event) => {
        event.preventDefault()
        onApply(min.toFixed(2), max.toFixed(2))
      }}
    >
      <h3 className="h-[16px] text-[18px] font-bold leading-[16px] text-[#F5F1EB]">Faixa de preço</h3>
      <div className="flex flex-col gap-3 pl-3">
        <div className="relative h-[21px] w-[258px]">
          <div
            aria-hidden="true"
            className="absolute inset-x-[10.5px] top-1/2 h-[4px] -translate-y-1/2 rounded-full"
            style={{ background: `linear-gradient(to right, #D28A4C ${minPosition}%, #D28A4C ${minPosition}% ${maxPosition}%, #D28A4C ${maxPosition}%)` }}
          />
          <label className="sr-only" htmlFor="min-price">Preço mínimo em ETH</label>
          <input
            id="min-price"
            type="range"
            min={minCents}
            max={Math.max(minCents, Math.round(max * 100))}
            step="1"
            value={Math.round(min * 100)}
            onChange={(event) => setMin(Number(event.target.value) / 100)}
            className="price-range-thumb"
          />
          <label className="sr-only" htmlFor="max-price">Preço máximo em ETH</label>
          <input
            id="max-price"
            type="range"
            min={Math.min(maxCents, Math.round(min * 100))}
            max={maxCents}
            step="1"
            value={Math.round(max * 100)}
            onChange={(event) => setMax(Number(event.target.value) / 100)}
            className="price-range-thumb"
          />
        </div>
        <p className="flex h-[20px] items-center whitespace-nowrap text-[15px] font-normal leading-none tracking-[0] text-[#F5F1EB]">
          Preço: {min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} – {max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ETH
        </p>
        <button type="submit" className="inline-flex h-[36px] w-[92px] shrink-0 items-center justify-center rounded-[6px] bg-[#D28A4C] px-[12px] py-[8px] font-mono text-[16px] font-bold leading-[20px] text-[#140D0A] hover:brightness-110">
          <span className="block h-[20px] w-[68px] tracking-[0]">Aplicar</span>
        </button>
      </div>
    </form>
  )
}

function App() {
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { cartItems } = useCommerce()
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const { data, isPending, isError, refetch } = useNFTs({
    search: search.search,
    category: search.category,
    network: search.network,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sort: search.sort,
    page: search.page,
    pageSize: PAGE_SIZE,
  })

  function submitSearch(value: string) {
    void navigate({
      search: (previous) => ({ ...previous, search: value, page: 1 }),
      resetScroll: false,
    })
    setSearchOpen(false)
  }

  function changePage(page: number) {
    void navigate({ search: (previous) => ({ ...previous, page }), resetScroll: false })
  }

  function changeNetwork(network: NFTNetwork) {
    const nextNetwork = search.network === network ? undefined : network
    void navigate({
      search: (previous) => ({
        ...previous,
        network: nextNetwork,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  function applyPriceRange(minPrice: string, maxPrice: string) {
    void navigate({
      search: (previous) => ({ ...previous, minPrice, maxPrice, page: 1 }),
      resetScroll: false,
    })
  }

  function changeSort(sort: NFTSort | undefined) {
    void navigate({
      search: (previous) => ({ ...previous, sort, page: 1 }),
      resetScroll: false,
    })
  }

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE)

  return (
    <>
    <MobileHome key={search.search} data={data} loading={isPending} error={isError} retry={() => { void refetch() }} />
    <main id="topo" className="desktop-home mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-12 bg-[#140D0A] px-5 pt-6 pb-6 text-left text-[#f5f1eb] sm:px-8 md:gap-24 lg:px-8 min-[1440px]:px-[120px]">
      <div className="flex flex-col gap-8">
      <header className="mb-0 flex items-center justify-between border-b border-[#49372b] font-mono text-sm text-[#ead8c5] md:grid md:grid-cols-[1fr_auto_1fr]">
        <a href="/" aria-label="Kurio — início" className="inline-flex items-center md:col-start-1 md:justify-self-start">
          <img src={kurioWordmark} alt="KURIO" className="h-[22px] w-[100px] sm:h-[35px] sm:w-[160px]" />
        </a>

        <nav aria-label="Navegação principal" className="flex h-[45px] w-[401px] shrink-0 items-start justify-between whitespace-nowrap font-mono text-[16px] font-normal leading-none tracking-[0] md:col-start-2 [&_.nav-label]:flex [&_.nav-label]:h-[21px] [&_.nav-label]:items-center">
          <a
            href="/"
            aria-current="page"
            className="block h-[45px] w-[58px] border-b-2 border-[#E89B55] p-0 font-bold text-[#E89B55]"
          >
            <span className="nav-label">Início</span>
          </a>
          <a href="#catalogo" className="block h-[45px] p-0 text-[#f5f1eb] transition-colors hover:text-[#E89B55]">
            <span className="nav-label">Mercado</span>
          </a>
          <span aria-disabled="true" title="Área ainda não disponível" className="block h-[45px] p-0 text-[#f5f1eb]">
            <span className="nav-label">Criadores</span>
          </span>
          <span aria-disabled="true" title="Área ainda não disponível" className="block h-[45px] p-0 text-[#f5f1eb]">
            <span className="nav-label">Aprenda</span>
          </span>
        </nav>
        <div className="hidden h-[35px] items-center justify-self-end self-start gap-[28px] md:flex">
          <button type="button" aria-label="Abrir busca" aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)} className="flex h-[35px] w-5 items-center justify-center rounded p-0 hover:bg-[#211511]"><img src={searchIcon} alt="" className="size-5" /></button>
          <Link to="/cart" search={search} aria-label={`Abrir carrinho com ${cartItems.reduce((total, item) => total + item.quantity, 0)} NFTs`} className="relative flex size-6 items-center justify-center rounded p-0 hover:bg-[#211511]">
            <img src={cartIcon} alt="" className="size-5" /><CartCountBadge />

          </Link>
          <AuthButton />
        </div>
      </header>

      <section className="relative grid items-start gap-8 py-0 md:grid-cols-[minmax(0,640fr)_minmax(0,450fr)] md:gap-[clamp(24px,7.64vw,110px)]">
        <div className="relative min-w-0 self-stretch pb-[72px] font-mono md:pt-[43px] lg:pl-10">
          <div className="flex w-full max-w-[600px] flex-col gap-2">
          <p className="text-[14px] font-medium leading-[16px] tracking-[0.1em] text-[#F5F1EB]">
            Bem-vindo à Kurio
          </p>

          <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[43px] font-bold uppercase leading-[70px] tracking-[0] text-[#F5F1EB]">
            Seja dono do futuro
            <br />
            da arte digital
          </h1>

          <p className="w-full max-w-[557px] text-[14px] font-normal leading-[24px] tracking-[0] text-[#CFB28C]">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </p>
          </div>
          </div>

          <a
            href="#catalogo"
            className="mt-8 inline-flex h-10 items-center rounded-md bg-[#e69a55] px-7 font-mono text-[16px] font-bold leading-[20px] tracking-[0] text-[#140D0A] hover:brightness-110"
          >
            <span className="block h-[20px] w-[77px]">EXPLORAR</span>
          </a>
          <div aria-hidden="true" className="absolute bottom-[43px] right-0 hidden items-center gap-2 md:flex">
            <span className="size-2 rounded-full bg-[#e69a55]" />
            <span className="size-2 rounded-full bg-[#e69a55]" />
            <span className="size-2 rounded-full bg-[#e69a55]" />
          </div>
        </div>

        <img
          src={heroArtwork}
          alt="NFT Emerald Ape com óculos e jaqueta verde"
          className="hidden aspect-square w-full max-w-[450px] justify-self-end rounded-2xl object-cover md:block"
        />
      </section>
      </div>

      <section id="catalogo" aria-labelledby="catalog-title" className="scroll-mt-8">
        <div className="grid gap-8 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
          <div className="flex flex-col gap-6">
          <aside aria-label="Filtros do catálogo" className="flex w-full flex-col gap-10 self-start bg-[#241612] p-5 font-mono">
            <section aria-labelledby="collections-filter-title" className="flex flex-col gap-3 tracking-[0]">
            <h2 id="collections-filter-title" className="h-[16px] text-[18px] font-bold leading-[16px] text-[#F5F1EB]">Coleções</h2>
            <ul className="m-0 w-full list-none px-3 py-0">
              {data?.categoryCounts.map((item) => {
                const selected = search.category === item.name

                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => void navigate({
                        search: (previous) => ({
                          ...previous,
                          category: selected ? undefined : item.name,
                          page: 1,
                        }),
                      resetScroll: false,
                      })}
                      className={`flex h-[40px] w-full items-center justify-between gap-3 text-left font-mono text-[15px] font-normal leading-[40px] tracking-[0] transition-colors ${selected ? 'text-[#E89B55]' : 'text-[#CFB28C]'}`}
                    >
                      <span className="h-[40px] font-normal">{item.name}</span>
                      <span className="h-[40px] min-w-[37px] text-right font-bold">({item.count})</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            </section>

            {data && (
              <PriceRangeFilter
                key={`${search.minPrice ?? data.priceRange.minEth}-${search.maxPrice ?? data.priceRange.maxEth}`}
                minEth={data.priceRange.minEth}
                maxEth={data.priceRange.maxEth}
                currentMin={search.minPrice}
                currentMax={search.maxPrice}
                onApply={applyPriceRange}
              />
            )}

            <section aria-labelledby="networks-filter-title" className="flex flex-col gap-3 tracking-[0]">
              <h3 id="networks-filter-title" className="h-[16px] text-[18px] font-bold leading-[16px] text-[#F5F1EB]">Rede</h3>
              <ul className="m-0 list-none space-y-0 py-0 pl-3 pr-0">
                {data?.networkCounts.map((item) => {
                  const selected = search.network === item.name

                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => changeNetwork(item.name)}
                        className={`flex h-[40px] w-full items-center justify-between gap-3 text-left font-mono text-[15px] font-normal leading-[40px] tracking-[0] transition-colors ${selected ? 'text-[#E89B55]' : 'text-[#CFB28C]'}`}
                      >
                        <span className="h-[40px] font-normal">{item.name}</span>
                        <span className="h-[40px] min-w-[37px] text-right font-bold">({item.count})</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          </aside>
          {data?.featuredNFT && (
            <article className="w-[310px] flex-none overflow-visible pb-[94px] font-mono">
              <div className="bg-[linear-gradient(180deg,rgba(210,138,76,0.1)_0%,rgba(210,138,76,0.03)_100%)] pt-6">
              <div className="flex flex-col items-center gap-4">
                <h2 className="flex h-[32px] w-[270px] items-center text-[24px] font-bold uppercase leading-[32px] tracking-[0] text-[#E89B55]">NFT em destaque</h2>
                <p className="h-[16px] w-[270px] text-center text-[22px] font-bold uppercase leading-[16px] tracking-[0] text-[#F5F1EB]">Oferta limitada</p>
              </div>
              <Link to="/nft/$nftId" params={{ nftId: data.featuredNFT.id }} search={search} className="group block focus-visible:outline-2 focus-visible:outline-[#e69a55]">
                <img src={data.featuredNFT.imageUrl} alt={data.featuredNFT.name} className="mt-4 block h-[368px] w-[310px] rounded-[22px] object-cover" />
              </Link>
              </div>
            </article>
          )}
          </div>

          <div className="min-w-0 lg:flex lg:min-h-[1373px] lg:flex-col">
            <div className="mb-8">
              <div className="flex min-h-[20px] w-full flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <div>
                  <nav aria-label="Filtrar catálogo" role="tablist" className="flex h-[18px] items-start gap-5 font-mono text-[15px] font-medium leading-[16px] tracking-[0]">
                  {[
                    { label: 'Todos os NFTs', value: undefined },
                    { label: 'Novos lançamentos', value: 'recent' as const },
                    { label: 'Em alta', value: 'popular' as const },
                  ].map((tab) => {
                    const selected = search.sort === tab.value

                    return (
                      <button
                        key={tab.label}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => changeSort(tab.value)}
                        className={`h-[18px] border-b-2 pb-0 font-medium leading-[16px] tracking-[0] transition-colors ${selected ? 'border-[#E89B55] text-[#E89B55]' : 'border-transparent text-[#F7F3EC]'}`}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                  </nav>
                  <p id="catalog-title" className="sr-only" aria-live="polite">
                    {data ? (data.total === 1 ? '1 item disponível' : data.total + ' itens disponíveis') : 'Carregando catálogo'}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-px font-mono text-[15px] font-normal leading-none tracking-[0] text-[#F5F1EB]">
                  <label htmlFor="catalog-sort" className="flex h-[20px] w-[109px] items-center whitespace-nowrap font-normal">Ordenar por:</label>
                  <div className="relative h-5 w-[224px]">
                    <select
                      id="catalog-sort"
                      value={search.sort ?? 'recent'}
                      onChange={(event) => changeSort(event.target.value as NFTSort)}
                      className="h-[20px] w-full appearance-none border-0 bg-[#140D0A] py-0 pl-0 pr-6 font-mono text-[15px] font-normal leading-none tracking-[0] text-[#F5F1EB] outline-none [color-scheme:dark] focus-visible:ring-2 focus-visible:ring-[#E89B55] [&_option]:bg-[#241612] [&_option]:text-[#F5F1EB]"
                    >
                      <option value="recent">Listados recentemente</option>
                      <option value="popular">Mais populares</option>
                      <option value="price-low">Menor preço</option>
                      <option value="price-high">Maior preço</option>
                    </select>
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-0 top-[2px] size-4 fill-none stroke-[#F5F1EB] stroke-[1.5]"><path d="m4 6 4 4 4-4" /></svg>
                  </div>
                </div>
              </div>
              {searchOpen && <div className="mt-4 flex justify-end"><SearchForm key={search.search} value={search.search} onSearch={submitSearch} /></div>}
            </div>

            {isPending && (
              <div aria-label="Carregando NFTs" className="grid grid-cols-1 gap-x-[34px] gap-y-[72px] p-0 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: PAGE_SIZE }, (_, index) => (
                  <div key={index} className="h-[350px] w-full">
                    <div className="kurio-skeleton h-[300px] rounded-sm" />
                    <div className="mt-3 space-y-2"><div className="kurio-skeleton h-4 w-2/3 rounded-sm" /><div className="kurio-skeleton h-4 w-1/3 rounded-sm" /></div>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div role="alert" className="rounded-lg border border-[#49372b] p-6 text-center">
                <p className="mb-3 text-[#f5f1eb]">Não foi possível carregar o catálogo.</p>
                <button onClick={() => void refetch()} className="rounded-md border border-[#49372b] px-4 py-2 text-sm hover:bg-[#211511]">Tentar novamente</button>
              </div>
            )}

            {data && data.items.length === 0 && (
              <p className="rounded-lg border border-[#49372b] p-10 text-center text-[#b8aa9b]">Nenhum NFT encontrado. Tente outra busca.</p>
            )}

            {data && data.items.length > 0 && (
              <>
                <ul className="grid list-none grid-cols-1 gap-x-[34px] gap-y-[72px] p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {data.items.map((nft) => (
                    <li key={nft.id} className="flex w-full min-w-0 flex-col gap-3 text-[#F5F1EB]">
                      <Link
                        to="/nft/$nftId"
                        params={{ nftId: nft.id }}
                        search={search}
                        className="group flex w-full flex-col gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E89B55]"
                      >
                        <div className="flex aspect-[258/300] w-full items-center justify-center bg-[#241612]">
                          <img
                            src={nft.imageUrl}
                            alt={nft.name}
                            style={{ width: `${(250 / 258) * 100}%` }}
                            className="aspect-square h-auto rounded-[15px] object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex min-h-[44px] flex-col gap-3 font-mono">
                          <h3 className="min-h-[16px] w-full break-words text-[16px] font-normal leading-[16px] tracking-[0] text-[#F5F1EB]">{nft.name}</h3>
                          <div className="flex h-4 items-center gap-3">
                            <p className="text-[18px] font-bold leading-[16px] tracking-[0] text-[#E89B55]">{nft.priceEth} ETH</p>
                            {nft.previousPriceEth && <p className="text-[18px] font-normal leading-[16px] tracking-[0] text-[#B39463]">{nft.previousPriceEth} ETH</p>}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {data && totalPages > 1 && (
              <nav aria-label="Paginação do catálogo" className="mt-auto flex items-center justify-end gap-2 pt-[88px]">
                {search.page > 1 && (
                  <button type="button" aria-label="Página anterior" onClick={() => changePage(search.page - 1)} className="grid size-[35px] place-items-center rounded border border-[#3F2319] text-lg text-[#F5F1EB] hover:border-[#D28A4C]"><svg aria-hidden="true" viewBox="0 0 18 18" className="size-[18px] rotate-180 fill-none stroke-[#F5F1EB] stroke-[1.5]"><path d="m6 3.5 5.5 5.5L6 14.5" /></svg></button>
                )}
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    aria-label={`Página ${page}`}
                    aria-current={search.page === page ? 'page' : undefined}
                    onClick={() => changePage(page)}
                    className={`grid size-[35px] place-items-center rounded border text-lg leading-4 ${search.page === page ? 'border-[#D28A4C] bg-[#D28A4C] font-bold text-[#140D0A]' : 'border-[#3F2319] font-normal text-[#F5F1EB] hover:border-[#D28A4C]'}`}
                  >
                    {page}
                  </button>
                ))}
                <button type="button" aria-label="Próxima página" disabled={search.page >= totalPages} onClick={() => changePage(search.page + 1)} className="grid size-[35px] place-items-center rounded border border-[#3F2319] hover:border-[#D28A4C] disabled:cursor-not-allowed disabled:opacity-40"><svg aria-hidden="true" viewBox="0 0 18 18" className="size-[18px] fill-none stroke-[#F5F1EB] stroke-[1.5]"><path d="m6 3.5 5.5 5.5L6 14.5" /></svg></button>
              </nav>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Coleções em destaque" className="featured-collections-section mx-auto grid w-full max-w-[1200px] grid-cols-1 justify-items-center gap-[28px] lg:grid-cols-2">
        {featuredCollections.map((collection) => (
          <article key={collection.title} className="flex min-h-[250px] w-full max-w-[586px] overflow-hidden rounded-[6px] bg-[#241612]">
            <div className="relative w-1/2 shrink-0 self-stretch overflow-hidden rounded-[16px]">
              <img src={collection.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <span aria-hidden="true" className="pointer-events-none absolute left-[-199px] top-[134px] size-[256px] rounded-full border border-[#D28A4C]" />
            </div>
            <div className="flex min-w-0 w-1/2 flex-col items-end justify-center px-4 py-6 text-right font-mono">
              <h2 className="mb-3 w-full text-base font-bold leading-snug text-[#f5f1eb]">{collection.title}</h2>
              <p className="w-full text-[14px] font-normal leading-[24px] tracking-[0] text-[#CFB28C]">{collection.description}</p>
              <a href="#catalogo" className="mt-2 shrink-0 self-end rounded bg-[#e69a55] px-5 py-2 text-xs font-bold text-[#1b1310]">Explorar →</a>
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="journal-title">
        <header className="mb-8 flex w-full flex-col gap-[8px] text-center font-mono tracking-[0]">
          <h2 id="journal-title" className="m-0 flex min-h-[37px] items-center justify-center text-[28px] font-bold leading-none text-[#F5F1EB]">Diário da Cunhagem</h2>
          <p className="flex min-h-[18px] items-center justify-center text-[14px] font-normal leading-none text-[#CFB28C]">Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
        </header>
        <div className="grid grid-cols-[minmax(0,268px)] justify-center gap-[24px] sm:grid-cols-[repeat(2,268px)] xl:grid-cols-[repeat(4,268px)]">
          {journalArticles.map((article) => (
            <article key={article.title} className="w-full overflow-hidden rounded-[8px] bg-[#241612] font-mono tracking-[0]">
              <img src={article.image} alt="" className="block h-[195px] w-full object-cover" loading="lazy" />
              <div className="flex flex-col gap-[8px] px-[16px] pt-[12px] pb-[16px]">
                <p className="min-h-[32px] text-[12px] font-medium leading-[16px] text-[#CFB28C]">{article.date} <span className="px-2">|</span> Leitura de {article.readingTime}</p>
                <h3 className="m-0 flex min-h-[42px] items-center text-[16px] font-bold leading-none text-[#F5F1EB]">{article.title}</h3>
                <p className="min-h-[32px] text-[12px] font-medium leading-[16px] text-[#CFB28C]">{article.summary}</p>
                <a href="#journal-title" className="inline-flex items-center gap-1 self-start text-[#E89B55] hover:underline"><span className="h-[14px] w-[58px] text-[12px] font-bold leading-[14px]">Ler mais</span><span aria-hidden="true" className="flex h-[16px] w-[12px] items-center text-[12px] font-normal leading-none">→</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="bg-[#211511] font-mono text-[#f5f1eb]">
        <section aria-label="Benefícios e novidades" className="grid grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:px-10">
          {footerHighlights.map((item) => (
            <article key={item.title} className="border-[#9b6031] lg:border-r lg:px-4 first:lg:pl-0">
              <span className="mb-3 grid size-12 place-items-center rounded-full bg-[#d28a4c] text-lg font-bold text-[#1b1310]">{item.icon}</span>
              <h2 className="mb-2 text-sm font-bold">{item.title}</h2>
              <p className="max-w-[220px] text-xs leading-5 text-[#b8aa9b]">{item.description}</p>
            </article>
          ))}
          <form className="lg:pl-4" onSubmit={(event) => { event.preventDefault(); setNewsletterSubmitted(true) }}>
            <label htmlFor="newsletter-email" className="mb-3 block text-sm font-bold leading-tight">Antecipe-se ao próximo lançamento</label>
            <div className="flex">
              <input id="newsletter-email" type="email" required placeholder="digite seu e-mail..." className="min-w-0 flex-1 rounded-l border border-[#49372b] bg-[#1b1310] px-3 py-2 text-xs outline-none placeholder:text-[#b8aa9b] focus-visible:ring-2 focus-visible:ring-[#e69a55]" />
              <button type="submit" className="rounded-r bg-[#d28a4c] px-3 text-xs font-bold text-[#1b1310]">Enviar</button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#b8aa9b]">Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
            {newsletterSubmitted && <p role="status" className="mt-2 text-xs text-[#e69a55]">Inscrição de demonstração confirmada.</p>}
          </form>
        </section>

        <div className="grid grid-cols-1 gap-4 bg-[#3b2412] px-6 py-5 text-xs sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:px-10">
          <a href="#topo" aria-label="Kurio — início" className="inline-flex items-center"><img src={kurioWordmark} alt="KURIO" className="h-7 w-[120px] object-contain object-left" /></a>
          <p>Feito para colecionadores,<br /> criadores e cultura</p>
          <a href="mailto:contato@email.com" className="hover:text-[#e69a55]">contato@email.com</a>
          <a href="tel:+551140028922" className="hover:text-[#e69a55]">+55 11 4002 8922</a>
        </div>

        <section aria-label="Links do rodapé" className="grid grid-cols-1 gap-8 px-6 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-3 text-sm font-bold">{group.title}</h2>
              <ul className="list-none space-y-2 p-0 text-xs text-[#d2c4b7]">
                {group.links.map((label) => <li key={label}><a href={label === 'Meu perfil' ? '/profile' : '#catalogo'} className="hover:text-[#e69a55]">{label}</a></li>)}
              </ul>
            </nav>
          ))}
          <div>
            <h2 className="mb-3 text-sm font-bold">Redes sociais</h2>
            <div id="redes-sociais" className="mb-5 flex gap-2">
              {socialLinks.map((social) => (
                <a key={social.name} href="#redes-sociais" aria-label={social.name} className="grid size-7 place-items-center rounded border border-[#9b6031] hover:bg-[#3b2412]">
                  <img src={social.icon} alt="" className="size-4" />
                </a>
              ))}
              <a href="#redes-sociais" aria-label="YouTube" className="grid size-7 place-items-center rounded border border-[#9b6031] text-xs text-[#d28a4c]">▶</a>
            </div>
            <h3 className="mb-2 text-sm font-bold">Carteiras compatíveis</h3>
            <p className="inline-block rounded bg-[#4a2c15] px-2 py-1 text-[8px] uppercase tracking-wide text-[#e69a55]">MetaMask · WalletConnect · Coinbase</p>
          </div>
        </section>
      </footer>
      <p className="py-4 text-center font-mono text-xs text-[#b8aa9b]">© 2026 Kurio. Propriedade digital para todos.</p>
    </main>
    </>
  )
}

export default App
