import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NFT, NFTListParams, NFTListResponse } from './types'

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

async function getNFT(id: string): Promise<NFT> {
  const response = await api.get<NFT>(`/nfts/${id}`)
  return response.data
}

export function useNFT(id: string) {
  return useQuery({ queryKey: ['nft', id], queryFn: () => getNFT(id) })
}
