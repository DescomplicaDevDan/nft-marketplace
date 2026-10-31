import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import {
  NFT_CATEGORIES,
  NFT_NETWORKS,
  type CatalogSearch,
  type NFTSort,
} from './features/catalog/types'
import App from './App'
import ProfilePage from './features/profile/ProfilePage'
import WalletsPage from './features/profile/WalletsPage'
import NFTDetailPage from './features/catalog/NFTDetailPage'
import { CartPage, FavoritesPage } from './features/commerce/SavedItemsPage'
import { CheckoutPage, OrderConfirmationPage, OrdersPage } from './features/commerce/CheckoutPages'
import { RequireAuthentication } from './features/auth/AuthProvider'
import { SimulatedExplorer } from './features/commerce/OrderConfirmation'
import { queryClient } from './lib/queryClient'
import { getSession } from './features/auth/api'

function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const sort: NFTSort | undefined =
    search.sort === 'recent'
      ? 'recent'
      : search.sort === 'popular'
        ? 'popular'
        : search.sort === 'price-low'
          ? 'price-low'
          : search.sort === 'price-high'
            ? 'price-high'
        : undefined

  return {
    search: typeof search.search === 'string' ? search.search : '',
    category: NFT_CATEGORIES.find((category) => category === search.category),
    network: NFT_NETWORKS.find((network) => network === search.network),
    minPrice: typeof search.minPrice === 'string' ? search.minPrice : undefined,
    maxPrice: typeof search.maxPrice === 'string' ? search.maxPrice : undefined,
    sort,
    page: Math.max(1, Number(search.page) || 1),
  }
}

const rootRoute = createRootRoute({
  beforeLoad: async () => {
    // Validate navigation against the mock API; a network failure does not log the user out.
    try { await queryClient.fetchQuery({ queryKey: ['session'], queryFn: getSession, staleTime: 0, retry: false }) } catch { /* Private requests remain guarded by the server during an outage. */ }
  },
  component: Outlet,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  component: App,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  validateSearch: validateCatalogSearch,
  component: NFTDetailPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  validateSearch: validateCatalogSearch,
  component: CartPage,
})

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favorites',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><FavoritesPage /></RequireAuthentication>,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><CheckoutPage /></RequireAuthentication>,
})

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><OrdersPage /></RequireAuthentication>,
})

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><OrderConfirmationPage /></RequireAuthentication>,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><ProfilePage /></RequireAuthentication>,
})

const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute: () => rootRoute, path: '/explorer/$orderId', validateSearch: validateCatalogSearch, component: () => <RequireAuthentication><SimulatedExplorer /></RequireAuthentication> }),
  createRoute({ getParentRoute: () => rootRoute, path: '/wallets', validateSearch: validateCatalogSearch, component: () => <RequireAuthentication><WalletsPage /></RequireAuthentication> }),
  profileRoute,
  homeRoute,
  nftDetailRoute,
  cartRoute,
  favoritesRoute,
  checkoutRoute,
  ordersRoute,
  orderConfirmationRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
