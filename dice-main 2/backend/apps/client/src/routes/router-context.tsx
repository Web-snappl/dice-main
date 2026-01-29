import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import type { RouterContextType, BreadcrumbItem } from './types'
import { findRouteByPath, getBreadcrumbs, navigationItems } from './routes.config'

interface RouterProviderProps {
    children: ReactNode
    isAuthenticated?: boolean
    userPermissions?: string[]
}

const RouterContext = createContext<RouterContextType | undefined>(undefined)

export function RouterProvider({
    children,
    isAuthenticated = false,
    userPermissions = []
}: RouterProviderProps) {
    const location = useLocation()

    const contextValue = useMemo((): RouterContextType => {
        const currentRoute = findRouteByPath(location.pathname)
        const breadcrumbs = getBreadcrumbs(location.pathname) ?? []

        return {
            currentRoute,
            breadcrumbs,
            navigationItems,
            isAuthenticated,
            userPermissions
        }
    }, [location.pathname, isAuthenticated, userPermissions])

    return (
        <RouterContext.Provider value={contextValue}>
            {children}
        </RouterContext.Provider>
    )
}

export function useRouter(): RouterContextType {
    const context = useContext(RouterContext)
    if (context === undefined) {
        throw new Error('useRouter must be used within a RouterProvider')
    }
    return context
}

// Hook para obtener información de la ruta actual
export function useCurrentRoute() {
    const { currentRoute } = useRouter()
    return currentRoute
}

// Hook para obtener breadcrumbs
export function useBreadcrumbs(): BreadcrumbItem[] {
    const { breadcrumbs } = useRouter()
    return breadcrumbs
}

// Hook para obtener items de navegación
export function useNavigation() {
    const { navigationItems, isAuthenticated } = useRouter()

    return useMemo(() => {
        return navigationItems.filter(item => {
            if (item.requiresAuth && !isAuthenticated) {
                return false
            }
            return true
        })
    }, [navigationItems, isAuthenticated])
}
