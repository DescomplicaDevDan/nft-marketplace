import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthProvider'

export const blankWallet = { displayName: '', alias: '', network: '', profileName: '', address: '', secondaryAddress: '', type: '', referral: '', email: '', ens: '' }
export type Wallet = typeof blankWallet
export type SavedWallets = { primary: Wallet | null; secondary: Wallet | null; same: boolean }

export function useWallets() {
  const { user } = useAuth()
  return useQuery({ queryKey: ['wallets', user?.id], enabled: !!user, queryFn: async ({ signal }) => (await api.get<SavedWallets>('/wallets', { signal })).data, retry: 1 })
}

export async function saveWallets(value: SavedWallets) {
  return (await api.put<SavedWallets>('/wallets', value)).data
}

export async function deleteWallet(slot: 'primary' | 'secondary') {
  return (await api.delete<SavedWallets>(`/wallets/${slot}`)).data
}
