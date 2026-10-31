import { Link, useParams, useSearch } from '@tanstack/react-router'
import { useCommerce } from './CommerceProvider'
import './confirmation.css'

export default function OrderConfirmation() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const search = useSearch({ from: '/orders/$orderId' })
  const { orders } = useCommerce()
  const order = orders.find((item) => item.id === orderId)

  return (
    <main className="confirmation-page">
      {order ? <section className="confirmation-card" aria-labelledby="confirmation-title">
        <Link to="/" search={search} hash="catalogo" aria-label="Fechar confirmação e voltar ao mercado" className="confirmation-close">×</Link>
        <header className="confirmation-heading">
          <svg className="confirmation-icon" viewBox="0 0 72 82" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M8 35 36 12l28 23v42H8Z"/><path d="M13 43V11h46v32M8 77l28-30 28 30M8 35l19 20M64 35 45 55M29 11c2-7 12-7 14 0"/></g><text x="36" y="29" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold">THANK</text><text x="36" y="41" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold">YOU</text></svg>
          <h1 id="confirmation-title">Seu pedido foi confirmado</h1>
        </header>
        <dl className="confirmation-meta">
          <div><dt>ID do pedido</dt><dd title={order.id}>{order.id}</dd></div>
          <div><dt>Data</dt><dd>{new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</dd></div>
          <div><dt>Total</dt><dd>{order.totalEth} ETH</dd></div>
          <div><dt>Carteira</dt><dd>{order.wallet ?? 'Não informada'}</dd></div>
        </dl>
        <div className="confirmation-body">
          <h2>Detalhes da transação</h2>
          <div className="confirmation-columns"><strong>NFTs</strong><strong>Edições</strong><strong>Subtotal</strong></div>
          <ul className="confirmation-items">{order.items.map((item) => <li key={item.id}><div className="confirmation-nft"><img src={item.imageUrl} alt="" /><div><strong>{item.name}</strong><small>ID do token: #{(item.name.match(/#(\d+)$/)?.[1] ?? '').padStart(4, '0')}</small></div></div><span>(× {item.quantity ?? 1})</span><b>{item.priceEth} ETH</b></li>)}</ul>
          <dl className="confirmation-totals">{order.discountEth && order.discountEth !== '0.00' && <div><dt>Desconto</dt><dd>− {order.discountEth} ETH</dd></div>}<div><dt>Taxa de rede</dt><dd>{order.networkFeeEth ?? '0.00'} ETH</dd></div><div><dt>Total</dt><dd>{order.totalEth} ETH</dd></div></dl>
          <p className="confirmation-message">Pedido demonstrativo confirmado. Nenhuma transferência de fundos ou de NFTs foi realizada na rede.</p>
          {order.transactionHash && /^0x[0-9a-fA-F]{64}$/.test(order.transactionHash) ? <a className="confirmation-explorer" href={`https://etherscan.io/tx/${order.transactionHash}`} target="_blank" rel="noreferrer">Ver no Etherscan</a> : <button className="confirmation-explorer" type="button" disabled title="Disponível quando houver uma transação real na rede">Ver no Etherscan</button>}
        </div>
      </section> : <section className="confirmation-card confirmation-missing"><h1>Pedido não encontrado</h1><Link to="/" search={search}>Voltar ao mercado</Link></section>}
    </main>
  )
}
