import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NFT, NFTListParams, NFTListResponse } from './types'

async function getNFTs(params: NFTListParams, signal?: AbortSignal): Promise<NFTListResponse> {
  const response = await api.get<NFTListResponse>('/nfts', { params, signal })
  return response.data
}

export function useNFTs(params: NFTListParams) {
  return useQuery({
    queryKey: ['nfts', params],
    queryFn: ({ signal }) => getNFTs(params, signal),
  })
}

async function getNFT(id: string, signal?: AbortSignal): Promise<NFT> {
  const response = await api.get<NFT>(`/nfts/${id}`, { signal })
  return response.data
}

export function useNFT(id: string) {
  return useQuery({ queryKey: ['nft', id], queryFn: ({ signal }) => getNFT(id, signal) })
}
