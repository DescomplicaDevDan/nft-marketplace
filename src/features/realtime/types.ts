import type { NFT } from '@/features/catalog/types'
import type { Order } from '@/features/commerce/orderTypes'

type Envelope<T> = { id: string; resourceId: string; version: number; payload: T }
export type NFTUpdated = Envelope<NFT>
export type OrderUpdated = Envelope<Order> & { userId: string }
export type RealtimeEvent = { type: 'nft.updated'; data: NFTUpdated } | { type: 'order.updated'; data: OrderUpdated }
