import { Home, CheckSquare, Users, Settings, BarChart3, FileText } from 'lucide-react'
import type { ReactNode } from 'react'

// Mapa de iconos disponibles
export const iconMap = {
    Home,
    CheckSquare,
    Users,
    Settings,
    BarChart3,
    FileText
} as const

export type IconName = keyof typeof iconMap

// Helper para renderizar iconos dinámicamente
export const renderIcon = (iconName: IconName, size: number = 20): ReactNode => {
    const IconComponent = iconMap[iconName]
    return IconComponent ? <IconComponent size={size} /> : null
}

// Helper para obtener el icono de una ruta basado en meta.iconName
export const getRouteIcon = (route: { meta?: { iconName?: string } }, size: number = 20): ReactNode => {
    const iconName = route?.meta?.iconName as IconName
    return iconName ? renderIcon(iconName, size) : null
}
