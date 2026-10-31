import { WebSocketExtension, type WebSocketData } from 'msw/ws'

// Text events in the default Socket.IO namespace, over Engine.IO v4/WebSocket.
// Control frames stay inside the network binding; application handlers use event tuples.
export class SocketIoExtension extends WebSocketExtension<[string, ...unknown[]]> {
  encode(message: [string, ...unknown[]]) { return `42${JSON.stringify(message)}` }
  decode(frame: WebSocketData) {
    if (typeof frame !== 'string' || !frame.startsWith('42[')) return
    try { return JSON.parse(frame.slice(2)) as [string, ...unknown[]] } catch { return }
  }
  connect() {
    return `0${JSON.stringify({ sid: crypto.randomUUID(), upgrades: [], pingInterval: 2000000000, pingTimeout: 100000000, maxPayload: 1000000 })}`
  }
  receive(frame: WebSocketData) {
    if (typeof frame !== 'string') return
    if (frame.startsWith('40')) return `40${JSON.stringify({ sid: crypto.randomUUID() })}`
    if (frame === '2') return '3'
  }
}
