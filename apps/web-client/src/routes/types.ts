import type { ComponentType, ReactNode } from 'react'

export interface RouteConfig {
    path: string
    component: ComponentType
    title: string
    description?: string
    icon?: ReactNode
    requiresAuth?: boolean
    requiredPermissions?: string[]
    layout?: ComponentType<{ children: ReactNode }>
    meta?: Record<string, unknown>
}

export interface RouteGroup {
    name: string
    routes: RouteConfig[]
    icon?: ReactNode
    description?: string
}

export interface NavigationItem {
    label: string
    path: string
    icon?: ReactNode
    badge?: string | number
    children?: NavigationItem[]
    external?: boolean
    requiresAuth?: boolean
}

export interface BreadcrumbItem {
    label: string
    path?: string
    icon?: ReactNode
}

export interface RouterContextType {
    currentRoute?: RouteConfig
    breadcrumbs: BreadcrumbItem[]
    navigationItems: NavigationItem[]
    isAuthenticated: boolean
    userPermissions: string[]
}
