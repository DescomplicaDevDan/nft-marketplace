export const NFT_CATEGORIES = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
] as const

export type NFTCategory = (typeof NFT_CATEGORIES)[number]
export const NFT_NETWORKS = ['Ethereum', 'Polygon', 'Solana'] as const
export type NFTNetwork = (typeof NFT_NETWORKS)[number]
export type NFTSort = 'recent' | 'popular' | 'price-low' | 'price-high'

export interface CatalogSearch {
  search: string
  category: NFTCategory | undefined
  network: NFTNetwork | undefined
  minPrice: string | undefined
  maxPrice: string | undefined
  sort: NFTSort | undefined
  page: number
}

export interface NFTEdition {
  id: string
  label: string
  priceEth: string
  available: number
}

export const EDITION_OPTIONS = [
  { id: 'one-of-one', label: '1/1' },
  { id: 'one-of-ten', label: '1/10' },
  { id: 'one-of-fifty', label: '1/50' },
  { id: 'open-edition', label: 'ABERTA' },
] as const

export function defaultEditionId(nft: Pick<NFT, 'editionLabel'>) {
  return EDITION_OPTIONS.find((edition) => edition.label === nft.editionLabel)?.id ?? 'one-of-fifty'
}

export function editionLineId(nftId: string, editionId: string) {
  return `${nftId}::${editionId}`
}

export function parseEditionLineId(lineId: string) {
  const [nftId, editionId] = lineId.split('::', 2)
  return editionId ? { nftId, editionId } : { nftId, editionId: 'one-of-fifty' }
}

export interface NFT {
  version?: number
  id: string
  name: string
  collection: string
  creator: string
  category: NFTCategory
  network: NFTNetwork
  priceEth: string
  previousPriceEth?: string
  summary?: string
  displayCollection?: string
  editionLabel?: string
  editions?: NFTEdition[]
  attributes?: string[]
  rating?: number
  reviewsCount?: number
  imageFrame?: { width: number; height: number; left: number; top: number }
  available: number
  createdAt: string
  sales: number
  imageUrl: string
}

export interface NFTListResponse {
  items: NFT[]
  featuredNFT?: NFT
  total: number
  page: number
  pageSize: number
  categoryCounts: Array<{ name: NFTCategory; count: number }>
  networkCounts: Array<{ name: NFTNetwork; count: number }>
  priceRange: { minEth: string; maxEth: string }
}

export interface NFTListParams {
  search?: string
  category?: NFTCategory
  network?: NFTNetwork
  minPrice?: string
  maxPrice?: string
  sort?: NFTSort
  page?: number
  pageSize?: number
}
