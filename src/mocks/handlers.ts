import { http, HttpResponse } from 'msw'
import { nfts } from './data/nfts'
import type { NFTListResponse } from '@/features/catalog/types'

export const handlers = [
  http.get('/api/nfts', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.trim().toLowerCase() ?? ''
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.min(24, Math.max(1, Number(url.searchParams.get('pageSize')) || 12))
    const filtered = nfts.filter((nft) =>
      `${nft.name} ${nft.collection} ${nft.creator}`.toLowerCase().includes(search),
    )
    const body: NFTListResponse = {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    }

    return HttpResponse.json(body)
  }),
]
