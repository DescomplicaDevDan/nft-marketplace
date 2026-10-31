import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import searchIcon from './assets/icons/Search Icon.svg'
import cartIcon from './assets/icons/Cart Icon.svg'
import userIcon from './assets/icons/User.svg'
import heroArtwork from './assets/img/Frame 136.png'
import kurioWordmark from './assets/img/Logo.svg'
import { useNFTs } from '@/features/catalog/api'
import type { NFTNetwork } from '@/features/catalog/types'
import { featuredCollections, journalArticles } from '@/mocks/data/homeContent'

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
      className="mt-8 border-t border-[#49372b] pt-6"
      onSubmit={(event) => {
        event.preventDefault()
        onApply(min.toFixed(2), max.toFixed(2))
      }}
    >
      <h3 className="mb-3 font-bold text-[#f5f1eb]">Faixa de preço</h3>
      <div className="relative h-6">
        <div
          aria-hidden="true"
          className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full"
          style={{ background: `linear-gradient(to right, #75685e ${minPosition}%, #e69a55 ${minPosition}% ${maxPosition}%, #75685e ${maxPosition}%)` }}
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
      <p className="my-3 text-xs text-[#b8aa9b]">
        Preço: {min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} – {max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ETH
      </p>
      <button type="submit" className="rounded-md bg-[#e69a55] px-4 py-2 text-sm font-bold text-[#1b1310] hover:brightness-110">
        Aplicar
      </button>
    </form>
  )
}

