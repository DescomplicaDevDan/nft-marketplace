import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { SCENARIOS, type Scenario, type ScenarioConfig, type ScenarioState } from './types'

const labels: Record<Scenario, string> = { normal: 'Funcionamento normal', empty: 'Catálogo vazio', latency: 'Latência variável', 'out-of-order': 'Respostas fora de ordem', offline: 'Falha de rede', timeout: 'Timeout de requisição', 'server-error': 'Erro temporário 503', 'validation-error': 'Erro de validação 400', 'session-expired': 'Sessão expirada 401', 'signup-conflict': 'Conflito de cadastro 409' }
const enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true'

export default function DemoPage() {
  const query = useQuery({ queryKey: ['demo'], enabled, queryFn: async () => (await api.get<ScenarioState>('/demo/scenario')).data, retry: false })
  if (!enabled) return <main className="auth-route-message">Painel disponível apenas no ambiente de demonstração.</main>
  if (query.isPending) return <main className="auth-route-message" role="status">Carregando configuração…</main>
  if (query.isError) return <main className="auth-route-message"><p role="alert">Não foi possível carregar o painel.</p><Button onClick={() => { void query.refetch() }}>Tentar novamente</Button></main>
  return <DemoEditor initial={query.data} />
}

function DemoEditor({ initial }: { initial: ScenarioState }) {
  const queryClient = useQueryClient()
  const [config, setConfig] = useState(initial.config)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const mutation = useMutation({ mutationFn: async (input: { reset: boolean; config?: ScenarioConfig }) => input.reset ? (await api.post<ScenarioState>('/demo/reset', {})).data : (await api.put<ScenarioState>('/demo/scenario', input.config)).data, retry: false })
  function scenario(value: Scenario) {
    setConfig((current) => ({ ...current, scenario: value,
      pathPrefix: value === 'signup-conflict' ? '/api/auth/signup' : value === 'session-expired' ? '/api/' : value === 'validation-error' ? '/api/profile' : '/api/nfts',
      method: value === 'signup-conflict' ? 'POST' : value === 'validation-error' ? 'PUT' : value === 'session-expired' ? 'ALL' : 'GET',
      once: value === 'session-expired',
    }))
  }
  async function apply(event?: FormEvent<HTMLFormElement>, reset = false) {
    event?.preventDefault()
    if (mutation.isPending) return
    setMessage('')
    setFailed(false)
    try {
      const state = await mutation.mutateAsync({ reset, config })
      if (reset) { window.location.assign('/demo'); return }
      queryClient.setQueryData(['demo'], state)
      setMessage('Cenário aplicado. Abra a tela correspondente para reproduzi-lo. Os dados existentes foram mantidos.')
    } catch (error) {
      setFailed(true)
      setMessage(isAxiosError<{ message: string }>(error) ? error.response?.data?.message ?? 'Não foi possível aplicar a configuração.' : 'Não foi possível aplicar a configuração.')
    }
  }
  const inputClass = 'mt-2 block w-full rounded border border-[#49372b] bg-[#140d0a] p-2 text-[#f5f1eb]'
  return <main className="mx-auto max-w-4xl px-5 py-10 font-mono text-[#f5f1eb]">
    <a href="/" className="text-[#d28a4c] underline">Voltar ao marketplace</a>
    <h1 className="mt-6 text-2xl font-bold">Ambiente de demonstração</h1>
    <p className="mt-3 text-sm text-[#cfb28c]">Configure falhas reproduzíveis da API simulada. O painel permanece acessível mesmo durante falhas de rede simuladas.</p>
    <form onSubmit={(event) => { void apply(event) }} className="mt-8 rounded border border-[#49372b] bg-[#241612] p-5">
      <fieldset disabled={mutation.isPending} className="grid min-w-0 grid-cols-1 gap-5 border-0 p-0 sm:grid-cols-2">
        <label>Cenário<select aria-label="Cenário" className={inputClass} value={config.scenario} onChange={(event) => scenario(event.target.value as Scenario)}>{SCENARIOS.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
        <label>Caminho da API<input className={inputClass} value={config.pathPrefix} onChange={(event) => setConfig({ ...config, pathPrefix: event.target.value })} placeholder="/api/nfts" required /></label>
        <label>Método<select aria-label="Método" className={inputClass} value={config.method} onChange={(event) => setConfig({ ...config, method: event.target.value as ScenarioConfig['method'] })}>{['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((method) => <option key={method}>{method}</option>)}</select></label>
        <label>Seed da sequência<input className={inputClass} type="number" min={0} max={4294967295} step={1} value={config.seed} onChange={(event) => setConfig({ ...config, seed: Number(event.target.value) })} required /></label>
        <label>Atraso base em milissegundos<input className={inputClass} type="number" min={0} max={15000} step={1} value={config.delayMs} onChange={(event) => setConfig({ ...config, delayMs: Number(event.target.value) })} required /></label>
        <label>Probabilidade (0 a 1)<input className={inputClass} type="number" min={0} max={1} step="0.01" value={config.failureRate} onChange={(event) => setConfig({ ...config, failureRate: Number(event.target.value) })} required /></label>
        <label className="flex items-center gap-3"><input type="checkbox" checked={config.once} onChange={(event) => setConfig({ ...config, once: event.target.checked })} />Executar apenas uma vez</label>
        <Button className="bg-[#d28a4c] text-[#140d0a]" type="submit">{mutation.isPending ? 'Aplicando…' : 'Aplicar cenário'}</Button>
      </fieldset>
      <p className="mt-5 text-xs text-[#cfb28c]">Reaplicar reinicia a sequência da mesma seed. Para observar erro persistente mesmo após tentativas automáticas, desmarque “Executar apenas uma vez”. Em respostas fora de ordem, faça duas buscas rápidas no catálogo.</p>
    </form>
    {message && <p className="mt-4" role={failed ? 'alert' : 'status'}>{message}</p>}
    <section className="mt-8 border-t border-[#49372b] pt-6"><h2 className="font-bold">Restaurar dados iniciais</h2><p className="my-4 text-sm text-[#cfb28c]">Restaura as duas contas de demonstração e remove cadastros, carrinhos, pedidos, carteiras, favoritos e alterações de estoque/preço simulados. Encerra a sessão e volta ao cenário normal. Recarregue também outras abas abertas.</p><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => { void apply(undefined, true) }}>Restaurar dados iniciais</Button></section>
  </main>
}
