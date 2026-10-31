export const SCENARIOS = ['normal', 'empty', 'latency', 'out-of-order', 'offline', 'timeout', 'server-error', 'validation-error', 'session-expired', 'signup-conflict'] as const
export type Scenario = typeof SCENARIOS[number]
export type ScenarioConfig = { scenario: Scenario; pathPrefix: string; method: 'ALL' | 'GET' | 'POST' | 'PUT' | 'DELETE'; seed: number; delayMs: number; failureRate: number; once: boolean }
export type ScenarioState = { config: ScenarioConfig; counter: number; consumed: boolean }
export const DEFAULT_SCENARIO: ScenarioConfig = { scenario: 'normal', pathPrefix: '/api/nfts', method: 'GET', seed: 42, delayMs: 600, failureRate: 1, once: false }
