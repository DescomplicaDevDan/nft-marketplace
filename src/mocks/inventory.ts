import { nfts } from './data/nfts'
import { readCommerce, type CommerceDatabase } from './commerceStore'

export function inventoryNFTs(state: CommerceDatabase = readCommerce()) {
  const reserved = new Map<string, number>()
  for (const record of Object.values(state.orders)) {
    if (record.order.status === 'rejected') continue
    for (const item of record.order.items) reserved.set(item.id, (reserved.get(item.id) ?? 0) + item.quantity)
  }
  return nfts.map((nft) => ({ ...nft, available: Math.max(0, nft.available - (reserved.get(nft.id) ?? 0)) }))
}
