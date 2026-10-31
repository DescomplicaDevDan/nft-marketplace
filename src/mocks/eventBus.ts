import type { RealtimeEvent } from '@/features/realtime/types'
import type { CommerceDatabase } from './commerceStore'
import { inventoryNFTs } from './inventory'

const listeners = new Set<(event: RealtimeEvent) => void>()
export function listenEvents(listener: (event: RealtimeEvent) => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function publish(event: RealtimeEvent) { for (const listener of listeners) listener(event) }

export function bumpInventory(state: CommerceDatabase, ids: string[]) {
  for (const id of new Set(ids)) state.inventory[id] = { ...state.inventory[id], version: (state.inventory[id]?.version ?? 1) + 1 }
}

export function publishInventory(state: CommerceDatabase, ids: string[]) {
  const inventory = inventoryNFTs(state)
  for (const id of new Set(ids)) {
    const nft = inventory.find((item) => item.id === id)
    if (nft) publish({ type: 'nft.updated', data: { id: `nft:${id}:${nft.version}`, resourceId: id, version: nft.version, payload: nft } })
  }
}
