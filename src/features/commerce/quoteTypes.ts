import type { NFT } from '@/features/catalog/types'

export type CartQuote = {
  id: string
  cartVersion: number
  expiresAt: string
  coupon: string | null
  items: Array<NFT & { lineId: string; editionId: string; quantity: number; lineTotalEth: string }>
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}
