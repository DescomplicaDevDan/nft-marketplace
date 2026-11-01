import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { lazy, Suspense, type ComponentType } from 'react'
import {
  NFT_CATEGORIES,
  NFT_NETWORKS,
  type CatalogSearch,
  type NFTSort,
} from './features/catalog/types'
import { RequireAuthentication } from './features/auth/AuthProvider'
import { queryClient } from './lib/queryClient'
import { getSession } from './features/auth/api'

const App = lazy(() => import('./App'))
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'))
const WalletsPage = lazy(() => import('./features/profile/WalletsPage'))
const NFTDetailPage = lazy(() => import('./features/catalog/NFTDetailPage'))
const CartPage = lazy(() => import('./features/commerce/SavedItemsPage').then((module) => ({ default: module.CartPage })))
const FavoritesPage = lazy(() => import('./features/commerce/SavedItemsPage').then((module) => ({ default: module.FavoritesPage })))
const CheckoutPage = lazy(() => import('./features/commerce/CheckoutPages').then((module) => ({ default: module.CheckoutPage })))
const OrderConfirmationPage = lazy(() => import('./features/commerce/CheckoutPages').then((module) => ({ default: module.OrderConfirmationPage })))
const OrdersPage = lazy(() => import('./features/commerce/CheckoutPages').then((module) => ({ default: module.OrdersPage })))
const SimulatedExplorer = lazy(() => import('./features/commerce/OrderConfirmation').then((module) => ({ default: module.SimulatedExplorer })))
const DemoPage = lazy(() => import('./features/demo/DemoPage'))

function lazyRoute(Component: ComponentType) {
  return function LazyRoute() {
    return <Suspense fallback={<main className="grid min-h-[40vh] place-items-center bg-[#140d0a] text-[#cfb28c]" role="status">Carregando tela…</main>}><Component /></Suspense>
  }
}

const HomeRoute = lazyRoute(App)
const ProfileRoute = lazyRoute(ProfilePage)
const WalletsRoute = lazyRoute(WalletsPage)
const NFTDetailRoute = lazyRoute(NFTDetailPage)
const CartScreenRoute = lazyRoute(CartPage)
const FavoritesScreenRoute = lazyRoute(FavoritesPage)
const CheckoutScreenRoute = lazyRoute(CheckoutPage)
const OrderScreenRoute = lazyRoute(OrderConfirmationPage)
const OrdersScreenRoute = lazyRoute(OrdersPage)
const ExplorerScreenRoute = lazyRoute(SimulatedExplorer)
const DemoScreenRoute = lazyRoute(DemoPage)

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
  beforeLoad: async ({ location }) => {
    if (location.pathname === '/demo') return
    // Validate navigation against the mock API; a network failure does not log the user out.
    try { await queryClient.fetchQuery({ queryKey: ['session'], queryFn: getSession, staleTime: 0, retry: false }) } catch { /* Private requests remain guarded by the server during an outage. */ }
  },
  component: Outlet,
  notFoundComponent: () => <main className="grid min-h-screen place-content-center gap-4 bg-[#140d0a] p-8 text-center text-[#f5f1eb]"><h1 className="text-2xl font-bold">Página não encontrada</h1><p>O endereço solicitado não existe.</p><a className="text-[#e89b55] underline" href="/">Voltar ao início</a></main>,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  component: HomeRoute,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  validateSearch: validateCatalogSearch,
  component: NFTDetailRoute,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  validateSearch: validateCatalogSearch,
  component: CartScreenRoute,
})

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favorites',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><FavoritesScreenRoute /></RequireAuthentication>,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><CheckoutScreenRoute /></RequireAuthentication>,
})

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><OrdersScreenRoute /></RequireAuthentication>,
})

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><OrderScreenRoute /></RequireAuthentication>,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  validateSearch: validateCatalogSearch,
  component: () => <RequireAuthentication><ProfileRoute /></RequireAuthentication>,
})

const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute: () => rootRoute, path: '/demo', validateSearch: validateCatalogSearch, component: DemoScreenRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: '/explorer/$orderId', validateSearch: validateCatalogSearch, component: () => <RequireAuthentication><ExplorerScreenRoute /></RequireAuthentication> }),
  createRoute({ getParentRoute: () => rootRoute, path: '/wallets', validateSearch: validateCatalogSearch, component: () => <RequireAuthentication><WalletsRoute /></RequireAuthentication> }),
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
