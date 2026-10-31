export interface NFT {
  id: string
  name: string
  collection: string
  creator: string
  priceEth: string
  available: number
  imageUrl: string
}

export interface NFTListResponse {
  items: NFT[]
  total: number
  page: number
  pageSize: number
}

export interface NFTListParams {
  search?: string
  page?: number
  pageSize?: number
}
