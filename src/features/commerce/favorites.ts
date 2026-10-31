import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthProvider'
import type { NFT } from '@/features/catalog/types'

type Favorites = { ids: string[]; items: NFT[] }

export function useFavoriteCollection() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['favorites', user?.id],
    enabled: !!user,
    queryFn: async ({ signal }) => (await api.get<Favorites>('/favorites', { signal })).data,
    retry: 1,
  })
}

export function useFavoriteActions() {
  const { user, openLogin } = useAuth()
  const queryClient = useQueryClient()
  const collection = useFavoriteCollection()
  const locked = useRef(false)
  const [message, setMessage] = useState('')
  const mutation = useMutation({
    mutationFn: async ({ id, add }: { id: string; add: boolean; userId: string }) => {
      if (add) await api.put(`/favorites/${encodeURIComponent(id)}`)
      else await api.delete(`/favorites/${encodeURIComponent(id)}`)
    },
    retry: false,
    onMutate: async ({ id, add, userId }) => {
      const key = ['favorites', userId]
      setMessage('')
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Favorites>(key)
      queryClient.setQueryData<Favorites>(key, (current) => ({
        ids: add ? [...(current?.ids ?? []), id] : (current?.ids ?? []).filter((item) => item !== id),
        items: (current?.items ?? []).filter((item) => add || item.id !== id),
      }))
      return { previous }
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(['favorites', variables.userId], context?.previous ?? { ids: [], items: [] })
      setMessage('Não foi possível alterar os favoritos. A alteração foi desfeita; tente novamente.')
    },
    onSuccess: (_data, variables) => setMessage(variables.add ? 'NFT salvo nos favoritos.' : 'NFT removido dos favoritos.'),
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['favorites', variables.userId] })
      locked.current = false
    },
  })

  return {
    favorites: user ? collection.data?.ids ?? [] : [],
    message,
    toggleFavorite: (id: string) => {
      if (!user) { openLogin(); return }
      if (locked.current || !collection.isSuccess) return
      locked.current = true
      mutation.mutate({ id, add: !collection.data.ids.includes(id), userId: user.id })
    },
  }
}
