import type { CartQuote } from './quoteTypes'

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'
export type Order = {
  id: string
  status: OrderStatus
  version: number
  createdAt: string
  quoteId: string
  items: Array<{ id: string; lineId: string; editionId: string; editionLabel: string; name: string; collection: string; imageUrl: string; quantity: number; unitPriceEth: string; priceEth: string }>
  wallet: string
  walletAddress: string
  network: string
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon: string | null
  transactionHash?: string
  reason?: string
}

export type CreateOrder = {
  quoteId: string
  connectionId: string
  wallet: { address: string; network: string; provider: string }
  collector: { displayName: string; username: string; email: string; profileName: string; referral: string; ens: string; notes: string }
  scenario: 'confirmed' | 'rejected' | 'timeout'
}

export type OrderFailure = { message: string; code?: string; quote?: CartQuote; orderId?: string }
