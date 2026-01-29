import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Users,
    Flag,
    Gamepad2,
    Trophy,
    Calendar,
    Gift,
    DollarSign,
    FileText,
    Settings,
    Dice5,
    X,
    // Megaphone,
    // LifeBuoy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
    { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { path: '/users', icon: Users, labelKey: 'nav.users' },
    // { path: '/communication', icon: Megaphone, labelKey: 'Communication', adminOnly: true }, // Out of scope - Hidden
    // { path: '/support', icon: LifeBuoy, labelKey: 'Support' }, // Out of scope - Hidden
    { path: '/reports', icon: Flag, labelKey: 'nav.reports' },
    { path: '/games', icon: Gamepad2, labelKey: 'nav.games' },
    { path: '/scores', icon: Trophy, labelKey: 'nav.scores' },
    { path: '/tournaments', icon: Calendar, labelKey: 'nav.tournaments' },
    { path: '/rewards', icon: Gift, labelKey: 'nav.rewards' },
    { path: '/financial', icon: DollarSign, labelKey: 'nav.financial', adminOnly: true },
    { path: '/audit-log', icon: FileText, labelKey: 'nav.auditLog', adminOnly: true },
    { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-dark-700 z-50 
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-dark-700">
                    <div className="flex items-center">
                        <Dice5 className="w-8 h-8 text-primary-500 mr-3" />
                        <span className="text-xl font-bold text-white">
                            Dice-world
                        </span>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="md:hidden text-dark-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
                    {visibleItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive
                                    ? 'bg-primary-600/20 text-primary-400 border-l-4 border-primary-500'
                                    : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            <span className="font-medium">{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}
