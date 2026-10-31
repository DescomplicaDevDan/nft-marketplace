import type { NFT, NFTCategory, NFTNetwork } from '@/features/catalog/types'
import artwork05 from '@/assets/img/NFT Artwork 05.png'
import artwork09 from '@/assets/img/NFT Artwork 09.png'
import artwork18 from '@/assets/img/NFT Artwork 18.png'
import frame136 from '@/assets/img/Frame 136.png'

export const categoryCounts: Array<{ name: NFTCategory; count: number }> = [
  { name: 'Arte digital', count: 33 },
  { name: 'Fotografia', count: 12 },
  { name: 'Música', count: 65 },
  { name: 'Arte 3D', count: 39 },
  { name: 'Colecionáveis', count: 23 },
  { name: 'Generativa', count: 17 },
  { name: 'Jogos', count: 19 },
  { name: 'Assinaturas', count: 13 },
  { name: 'Utilidade', count: 18 },
]

export const networkCounts: Array<{ name: NFTNetwork; count: number }> = [
  { name: 'Ethereum', count: 119 },
  { name: 'Polygon', count: 78 },
  { name: 'Solana', count: 86 },
]

const firstPageNFTs: NFT[] = [
  { id: 'nft-001', name: 'Emerald Ape #042', collection: 'Emerald Apes', creator: 'Kurio Artist', category: 'Colecionáveis', network: 'Ethereum', priceEth: '1.19', available: 5, createdAt: '2026-10-28T12:00:00Z', sales: 19, imageUrl: frame136, imageFrame: { width: 250, height: 250, left: 4, top: 31 }, summary: 'Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na Ethereum.', displayCollection: 'Kurio Apes', editionLabel: '1/50', attributes: ['Óculos', 'Esmeralda', 'Raro'], rating: 4.8, reviewsCount: 19 },
  { id: 'nft-002', name: 'Sage Nomad #009', collection: 'Sage Nomads', creator: 'Kurio Artist', category: 'Colecionáveis', network: 'Polygon', priceEth: '1.69', available: 12, createdAt: '2026-10-29T12:00:00Z', sales: 27, imageUrl: artwork18, imageFrame: { width: 250, height: 250, left: 4, top: 25 } },
  { id: 'nft-003', name: 'Neon Vessel #552', collection: 'Neon Vessels', creator: 'Maya Chen', category: 'Arte 3D', network: 'Solana', priceEth: '1.99', previousPriceEth: '2.29', available: 2, createdAt: '2026-10-30T12:00:00Z', sales: 8, imageUrl: artwork05, imageFrame: { width: 250, height: 250, left: 4, top: 24 } },
  { id: 'nft-004', name: 'Cosmic Bloom #118', collection: 'Cosmic Bloom', creator: 'Maya Chen', category: 'Generativa', network: 'Ethereum', priceEth: '1.29', available: 8, createdAt: '2026-10-27T12:00:00Z', sales: 36, imageUrl: artwork18, imageFrame: { width: 224, height: 286, left: 20, top: 6 } },
  { id: 'nft-005', name: 'Violet Nomad #314', collection: 'Violet Nomads', creator: 'Kurio Artist', category: 'Colecionáveis', network: 'Polygon', priceEth: '1.39', available: 1, createdAt: '2026-10-26T12:00:00Z', sales: 12, imageUrl: artwork18, imageFrame: { width: 250, height: 250, left: 4, top: 24 }, editionLabel: '1/1' },
  { id: 'nft-006', name: 'Ivory Baron #088', collection: 'Ivory Barons', creator: 'Kurio Artist', category: 'Arte 3D', network: 'Solana', priceEth: '1.79', available: 7, createdAt: '2026-10-25T12:00:00Z', sales: 4, imageUrl: artwork05, imageFrame: { width: 250, height: 250, left: 4, top: 24 }, editionLabel: '1/10' },
  { id: 'nft-007', name: 'Golden Beat #207', collection: 'Golden Beats', creator: 'Leo Martins', category: 'Música', network: 'Ethereum', priceEth: '0.99', available: 7, createdAt: '2026-10-24T12:00:00Z', sales: 14, imageUrl: artwork09, imageFrame: { width: 250, height: 250, left: 4, top: 20 }, editionLabel: '1/50' },
  { id: 'nft-008', name: 'Golden Signal #160', collection: 'Golden Signals', creator: 'Ana Costa', category: 'Música', network: 'Polygon', priceEth: '0.39', available: 3, createdAt: '2026-10-23T12:00:00Z', sales: 11, imageUrl: artwork09, imageFrame: { width: 250, height: 250, left: 4, top: 28 } },
  { id: 'nft-009', name: 'Golden Signal #161', collection: 'Golden Signals', creator: 'Ana Costa', category: 'Música', network: 'Solana', priceEth: '0.39', available: 6, createdAt: '2026-10-22T12:00:00Z', sales: 9, imageUrl: artwork09, imageFrame: { width: 250, height: 250, left: 4, top: 20 } },
]

export const nfts: NFT[] = [
  ...firstPageNFTs,
  ...Array.from({ length: 27 }, (_, index) => {
    const source = firstPageNFTs[index % firstPageNFTs.length]
    const edition = Math.floor(index / firstPageNFTs.length) + 1
    const match = source.name.match(/#(\d+)$/)

    return {
      ...source,
      id: `nft-${String(index + 10).padStart(3, '0')}`,
      name: match ? source.name.replace(/#\d+$/, `#${String(Number(match[1]) + edition * 10).padStart(match[1].length, '0')}`) : `${source.name} ${edition + 1}`,
      createdAt: new Date(Date.parse(source.createdAt) - edition * 9 * 24 * 60 * 60 * 1000).toISOString(),
      sales: source.sales + edition * 3,
    }
  }),
]

export const featuredNFT = nfts[3]
