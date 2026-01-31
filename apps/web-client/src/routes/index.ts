// Exportar tipos principales
export type {
    RouteConfig,
    RouteGroup,
    NavigationItem,
    BreadcrumbItem,
    RouterContextType
} from './types'

// Exportar configuración de rutas
export {
    routes,
    routeGroups,
    navigationItems,
    publicRoutes,
    protectedRoutes,
    routePermissions,
    findRouteByPath,
    getBreadcrumbs,
    isPublicRoute,
    hasRoutePermission
} from './routes.config'

// Exportar componentes del router
export { AppRouter } from './router'
export { RouterProvider, useRouter, useCurrentRoute, useBreadcrumbs, useNavigation } from './router-context'
