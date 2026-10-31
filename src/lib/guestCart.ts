export function guestCartId() {
  const key = 'kurio-guest-cart-id'
  const stored = localStorage.getItem(key)
  if (stored && /^[a-z0-9-]{16,80}$/i.test(stored)) return stored
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}
