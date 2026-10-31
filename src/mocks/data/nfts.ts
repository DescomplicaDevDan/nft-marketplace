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

export const nfts: NFT[] = [
  { id: 'nft-001', name: 'Emerald Ape #042', collection: 'Emerald Apes', creator: 'Kurio Artist', category: 'Colecionáveis', network: 'Ethereum', priceEth: '1.19', available: 5, createdAt: '2026-10-28T12:00:00Z', sales: 19, imageUrl: frame136 },
  { id: 'nft-002', name: 'Sage Nomad #009', collection: 'Sage Nomads', creator: 'Kurio Artist', category: 'Colecionáveis', network: 'Polygon', priceEth: '1.69', available: 12, createdAt: '2026-10-29T12:00:00Z', sales: 27, imageUrl: artwork18 },
  { id: 'nft-003', name: 'Chromatic Drift', collection: 'Future Forms', creator: 'Maya Chen', category: 'Arte 3D', network: 'Solana', priceEth: '12.3', available: 2, createdAt: '2026-10-30T12:00:00Z', sales: 8, imageUrl: artwork05 },
  { id: 'nft-004', name: 'Blue Current', collection: 'Ocean Memory', creator: 'Ana Costa', category: 'Colecionáveis', network: 'Ethereum', priceEth: '0.31', available: 8, createdAt: '2026-10-27T12:00:00Z', sales: 36, imageUrl: artwork09 },
  { id: 'nft-005', name: 'Glass Garden', collection: 'Soft Signals', creator: 'Leo Martins', category: 'Generativa', network: 'Polygon', priceEth: '1.2', available: 1, createdAt: '2026-10-26T12:00:00Z', sales: 12, imageUrl: artwork05 },
  { id: 'nft-006', name: 'After the Rain', collection: 'Ocean Memory', creator: 'Ana Costa', category: 'Música', network: 'Solana', priceEth: '0.02', available: 7, createdAt: '2026-10-25T12:00:00Z', sales: 4, imageUrl: artwork18 },
]
