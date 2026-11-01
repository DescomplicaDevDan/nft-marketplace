import { NFT_CATEGORIES, NFT_NETWORKS, type NFT, type NFTListResponse } from '@/features/catalog/types'

export function catalogCounts(items: readonly NFT[]): Pick<NFTListResponse, 'categoryCounts' | 'networkCounts'> {
  return {
    categoryCounts: NFT_CATEGORIES.map((name) => ({ name, count: items.filter((item) => item.category === name).length })),
    networkCounts: NFT_NETWORKS.map((name) => ({ name, count: items.filter((item) => item.network === name).length })),
  }
}
