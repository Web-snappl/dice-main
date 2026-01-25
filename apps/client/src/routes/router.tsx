import { Routes, Route, Navigate } from 'react-router'
import { Suspense } from 'react'
import { RouterProvider } from './router-context'
import { routes, hasRoutePermission } from './routes.config'
import type { RouteConfig } from './types'

interface AppRouterProps {
    isAuthenticated?: boolean
    userPermissions?: string[]
    fallbackComponent?: React.ComponentType
    loadingComponent?: React.ComponentType
}

// Componente de carga por defecto
const DefaultLoadingComponent = () => (
    <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
)

// Componente de ruta no autorizada
const UnauthorizedComponent = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Acceso no autorizado</h2>
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página</p>
    </div>
)

// Wrapper para rutas protegidas
interface ProtectedRouteProps {
    route: RouteConfig
    isAuthenticated: boolean
    userPermissions: string[]
    children: React.ReactNode
}

function ProtectedRoute({ route, isAuthenticated, userPermissions, children }: ProtectedRouteProps) {
    // Verificar autenticación
    if (route.requiresAuth && !isAuthenticated) {
        return <Navigate to="/" />
    }

    // Verificar permisos específicos
    if (route.requiredPermissions && route.requiredPermissions.length > 0) {
        const hasPermission = route.requiredPermissions.some(permission =>
            userPermissions.includes(permission)
        )
        if (!hasPermission) {
            return <UnauthorizedComponent />
        }
    }

    // Verificar permisos globales de ruta
    if (!hasRoutePermission(route.path, userPermissions)) {
        return <UnauthorizedComponent />
    }

    return <>{children}</>
}

// Componente principal del router
export function AppRouter({
    isAuthenticated = false,
    userPermissions = [],
    loadingComponent: LoadingComponent = DefaultLoadingComponent
}: AppRouterProps) {
    return (
        <RouterProvider isAuthenticated={isAuthenticated} userPermissions={userPermissions}>
            <Suspense fallback={<LoadingComponent />}>
                <Routes>
                    {routes.map((route) => {
                        const Component = route.component
                        const Layout = route.layout

                        return (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={
                                    <ProtectedRoute
                                        route={route}
                                        isAuthenticated={isAuthenticated}
                                        userPermissions={userPermissions}
                                    >
                                        {Layout ? (
                                            <Layout>
                                                <Component />
                                            </Layout>
                                        ) : (
                                            <Component />
                                        )}
                                    </ProtectedRoute>
                                }
                            />
                        )
                    })}

                    {/* Ruta 404 */}
                    <Route
                        path="*"
                        element={
                            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                                <h2 className="text-2xl font-bold">  Página no encontrada  </h2>
                                <p className="text-muted-foreground">  La página que buscas no existe  </p>
                                <Navigate to="/" replace />
                            </div>
                        }
                    />
                </Routes>
            </Suspense>
        </RouterProvider>
    )
}

export default AppRouter
