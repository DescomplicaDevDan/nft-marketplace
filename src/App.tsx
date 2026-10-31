import { useState, type FormEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import kurioWordmark from './assets/img/Logo.svg'
import { useNFTs } from '@/features/catalog/api'
import type { NFTNetwork } from '@/features/catalog/types'

const PAGE_SIZE = 4

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
      <input
        id="nft-search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Buscar NFTs, coleções ou artistas"
        className="h-11 min-w-0 flex-1 rounded-md border border-[#49372b] bg-[#1b1310] px-3 text-sm text-[#f5f1eb] outline-none placeholder:text-[#b8aa9b] focus-visible:ring-2 focus-visible:ring-[#e69a55]"
      />
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

  return (
    <form
      className="mt-8 border-t border-[#49372b] pt-6"
      onSubmit={(event) => {
        event.preventDefault()
        onApply(min.toFixed(2), max.toFixed(2))
      }}
    >
      <h3 className="mb-3 font-bold text-[#f5f1eb]">Faixa de preço</h3>
      <label className="sr-only" htmlFor="min-price">Preço mínimo em ETH</label>
      <input
        id="min-price"
        type="range"
        min={minCents}
        max={Math.max(minCents, Math.round(max * 100))}
        step="1"
        value={Math.round(min * 100)}
        onChange={(event) => setMin(Number(event.target.value) / 100)}
        className="mb-2 w-full accent-[#e69a55]"
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
        className="w-full accent-[#e69a55]"
      />
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
    <main className="mx-auto min-h-screen w-full max-w-7xl bg-[#110b08] px-5 py-8 text-left text-[#f5f1eb] sm:px-8 lg:px-12">
      <header className="mb-16 flex items-center justify-between border-b border-[#49372b] pb-5 font-mono text-sm text-[#ead8c5]">
        <a href="/" aria-label="Kurio — início" className="inline-flex items-center">
          <img src={kurioWordmark} alt="KURIO" className="h-[22px] w-[100px] sm:h-[35px] sm:w-[160px]" />
        </a>

        <nav aria-label="Navegação principal" className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] sm:gap-x-8 sm:text-sm">
          <a
            href="/"
            aria-current="page"
            className="border-b-2 border-[#e69a55] py-2 font-bold text-[#e69a55] sm:py-5"
          >
            Início
          </a>
          <a href="#catalogo" className="py-2 text-[#b8aa9b] transition-colors hover:text-[#f5f1eb] sm:py-5">
            Mercado
          </a>
          <span aria-disabled="true" title="Área ainda não disponível" className="py-2 text-[#75685e] sm:py-5">
            Criadores
          </span>
          <span aria-disabled="true" title="Área ainda não disponível" className="py-2 text-[#75685e] sm:py-5">
            Aprenda
          </span>
        </nav>
      </header>

      <section className="grid min-h-[520px] items-center gap-10 py-16 md:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-2xl font-mono">
          <p className="mb-5 text-sm tracking-[0.16em] text-[#f5f1eb]">
            Bem-vindo à Kurio
          </p>

          <h1 className="mb-4 text-[40px] font-bold uppercase leading-[1.65] tracking-normal text-[#f5f1eb]">
            Seja dono do futuro
            <br />
            da arte digital
          </h1>

          <p className="mb-8 max-w-xl text-sm leading-6 text-[#b8aa9b] sm:text-base">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </p>

          <a
            href="#catalogo"
            className="inline-flex h-10 items-center rounded-md bg-[#e69a55] px-7 font-sans text-sm font-bold text-[#1b1310] hover:brightness-110"
          >
            EXPLORAR
          </a>
        </div>

        <div aria-hidden="true" className="hidden items-end justify-center gap-2 pb-2 md:flex">
          <span className="size-2 rounded-full bg-[#e69a55]" />
          <span className="size-2 rounded-full bg-[#e69a55]" />
          <span className="size-2 rounded-full bg-[#e69a55]" />
        </div>
      </section>

      <section id="catalogo" aria-labelledby="catalog-title" className="scroll-mt-8">
        <div className="grid gap-8 lg:grid-cols-[310px_minmax(0,1fr)]">
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
              <div aria-label="Carregando NFTs" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((nft) => (
                    <li key={nft.id} className="overflow-hidden bg-[#1b1310] text-[#f5f1eb]">
                      <img src={nft.imageUrl} alt={nft.name} className="aspect-square w-full object-cover" loading="lazy" />
                      <div className="flex items-center justify-between gap-3 py-3">
                        <h3 className="truncate font-mono text-sm">{nft.name}</h3>
                        <p className="shrink-0 font-mono font-bold text-[#e69a55]">{nft.priceEth} ETH</p>
                      </div>
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
    </main>
  )
}

export default App
