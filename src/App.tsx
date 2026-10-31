import { useState, type FormEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useNFTs } from '@/features/catalog/api'

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
        className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90" type="submit">Buscar</button>
    </form>
  )
}

function App() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const { data, isPending, isError, refetch } = useNFTs({
    search: search.search,
    page: search.page,
    pageSize: PAGE_SIZE,
  })

  function submitSearch(value: string) {
    void navigate({
      search: (previous) => ({ ...previous, search: value, page: 1 }),
    })
  }

  function changePage(page: number) {
    void navigate({ search: (previous) => ({ ...previous, page }) })
  }

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE)

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 text-left text-foreground sm:px-8 lg:px-12">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-5 border-b pb-6">
        <a href="/" className="text-xl font-bold tracking-tight text-foreground">NFT MARKETPLACE<span className="text-primary">.</span></a>
        <nav aria-label="Navegação principal" className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#catalogo" className="font-medium text-foreground">Explorar</a>
          <span aria-disabled="true" className="cursor-not-allowed opacity-60">Conectar carteira</span>
        </nav>
      </header>

      <section className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">NFT Marketplace</p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Arte digital, em novas perspectivas.</h1>
        <p className="text-base leading-7 text-muted-foreground">Descubra peças digitais de artistas independentes.</p>
      </section>

      <section id="catalogo" aria-labelledby="catalog-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="catalog-title" className="text-2xl font-semibold text-foreground">Explorar NFTs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data ? data.total + ' itens disponíveis' : 'Carregando catálogo'}
            </p>
          </div>
          <SearchForm key={search.search} value={search.search} onSearch={submitSearch} />
        </div>

        {isPending && (
          <div aria-label="Carregando NFTs" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-xl border">
                <div className="aspect-square bg-muted" />
                <div className="space-y-3 p-4"><div className="h-4 w-2/3 rounded bg-muted" /><div className="h-4 w-1/3 rounded bg-muted" /></div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div role="alert" className="rounded-lg border p-6 text-center">
            <p className="mb-3 text-foreground">Não foi possível carregar o catálogo.</p>
            <button onClick={() => void refetch()} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Tentar novamente</button>
          </div>
        )}

        {data && data.items.length === 0 && (
          <p className="rounded-lg border p-10 text-center text-muted-foreground">Nenhum NFT encontrado. Tente outra busca.</p>
        )}

        {data && data.items.length > 0 && (
          <>
            <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {data.items.map((nft) => (
                <li key={nft.id} className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
                  <img src={nft.imageUrl} alt={nft.name} className="aspect-square w-full object-cover" loading="lazy" />
                  <div className="p-4">
                    <p className="truncate text-xs text-muted-foreground">{nft.collection} · {nft.creator}</p>
                    <h3 className="mt-1 truncate font-semibold">{nft.name}</h3>
                    <div className="mt-4 flex items-end justify-between gap-2">
                      <div><p className="text-xs text-muted-foreground">Preço</p><p className="font-semibold">{nft.priceEth} ETH</p></div>
                      <p className="text-right text-xs text-muted-foreground">{nft.available} disponíveis</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <nav aria-label="Paginação do catálogo" className="mt-8 flex items-center justify-center gap-4">
                <button disabled={search.page <= 1} onClick={() => changePage(search.page - 1)} className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
                <span aria-live="polite" className="text-sm text-muted-foreground">Página {search.page} de {totalPages}</span>
                <button disabled={search.page >= totalPages} onClick={() => changePage(search.page + 1)} className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Próxima</button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default App
