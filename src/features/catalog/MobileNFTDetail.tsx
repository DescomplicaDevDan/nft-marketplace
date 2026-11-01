import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useCommerce } from '@/features/commerce/CommerceProvider'
import type { NFT } from './types'
import { defaultEditionId, editionLineId } from './types'
import backIcon from '@/assets/icons/Arrow - Left 2.svg'
import heartIcon from '@/assets/icons/Vector 2.svg'
import filledHeartIcon from '@/assets/icons/Vector.svg'
import cartIcon from '@/assets/icons/Cart Icon 2.svg'
import starIcon from '@/assets/icons/Star.svg'
import './mobile-detail.css'

type Props = { nft: NFT | undefined; loading: boolean; error: boolean; notFound: boolean; retry: () => void }

export function MobileNFTDetail({ nft, loading, error, notFound, retry }: Props) {
  const search = useSearch({ from: '/nft/$nftId' })
  const navigate = useNavigate({ from: '/nft/$nftId' })
  const { favorites, toggleFavorite, addToCart, cartBusy, quantities } = useCommerce()
  const [requested, setRequested] = useState(1)
  const [selectedEditionId, setSelectedEditionId] = useState<string>()
  const [buying, setBuying] = useState(false)
  const mounted = useRef(false)
  const locked = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const favorite = nft ? favorites.includes(nft.id) : false
  const selectedEdition = nft?.editions?.find((edition) => edition.id === selectedEditionId) ?? nft?.editions?.find((edition) => edition.id === defaultEditionId(nft)) ?? nft?.editions?.find((edition) => edition.available > 0)
  const lineId = nft && selectedEdition ? editionLineId(nft.id, selectedEdition.id) : ''
  const remaining = selectedEdition ? Math.max(0, selectedEdition.available - (quantities[lineId] ?? 0)) : 0
  const quantity = Math.max(1, Math.min(requested, remaining || 1))
  const disabled = cartBusy || buying || remaining < 1

  async function buy(openCart: boolean) {
    if (!nft || disabled || locked.current) return
    locked.current = true
    setBuying(true)
    try {
      const success = selectedEdition ? await addToCart(nft.id, quantity, selectedEdition.id) : false
      if (success && openCart && mounted.current) void navigate({ to: '/cart', search })
    } finally {
      locked.current = false
      if (mounted.current) setBuying(false)
    }
  }

  return <main className="mobile-nft-detail">
    <header className="mobile-detail-nav"><Link to="/" search={search} hash="mobile-catalog" aria-label="Voltar ao catálogo"><img src={backIcon} alt="" /></Link>{nft && <button type="button" aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar NFT'} aria-pressed={favorite} onClick={() => toggleFavorite(nft.id)}><img src={favorite ? filledHeartIcon : heartIcon} alt="" /></button>}</header>
    {loading && <div className="mobile-detail-loading" role="status" aria-label="Carregando NFT"><div className="kurio-skeleton" /><i className="kurio-skeleton" /><i className="kurio-skeleton" /><span className="sr-only">Carregando NFT…</span></div>}
    {!nft && error && <section className="mobile-detail-error" role="alert"><h1>{notFound ? 'NFT não encontrado' : 'Não foi possível carregar este NFT'}</h1><button type="button" onClick={retry}>Tentar novamente</button></section>}
    {nft && <>
      <div className="mobile-detail-artwork"><img src={nft.imageUrl} alt={nft.name} /></div>
      <section className="mobile-detail-info" aria-labelledby="mobile-detail-title">
        <div className="mobile-detail-title-row"><h1 id="mobile-detail-title">{nft.name}</h1>{nft.rating !== undefined && <span className="mobile-detail-rating" aria-label={`Avaliação ${nft.rating.toLocaleString('pt-BR')} de 5, ${nft.reviewsCount ?? 0} avaliações`}><img src={starIcon} alt="" />{nft.rating.toFixed(1)}({nft.reviewsCount ?? 0})</span>}</div>
        <p className="mobile-detail-summary">{nft.summary ?? `Um colecionável digital da coleção ${nft.collection}, disponível na rede ${nft.network}.`}</p>
        <div className="mobile-detail-edition"><h2>Edição:</h2><div aria-label="Edições da coleção">{(nft.editions ?? []).map((edition) => <button key={edition.id} type="button" className={edition.id === selectedEdition?.id ? 'selected' : ''} aria-pressed={edition.id === selectedEdition?.id} disabled={edition.available < 1} title={`${edition.available} disponíveis`} onClick={() => { setSelectedEditionId(edition.id); setRequested(1) }}>{edition.label}</button>)}</div></div>
        <dl className="mobile-detail-metadata"><div><dt>ID do token:</dt><dd>#{(nft.name.match(/#(\d+)$/)?.[1] ?? nft.id).padStart(4, '0')}</dd></div><div><dt>Coleção:</dt><dd>{nft.displayCollection ?? nft.collection}</dd></div>{nft.attributes?.length ? <div><dt>Atributos:</dt><dd>{nft.attributes.join(', ')}</dd></div> : <div><dt>Rede:</dt><dd>{nft.network}</dd></div>}</dl>
        {error && <p className="mobile-detail-warning" role="alert">Não foi possível atualizar os dados. <button type="button" onClick={retry}>Tentar novamente</button></p>}
        {remaining < 1 && <p className="mobile-detail-warning" role="status">{nft.available < 1 ? 'NFT indisponível no momento.' : 'Todas as edições disponíveis já estão no seu carrinho.'}</p>}
      </section>
      <section className="mobile-detail-purchase" aria-label="Comprar NFT">
        <div className="mobile-detail-purchase-row"><div className="mobile-detail-quantity"><span>Qtd.</span><button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1 || buying || cartBusy} onClick={() => setRequested(quantity - 1)}>−</button><output aria-label="Quantidade selecionada" aria-live="polite">{quantity}</output><button type="button" aria-label="Aumentar quantidade" disabled={quantity >= remaining || buying || cartBusy} onClick={() => setRequested(quantity + 1)}>+</button></div><p>{selectedEdition?.priceEth ?? nft.priceEth} ETH</p></div>
        <div className="mobile-detail-actions"><Button type="button" variant="kurio" size="design" className="mobile-detail-buy" disabled={disabled} onClick={() => { void buy(true) }}>{buying ? 'Aguarde…' : 'Comprar NFT'}</Button><button type="button" className="mobile-detail-cart" aria-label="Adicionar NFT ao carrinho" disabled={disabled} onClick={() => { void buy(false) }}><img src={cartIcon} alt="" /></button></div>
      </section>
    </>}
  </main>
}
