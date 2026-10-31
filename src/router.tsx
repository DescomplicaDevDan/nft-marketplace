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
import NFTDetailPage from './features/catalog/NFTDetailPage'
import { CartPage, FavoritesPage } from './features/commerce/SavedItemsPage'
import { CheckoutPage, OrderConfirmationPage, OrdersPage } from './features/commerce/CheckoutPages'

function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const sort: NFTSort | undefined =
    search.sort === 'recent'
      ? 'recent'
      : search.sort === 'popular'
        ? 'popular'
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
  component: FavoritesPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  validateSearch: validateCatalogSearch,
  component: CheckoutPage,
})

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  validateSearch: validateCatalogSearch,
  component: OrdersPage,
})

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  validateSearch: validateCatalogSearch,
  component: OrderConfirmationPage,
})

const routeTree = rootRoute.addChildren([
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
