import { Link, useParams, useSearch } from '@tanstack/react-router'
import type { CatalogSearch } from '@/features/catalog/types'
import { useCommerce } from './CommerceProvider'

function CommerceHeader({ search }: { search: CatalogSearch }) {
  return (
    <header className="mb-10 flex items-center justify-between border-b border-[#49372b] pb-5">
      <Link to="/" search={search} className="font-mono text-sm text-[#b8aa9b] hover:text-[#f5f1eb]">KURIO</Link>
      <Link to="/cart" search={search} className="font-mono text-sm text-[#e69a55]">Carrinho</Link>
    </header>
  )
}

export { default as CheckoutPage } from './CheckoutScreen'

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
