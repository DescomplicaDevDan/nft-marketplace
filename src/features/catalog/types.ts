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
