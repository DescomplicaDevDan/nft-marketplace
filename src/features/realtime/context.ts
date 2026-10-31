import { createContext, useContext } from 'react'

export const RealtimeContext = createContext({ connected: false, message: '' })
export function useRealtime() { return useContext(RealtimeContext) }
