import { nfts } from './data/nfts'
import { readCommerce, type CommerceDatabase } from './commerceStore'

export function inventoryNFTs(state: CommerceDatabase = readCommerce()) {
  const reserved = new Map<string, number>()
  for (const record of Object.values(state.orders)) {
    if (record.order.status === 'rejected') continue
    for (const item of record.order.items) {
      const nft = nfts.find((candidate) => candidate.id === item.id)
      const editionId = item.editionId ?? nft?.editions?.find((edition) => edition.label === nft.editionLabel)?.id ?? nft?.editions?.find((edition) => edition.label === '1/50')?.id ?? ''
      const key = `${item.id}:${editionId}`
      reserved.set(key, (reserved.get(key) ?? 0) + item.quantity)
    }
  }
  return nfts.map((nft) => {
    const inventory = state.inventory[nft.id]
    const totalSupply = inventory?.supply ?? nft.available
    const editionSupply = nft.editions?.map((edition) => Math.floor(totalSupply * edition.available / Math.max(1, nft.available))) ?? []
    let remainder = totalSupply - editionSupply.reduce((sum, supply) => sum + supply, 0)
    for (let index = 0; remainder > 0 && editionSupply.length; index = (index + 1) % editionSupply.length) { editionSupply[index]++; remainder-- }
    const editions = nft.editions?.map((edition, index) => {
      const override = inventory?.editions?.[edition.id]
      const supply = override?.supply ?? editionSupply[index] ?? edition.available
      return { ...edition, priceEth: override?.priceEth ?? edition.priceEth, available: Math.max(0, supply - (reserved.get(`${nft.id}:${edition.id}`) ?? 0)) }
    })
    return { ...nft, priceEth: inventory?.priceEth ?? nft.priceEth, version: inventory?.version ?? 1, editions, available: editions?.reduce((sum, edition) => sum + edition.available, 0) ?? Math.max(0, totalSupply - (reserved.get(`${nft.id}:`) ?? 0)) }
  })
}
