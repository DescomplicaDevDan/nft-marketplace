import { Link, useParams, useSearch } from '@tanstack/react-router'
import { useOrder } from './orderApi'
import { isAxiosError } from 'axios'
import './confirmation.css'

export default function OrderConfirmation() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const search = useSearch({ from: '/orders/$orderId' })
  const query = useOrder(orderId)
  const order = query.data
  if (query.isPending) return <main className="confirmation-page"><p role="status">Consultando pedido…</p></main>
  if (query.isError && !order) return <main className="confirmation-page"><section className="confirmation-card confirmation-missing"><h1>{isAxiosError(query.error) && query.error.response?.status === 404 ? 'Pedido não encontrado' : 'Não foi possível consultar o pedido'}</h1><button type="button" onClick={() => { void query.refetch() }}>Tentar novamente</button><Link to="/orders" search={search}>Meus pedidos</Link></section></main>

  return (
    <main className="confirmation-page">
      {order ? <section className="confirmation-card" aria-labelledby="confirmation-title">
        <Link to="/" search={search} hash="catalogo" aria-label="Fechar confirmação e voltar ao mercado" className="confirmation-close">×</Link>
        <header className="confirmation-heading">
          {order.status === 'confirmed' && <svg className="confirmation-icon" viewBox="0 0 72 82" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M8 35 36 12l28 23v42H8Z"/><path d="M13 43V11h46v32M8 77l28-30 28 30M8 35l19 20M64 35 45 55M29 11c2-7 12-7 14 0"/></g><text x="36" y="29" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold">THANK</text><text x="36" y="41" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold">YOU</text></svg>}
          <h1 id="confirmation-title" aria-live="polite">{order.status === 'confirmed' ? 'Seu pedido foi confirmado' : order.status === 'rejected' ? 'Pagamento recusado' : 'Seu pedido está em processamento'}</h1>
        </header>
        <dl className="confirmation-meta">
          <div><dt>ID do pedido</dt><dd title={order.id}>{order.id}</dd></div>
          <div><dt>Data</dt><dd>{new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</dd></div>
          <div><dt>Total</dt><dd>{order.totalEth} ETH</dd></div>
          <div><dt>Carteira</dt><dd>{order.wallet ?? 'Não informada'}</dd></div>
        </dl>
        <div className="confirmation-body">
          <h2>{order.status === 'confirmed' ? 'Detalhes da transação' : 'Detalhes do pedido'}</h2>
          <div className="confirmation-columns"><strong>NFTs</strong><strong>Edições</strong><strong>Subtotal</strong></div>
          <ul className="confirmation-items">{order.items.map((item) => <li key={item.lineId}><div className="confirmation-nft"><img src={item.imageUrl} alt="" /><div><strong>{item.name}</strong><small>ID do token: #{(item.name.match(/#(\d+)$/)?.[1] ?? '').padStart(4, '0')} · Edição: {item.editionLabel}</small></div></div><span>(× {item.quantity ?? 1})</span><b>{item.priceEth} ETH</b></li>)}</ul>
          <dl className="confirmation-totals">{order.discountEth && order.discountEth !== '0.00' && <div><dt>Desconto</dt><dd>− {order.discountEth} ETH</dd></div>}<div><dt>Taxa de rede</dt><dd>{order.networkFeeEth ?? '0.00'} ETH</dd></div><div><dt>Total</dt><dd>{order.totalEth} ETH</dd></div></dl>
          <p className="confirmation-message" role="status">{order.status === 'confirmed' ? 'Pedido demonstrativo confirmado pela API. Nenhuma transferência real de fundos ou de NFTs foi realizada.' : order.status === 'rejected' ? order.reason : 'Aguardando a resposta da carteira simulada. Você pode atualizar a página; este pedido será recuperado.'}</p>
          {query.isError && <p role="alert">Conexão interrompida. O último estado conhecido foi preservado. <button type="button" onClick={() => { void query.refetch() }}>Consultar novamente</button></p>}
          {order.status === 'confirmed' && <Link className="confirmation-explorer" to="/explorer/$orderId" params={{ orderId: order.id }} search={search}>Ver no explorador simulado</Link>}
          {order.status === 'rejected' && <Link className="confirmation-explorer" to="/cart" search={search}>Voltar ao carrinho</Link>}
        </div>
      </section> : <section className="confirmation-card confirmation-missing"><h1>Pedido não encontrado</h1><Link to="/" search={search}>Voltar ao mercado</Link></section>}
    </main>
  )
}

export function SimulatedExplorer() {
  const { orderId } = useParams({ from: '/explorer/$orderId' })
  const search = useSearch({ from: '/explorer/$orderId' })
  const query = useOrder(orderId)
  return <main className="confirmation-page"><section className="confirmation-card confirmation-missing"><h1>Explorador simulado</h1><p>Esta referência pertence ao ambiente de demonstração e não representa uma transação real na blockchain.</p>{query.isPending && <p role="status">Carregando referência…</p>}{query.isError && <p role="alert">Não foi possível consultar a referência.</p>}{query.data && <dl><dt>Pedido</dt><dd>{query.data.id}</dd><dt>Estado</dt><dd>{query.data.status}</dd><dt>Referência simulada</dt><dd className="confirmation-reference">{query.data.transactionHash ?? 'Ainda não confirmada'}</dd></dl>}<Link to="/orders/$orderId" params={{ orderId }} search={search}>Voltar ao pedido</Link></section></main>
}
