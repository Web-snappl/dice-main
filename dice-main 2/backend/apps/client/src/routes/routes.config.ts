import { Home, CheckSquare, Users, Settings, BarChart3, FileText } from 'lucide-react'
import type { RouteConfig, RouteGroup, NavigationItem } from './types'

import HomePage from '@pages/home/Home'
import NavbarMobile from '@pages/home/NavMenuMobile'
import SignIn from '@pages/auth/SignIn'
import SignUp from '@pages/auth/SignUp'
import ForgotPassword from '@pages/auth/ForgotPassword'
import Auth2FA from '@pages/auth2fa/Auth2FA'
import MobileNavbar from '@pages/mobile-navbar/MobileNavbar'

export const icons = {
    Home,
    CheckSquare,
    Users,
    Settings,
    BarChart3,
    FileText
}

export const routes: RouteConfig[] = [
    {
        path: '/',
        component: HomePage,
        title: 'Home',
        description: 'Página de home',
        requiresAuth: false,
    },
    {
        path: '/navmobi',
        component: NavbarMobile,
        title: 'navmobi',
        description: 'Página de homepage links',
        requiresAuth: false,
    },
    {
        path: '/mobile-navbar',
        component: MobileNavbar,
        title: 'navmobi',
        description: 'Página de mobinavbar',
        requiresAuth: false,
    },
    {
        path: '/signin',
        component: SignIn,
        title: 'Sign In',
        description: 'Página de autenticación',
        requiresAuth: false,
    },
    {
        path: '/signup',
        component: SignUp,
        title: 'Sign In',
        description: 'Página de autenticación',
        requiresAuth: false,
    },
    {
        path: '/auth2fa',
        component: Auth2FA,
        title: 'about',
        description: 'Página de Profitability',
        requiresAuth: false,
    },
    {
        path: '/forgotPassword',
        component: ForgotPassword,
        title: 'about',
        description: 'Página de forhot password',
        requiresAuth: false,
    },
]


export const routeGroups: RouteGroup[] = [
    {
        name: 'Principal',
        description: 'Páginas principales de la aplicación',
        routes: routes.filter(route => ['/', '/tasks'].includes(route.path))
    }
]


export const navigationItems: NavigationItem[] = [
    {
        label: 'Dashboard',
        path: '/',
        requiresAuth: false
    },
    {
        label: 'Tareas',
        path: '/tasks',
        requiresAuth: false
    }
]
export const publicRoutes = [
    '/',
    '/tasks'
]

export const protectedRoutes: string[] = []

export const routePermissions: Record<string, string[]> = {
    // '/admin': ['admin'],
    // '/users': ['user_management']
}

export const findRouteByPath = (path: string): RouteConfig | undefined => {
    return routes.find(route => route.path === path)
}

export const getBreadcrumbs = (path: string) => {
    const route = findRouteByPath(path)
    if (!route) return []

    const breadcrumbs = [
        { label: 'Inicio', path: '/' }
    ]

    if (path !== '/') {
        breadcrumbs.push({
            label: route.title,
            path: route.path
        })
    }

    return breadcrumbs
}

export const isPublicRoute = (path: string): boolean => {
    return publicRoutes.includes(path)
}

export const hasRoutePermission = (path: string, userPermissions: string[]): boolean => {
    const requiredPermissions = routePermissions[path]
    if (!requiredPermissions) return true

    return requiredPermissions.some(permission => userPermissions.includes(permission))
}
