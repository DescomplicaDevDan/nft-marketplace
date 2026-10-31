import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useNFTs } from '@/features/catalog/api'
import type { CatalogSearch } from '@/features/catalog/types'
import { useCommerce, type Order } from './CommerceProvider'

const WEI = 10n ** 18n

function ethToWei(value: string) {
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole || '0') * WEI + BigInt(fraction.padEnd(18, '0').slice(0, 18) || '0')
}

function weiToEth(value: bigint) {
  const whole = value / WEI
  const fraction = (value % WEI).toString().padStart(18, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

function CheckoutContent({ search }: { search: CatalogSearch }) {
  const navigate = useNavigate({ from: '/checkout' })
  const { cart, placeOrder } = useCommerce()
  const { data, isPending, isError } = useNFTs({ page: 1, pageSize: 24 })
  const items = data?.items.filter((nft) => cart.includes(nft.id)) ?? []
  const total = items.reduce((sum, nft) => sum + ethToWei(nft.priceEth), 0n)

  function confirmOrder() {
    if (items.length === 0 || items.length !== cart.length) return
    const order: Order = {
      id: `KURIO-${Date.now().toString(36).toUpperCase()}`,
      items: items.map(({ id, name, collection, priceEth, imageUrl }) => ({ id, name, collection, priceEth, imageUrl })),
      totalEth: weiToEth(total),
      createdAt: new Date().toISOString(),
    }
    placeOrder(order)
    void navigate({ to: '/orders/$orderId', params: { orderId: order.id }, search })
  }

  return (
    <>
      <h1 className="mb-2 font-mono text-3xl font-bold">Revisar pedido</h1>
      <p className="mb-8 text-sm text-[#b8aa9b]">Checkout demonstrativo: nenhum pagamento real será realizado.</p>
      {isPending && <p role="status">Carregando carrinho…</p>}
      {isError && <p role="alert" className="text-[#e69a55]">Não foi possível carregar o carrinho.</p>}
      {!isPending && items.length === 0 && (
        <div className="border border-[#49372b] p-8 text-center">
          <p className="mb-4 text-[#b8aa9b]">Não há itens válidos para finalizar.</p>
          <Link to="/" search={search} className="text-[#e69a55] underline">Voltar ao catálogo</Link>
        </div>
      )}
      {items.length > 0 && (
        <>
          <ul className="mb-8 list-none divide-y divide-[#49372b] border-y border-[#49372b] p-0">
            {items.map((nft) => (
              <li key={nft.id} className="flex items-center gap-4 py-4">
                <img src={nft.imageUrl} alt="" className="size-20 object-cover" />
                <div className="min-w-0 flex-1 font-mono">
                  <p className="truncate">{nft.name}</p>
                  <p className="text-sm text-[#b8aa9b]">{nft.collection}</p>
                </div>
                <p className="shrink-0 font-mono text-[#e69a55]">{nft.priceEth} ETH</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-lg">Total: <strong className="text-[#e69a55]">{weiToEth(total)} ETH</strong></p>
            <button type="button" onClick={confirmOrder} disabled={items.length !== cart.length} className="bg-[#e69a55] px-5 py-3 font-bold text-[#1b1310] disabled:opacity-50">
              Confirmar pedido simulado
            </button>
          </div>
        </>
      )}
    </>
  )
}

function CommerceHeader({ search }: { search: CatalogSearch }) {
  return (
    <header className="mb-10 flex items-center justify-between border-b border-[#49372b] pb-5">
      <Link to="/" search={search} className="font-mono text-sm text-[#b8aa9b] hover:text-[#f5f1eb]">KURIO</Link>
      <Link to="/cart" search={search} className="font-mono text-sm text-[#e69a55]">Carrinho</Link>
    </header>
  )
}

export function CheckoutPage() {
  const search = useSearch({ from: '/checkout' })
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-5 py-8 text-[#f5f1eb] sm:px-8 lg:px-[120px]">
      <CommerceHeader search={search} />
      <section className="mx-auto max-w-3xl"><CheckoutContent search={search} /></section>
    </main>
  )
}

export function OrdersPage() {
  const search = useSearch({ from: '/orders' })
  const { orders } = useCommerce()
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-5 py-8 text-[#f5f1eb] sm:px-8 lg:px-[120px]">
      <CommerceHeader search={search} />
      <h1 className="mb-8 font-mono text-3xl font-bold">Meus pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-[#b8aa9b]">Você ainda não tem pedidos.</p>
      ) : (
        <ul className="list-none divide-y divide-[#49372b] p-0">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div><p className="font-mono">{order.id}</p><p className="text-sm text-[#b8aa9b]">{new Date(order.createdAt).toLocaleString('pt-BR')}</p></div>
              <p className="font-mono text-[#e69a55]">{order.totalEth} ETH</p>
              <Link to="/orders/$orderId" params={{ orderId: order.id }} search={search} className="text-sm text-[#e69a55] underline">Ver pedido</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export function OrderConfirmationPage() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const search = useSearch({ from: '/orders/$orderId' })
  const { orders } = useCommerce()
  const order = orders.find((item) => item.id === orderId)

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-5 py-8 text-[#f5f1eb] sm:px-8 lg:px-[120px]">
      <CommerceHeader search={search} />
      {order ? (
        <section className="mx-auto max-w-2xl border border-[#49372b] p-8 text-center">
          <p className="mb-2 font-mono text-sm text-[#e69a55]">Pedido simulado confirmado</p>
          <h1 className="mb-2 font-mono text-3xl font-bold">Obrigado pela compra!</h1>
          <p className="mb-6 text-sm text-[#b8aa9b]">Pedido {order.id} · {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
          <ul className="mb-6 list-none space-y-2 p-0 text-left">
            {order.items.map((item) => <li key={item.id} className="flex justify-between gap-4"><span>{item.name}</span><span className="text-[#e69a55]">{item.priceEth} ETH</span></li>)}
          </ul>
          <p className="mb-8 font-mono text-lg">Total: <strong className="text-[#e69a55]">{order.totalEth} ETH</strong></p>
          <Link to="/orders" search={search} className="text-[#e69a55] underline">Ver meus pedidos</Link>
        </section>
      ) : (
        <div className="py-16 text-center"><h1 className="mb-4 font-mono text-2xl">Pedido não encontrado</h1><Link to="/" search={search} className="text-[#e69a55] underline">Voltar ao catálogo</Link></div>
      )}
    </main>
  )
}
