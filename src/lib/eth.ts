const WEI_PER_ETH = 10n ** 18n

export function ethToWei(value: string): bigint {
  if (!/^\d+(?:\.\d{1,18})?$/.test(value)) throw new Error('Valor ETH inválido')
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(18, '0'))
}

export function weiToEth(value: bigint): string {
  const fraction = String(value % WEI_PER_ETH).padStart(18, '0').replace(/0+$/, '').padEnd(2, '0')
  return `${value / WEI_PER_ETH}.${fraction}`
}
