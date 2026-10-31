import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import {
  NFT_CATEGORIES,
  NFT_NETWORKS,
  type NFTSort,
} from './features/catalog/types'
import App from './App'

const rootRoute = createRootRoute({
  component: Outlet,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => {
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
  },
  component: App,
})

const routeTree = rootRoute.addChildren([homeRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
