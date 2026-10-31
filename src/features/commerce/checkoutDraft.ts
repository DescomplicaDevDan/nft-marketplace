import { blankWallet } from '@/features/profile/walletApi'
import type { CreateOrder } from './orderTypes'

export type CheckoutDraft = {
  collector: typeof blankWallet & { username: string; ensSuffix: string }
  otherWallet: boolean
  source: 'manual' | 'primary' | 'secondary'
  alternativeAddress: string
  outcome: 'accept' | 'reject'
  paymentScenario: CreateOrder['scenario']
  notes: string
}
const initial: CheckoutDraft = { collector: { ...blankWallet, type: 'Coinbase Wallet', username: '', ensSuffix: '.eth' }, otherWallet: false, source: 'manual', alternativeAddress: '', outcome: 'accept', paymentScenario: 'confirmed', notes: '' }
const key = (userId: string) => `kurio-checkout-draft:${userId}`

export function readCheckoutDraft(userId: string): CheckoutDraft {
  try {
    const value = JSON.parse(sessionStorage.getItem(key(userId)) ?? '{}')
    return {
      collector: Object.fromEntries(Object.entries(initial.collector).map(([name, fallback]) => [name, typeof value?.collector?.[name] === 'string' ? value.collector[name] : fallback])) as CheckoutDraft['collector'],
      otherWallet: value?.otherWallet === true,
      source: ['primary', 'secondary'].includes(value?.source) ? value.source : 'manual',
      alternativeAddress: typeof value?.alternativeAddress === 'string' ? value.alternativeAddress : '',
      outcome: value?.outcome === 'reject' ? 'reject' : 'accept',
      paymentScenario: ['rejected', 'timeout'].includes(value?.paymentScenario) ? value.paymentScenario : 'confirmed',
      notes: typeof value?.notes === 'string' ? value.notes.slice(0, 2000) : '',
    }
  } catch { return structuredClone(initial) }
}

export function saveCheckoutDraft(userId: string, draft: CheckoutDraft) {
  try { sessionStorage.setItem(key(userId), JSON.stringify(draft)); return true } catch { return false }
}

export function clearCheckoutDraft(userId: string) {
  sessionStorage.removeItem(key(userId))
}
