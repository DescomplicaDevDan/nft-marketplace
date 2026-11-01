import { useCommerce } from '@/features/commerce/CommerceProvider'

export default function CartCountBadge() {
  const { cartItems } = useCommerce()
  const count = cartItems.reduce((total, item) => total + item.quantity, 0)
  if (count === 0) return null
  return <span className="cart-count-badge" aria-label={`${count} NFTs no carrinho`}>{count}</span>
}
