import { Link, useSearch } from '@tanstack/react-router'
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

export { default as OrderConfirmationPage } from './OrderConfirmation'
