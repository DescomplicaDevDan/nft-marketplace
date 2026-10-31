import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthProvider'

export type WalletConnection = { id: string; address: string; network: string; provider: string; connectedAt: string }
export type ConnectWallet = { slot?: 'primary' | 'secondary'; address: string; network: string; provider: string; outcome: 'accept' | 'reject' }
type ConnectionResponse = { connection: WalletConnection | null }

export function useWalletConnection() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const locked = useRef(false)
  const [message, setMessage] = useState<{ userId: string; text: string } | null>(null)
  const query = useQuery({
    queryKey: ['walletConnection', user?.id],
    enabled: !!user,
    queryFn: async ({ signal }) => (await api.get<ConnectionResponse>('/wallet-connection', { signal })).data,
    retry: 1,
  })
  const mutation = useMutation({
    mutationFn: async (input: { userId: string; token: string; connection: ConnectWallet | null }) => {
      const config = { headers: { Authorization: `Bearer ${input.token}` } }
      return input.connection
        ? (await api.post<ConnectionResponse>('/wallet-connection', input.connection, config)).data
        : (await api.delete<ConnectionResponse>('/wallet-connection', config)).data
    },
    retry: false,
    onMutate: async (input) => { await queryClient.cancelQueries({ queryKey: ['walletConnection', input.userId] }) },
    onSuccess: (data, input) => {
      queryClient.setQueryData(['walletConnection', input.userId], data)
      setMessage({ userId: input.userId, text: data.connection ? 'Carteira conectada.' : 'Carteira desconectada.' })
    },
    onError: (error, input) => {
      if (isAxiosError<{ code: string }>(error) && error.response?.data?.code === 'wallet_rejected') queryClient.setQueryData(['walletConnection', input.userId], { connection: null })
      setMessage({ userId: input.userId, text: isAxiosError<{ message: string }>(error) ? error.response?.data?.message ?? 'Não foi possível acessar a carteira. Tente novamente.' : 'Não foi possível acessar a carteira.' })
    },
    onSettled: () => { locked.current = false },
  })

  function change(connection: ConnectWallet | null) {
    if (!user || locked.current) return
    locked.current = true
    setMessage(null)
    mutation.mutate({ connection, userId: user.id, token: localStorage.getItem('kurio-session-token') ?? '' })
  }

  return {
    connection: query.isError ? null : query.data?.connection ?? null,
    busy: query.isPending || query.isFetching || mutation.isPending,
    error: query.isError,
    message: message?.userId === user?.id ? message?.text : '',
    connect: (input: ConnectWallet) => change(input),
    disconnect: () => change(null),
    retry: () => { void query.refetch() },
  }
}
