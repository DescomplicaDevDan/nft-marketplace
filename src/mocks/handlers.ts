import { http, HttpResponse } from 'msw'
import { categoryCounts, networkCounts, nfts } from './data/nfts'
import type { NFTListResponse } from '@/features/catalog/types'

function ethToWei(value: string): bigint {
  const [whole, fraction = ''] = value.split('.')
  const paddedFraction = fraction.padEnd(18, '0').slice(0, 18)
  return BigInt(whole || '0') * 10n ** 18n + BigInt(paddedFraction || '0')
}

export const handlers = [
  http.get('/api/nfts/:id', ({ params }) => {
    const nft = nfts.find((item) => item.id === params.id)
    return nft
      ? HttpResponse.json(nft)
      : HttpResponse.json({ message: 'NFT não encontrado' }, { status: 404 })
  }),
  http.get('/api/nfts', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.trim().toLowerCase() ?? ''
    const category = url.searchParams.get('category')?.trim().toLowerCase() ?? ''
    const network = url.searchParams.get('network')?.trim().toLowerCase() ?? ''
    const minPrice = url.searchParams.get('minPrice')
    const maxPrice = url.searchParams.get('maxPrice')
    const sort = url.searchParams.get('sort')
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.min(24, Math.max(1, Number(url.searchParams.get('pageSize')) || 12))
    const searchFiltered = nfts.filter((nft) => {
      const matchesSearch = `${nft.name} ${nft.collection} ${nft.creator}`
        .toLowerCase()
        .includes(search)

      return matchesSearch
    })
    const minWei = minPrice ? ethToWei(minPrice) : undefined
    const maxWei = maxPrice ? ethToWei(maxPrice) : undefined
    const filtered = category
      ? searchFiltered.filter((nft) => nft.category.toLowerCase() === category)
      : searchFiltered
    const networkFiltered = network
      ? filtered.filter((nft) => nft.network.toLowerCase() === network)
      : filtered
    const priceFiltered = networkFiltered.filter((nft) => {
      const price = ethToWei(nft.priceEth)
      return (minWei === undefined || price >= minWei) &&
        (maxWei === undefined || price <= maxWei)
    })
    const sorted = [...priceFiltered]
    if (sort === 'recent') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sort === 'popular') sorted.sort((a, b) => b.sales - a.sales)
    const byPrice = [...nfts].sort((a, b) => {
      const left = ethToWei(a.priceEth)
      const right = ethToWei(b.priceEth)
      return left < right ? -1 : left > right ? 1 : 0
    })
    const body: NFTListResponse = {
      items: sorted.slice((page - 1) * pageSize, page * pageSize),
      total: sorted.length,
      page,
      pageSize,
      categoryCounts,
      networkCounts,
      priceRange: {
        minEth: byPrice[0]?.priceEth ?? '0',
        maxEth: byPrice.at(-1)?.priceEth ?? '0',
      },
    }

    return HttpResponse.json(body)
  }),
]