function App() {
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

  function changeSort(sort: 'recent' | 'popular' | undefined) {
    void navigate({
      search: (previous) => ({ ...previous, sort, page: 1 }),
      resetScroll: false,
    })
  }

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE)

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] bg-[#110b08] px-5 pt-3 pb-8 text-left text-[#f5f1eb] sm:px-8 lg:px-[120px]">
      <header className="mb-0 flex items-center justify-between border-b border-[#49372b] pb-2 font-mono text-sm text-[#ead8c5] md:grid md:grid-cols-[1fr_auto_1fr]">
        <a href="/" aria-label="Kurio — início" className="inline-flex items-center md:col-start-1 md:justify-self-start">
          <img src={kurioWordmark} alt="KURIO" className="h-[22px] w-[100px] sm:h-[35px] sm:w-[160px]" />
        </a>

        <nav aria-label="Navegação principal" className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] sm:gap-x-10 sm:text-base md:col-start-2 md:translate-x-10 md:justify-center">
          <a
            href="/"
            aria-current="page"
            className="border-b-2 border-[#e69a55] py-1 font-bold text-[#e69a55] sm:py-2"
          >
            Início
          </a>
          <a href="#catalogo" className="py-1 text-[#ead8c5] transition-colors hover:text-[#f5f1eb] sm:py-2">
            Mercado
          </a>
          <span aria-disabled="true" title="Área ainda não disponível" className="py-1 text-[#ead8c5] sm:py-2">
            Criadores
          </span>
          <span aria-disabled="true" title="Área ainda não disponível" className="py-1 text-[#ead8c5] sm:py-2">
            Aprenda
          </span>
        </nav>
        <div className="hidden items-center justify-self-end gap-4 md:flex">
          <a href="#catalogo" aria-label="Buscar NFTs" className="rounded p-1 hover:bg-[#211511]"><img src={searchIcon} alt="" className="size-4" /></a>
          <Link to="/cart" search={search} aria-label="Abrir carrinho" className="rounded p-1 hover:bg-[#211511]"><img src={cartIcon} alt="" className="size-4" /></Link>
          <button type="button" title="Entrar em breve" className="rounded bg-[#e69a55] px-3 py-1 text-xs font-bold text-[#1b1310]">Entrar</button>
          <span className="grid size-9 place-items-center rounded-full bg-[#f5f1eb]"><img src={userIcon} alt="Perfil" className="size-6" /></span>
        </div>
      </header>

      <section className="relative mt-8 grid min-h-[450px] items-start py-0 md:mb-[108px] md:grid-cols-[600px_450px] md:gap-[166px]">
        <div className="w-full max-w-[600px] font-mono md:w-[600px] md:max-w-none md:translate-x-10 md:pt-10">
          <p className="mb-5 text-sm tracking-[0.16em] text-[#f5f1eb]">
            Bem-vindo à Kurio
          </p>

          <h1 className="mb-2 text-[48px] font-bold uppercase leading-[1.5] tracking-normal text-[#f5f1eb]">
            Seja dono do futuro
            <br />
            da arte digital
          </h1>

          <p className="mb-12 max-w-[600px] text-sm leading-6 text-[#b8aa9b]">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </p>

          <a
            href="#catalogo"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-[#e69a55] px-7 font-sans text-sm font-bold text-[#1b1310] hover:brightness-110"
          >
            EXPLORAR
          </a>
        </div>

        <img
          src={heroArtwork}
          alt="NFT Emerald Ape com óculos e jaqueta verde"
          className="hidden size-[450px] rounded-2xl object-cover md:block"
        />
        <div aria-hidden="true" className="absolute bottom-7 left-[615px] hidden items-center gap-2 md:flex">
          <span className="size-2 rounded-full bg-[#e69a55]" />
          <span className="size-2 rounded-full bg-[#e69a55]" />
          <span className="size-2 rounded-full bg-[#e69a55]" />
        </div>
      </section>

      <section id="catalogo" aria-labelledby="catalog-title" className="scroll-mt-8">
        <div className="grid gap-8 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
          <aside aria-label="Filtros do catálogo" className="self-start bg-[#211511] p-5 font-mono sm:p-6">
            <h2 className="mb-5 text-xl font-bold text-[#f5f1eb]">Coleções</h2>
            <ul className="grid list-none grid-cols-2 gap-x-5 gap-y-1 p-0 lg:block">
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
                      className={`flex w-full items-center justify-between gap-3 py-2 text-left text-sm transition-colors hover:text-[#e69a55] ${selected ? 'font-semibold text-[#e69a55]' : 'text-[#b8aa9b]'}`}
                    >
                      <span>{item.name}</span>
                      <span>({item.count})</span>
                    </button>
                  </li>
                )
              })}
            </ul>

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

            <div className="mt-8 border-t border-[#49372b] pt-6">
              <h3 className="mb-3 font-bold text-[#f5f1eb]">Rede</h3>
              <ul className="list-none space-y-1 p-0">
                {data?.networkCounts.map((item) => {
                  const selected = search.network === item.name

                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => changeNetwork(item.name)}
                        className={`flex w-full items-center justify-between gap-3 py-2 text-left text-sm transition-colors hover:text-[#e69a55] ${selected ? 'font-semibold text-[#e69a55]' : 'text-[#b8aa9b]'}`}
                      >
                        <span>{item.name}</span>
                        <span>({item.count})</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
            {data?.featuredNFT && (
              <article className="mt-8 border-t border-[#49372b] pt-6">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#e69a55]">NFT em destaque</p>
                <p className="mb-3 text-[11px] uppercase tracking-wider text-[#b8aa9b]">Oferta limitada</p>
                <Link to="/nft/$nftId" params={{ nftId: data.featuredNFT.id }} search={search} className="group block">
                  <img src={data.featuredNFT.imageUrl} alt={data.featuredNFT.name} className="mb-2 aspect-square w-full object-cover" />
                  <span className="block truncate font-mono text-xs">{data.featuredNFT.name}</span>
                  <span className="font-mono text-xs font-bold text-[#e69a55]">{data.featuredNFT.priceEth} ETH</span>
                </Link>
              </article>
            )}
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <nav aria-label="Ordenar catálogo" role="tablist" className="flex flex-wrap gap-5 font-mono text-sm">
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
                        className={`border-b-2 pb-2 transition-colors ${selected ? 'border-[#e69a55] font-bold text-[#e69a55]' : 'border-transparent text-[#b8aa9b] hover:text-[#f5f1eb]'}`}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
                <p id="catalog-title" className="mt-2 text-sm text-[#b8aa9b]" aria-live="polite">
                  {data ? (data.total === 1 ? '1 item disponível' : data.total + ' itens disponíveis') : 'Carregando catálogo'}
                </p>
              </div>
              <SearchForm key={search.search} value={search.search} onSearch={submitSearch} />
            </div>

            {isPending && (
              <div aria-label="Carregando NFTs" className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,250px)]">
                {Array.from({ length: PAGE_SIZE }, (_, index) => (
                  <div key={index} className="animate-pulse overflow-hidden rounded-xl border border-[#49372b]">
                    <div className="aspect-square bg-[#211511]" />
                    <div className="space-y-3 p-4"><div className="h-4 w-2/3 rounded bg-[#211511]" /><div className="h-4 w-1/3 rounded bg-[#211511]" /></div>
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
                <ul className="grid list-none grid-cols-1 gap-x-5 gap-y-8 p-0 sm:grid-cols-[repeat(auto-fill,250px)]">
                  {data.items.map((nft) => (
                    <li key={nft.id} className="overflow-hidden bg-[#1b1310] text-[#f5f1eb]">
                      <Link
                        to="/nft/$nftId"
                        params={{ nftId: nft.id }}
                        search={search}
                        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e69a55]"
                      >
                        <img src={nft.imageUrl} alt={nft.name} className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]" loading="lazy" />
                        <div className="space-y-1 py-3">
                          <h3 className="truncate font-mono text-sm">{nft.name}</h3>
                          <p className="font-mono font-bold text-[#e69a55]">{nft.priceEth} ETH</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                {totalPages > 1 && (
                  <nav aria-label="Paginação do catálogo" className="mt-8 flex items-center justify-center gap-4">
                    <button disabled={search.page <= 1} onClick={() => changePage(search.page - 1)} className="rounded-md border border-[#49372b] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
                    <span aria-live="polite" className="text-sm text-[#b8aa9b]">Página {search.page} de {totalPages}</span>
                    <button disabled={search.page >= totalPages} onClick={() => changePage(search.page + 1)} className="rounded-md border border-[#49372b] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Próxima</button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Coleções em destaque" className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2">
        {featuredCollections.map((collection) => (
          <article key={collection.title} className="flex min-h-[220px] overflow-hidden bg-[#211511]">
            <img src={collection.image} alt="" className="w-1/2 object-cover" loading="lazy" />
            <div className="flex w-1/2 flex-col items-center justify-center px-4 py-6 text-center font-mono">
              <h2 className="mb-3 text-base font-bold leading-snug text-[#f5f1eb]">{collection.title}</h2>
              <p className="mb-3 text-xs leading-5 text-[#b8aa9b]">{collection.description}</p>
              <a href="#catalogo" className="rounded bg-[#e69a55] px-5 py-2 text-xs font-bold text-[#1b1310]">Explorar →</a>
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="journal-title" className="mt-16 pb-12">
        <header className="mb-8 text-center font-mono">
          <h2 id="journal-title" className="text-3xl font-bold text-[#f5f1eb]">Diário da Cunhagem</h2>
          <p className="mt-3 text-sm text-[#b8aa9b]">Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
        </header>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {journalArticles.map((article) => (
            <article key={article.title} className="overflow-hidden bg-[#211511] font-mono">
              <img src={article.image} alt="" className="aspect-[1.2] w-full object-cover" loading="lazy" />
              <div className="p-4">
                <p className="mb-3 text-[11px] text-[#b8aa9b]">{article.date} <span className="px-2">|</span> Leitura de {article.readingTime}</p>
                <h3 className="mb-2 text-sm font-bold leading-snug text-[#f5f1eb]">{article.title}</h3>
                <p className="mb-3 text-xs leading-5 text-[#b8aa9b]">{article.summary}</p>
                <a href="#journal-title" className="text-xs font-bold text-[#e69a55] hover:underline">Ler mais →</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
