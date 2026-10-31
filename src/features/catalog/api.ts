import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NFTListParams, NFTListResponse } from './types'

async function getNFTs(params: NFTListParams): Promise<NFTListResponse> {
  const response = await api.get<NFTListResponse>('/nfts', { params })
  return response.data
}

export function useNFTs(params: NFTListParams) {
  return useQuery({
    queryKey: ['nfts', params],
    queryFn: () => getNFTs(params),
  })
}
