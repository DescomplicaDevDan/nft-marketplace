import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthProvider'
import { api } from '@/lib/api'

export type CollectorProfile = {
  displayName: string
  username: string
  email: string
  walletAlias: string
  ens: string
  avatar: string
}

export type ProfileUpdate = {
  profile: CollectorProfile
  currentPassword?: string
  newPassword?: string
}

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async ({ signal }) => (await api.get<CollectorProfile>('/profile', { signal })).data,
    retry: 1,
  })
}

export async function updateProfile(input: ProfileUpdate) {
  return (await api.put<CollectorProfile>('/profile', input)).data
}
