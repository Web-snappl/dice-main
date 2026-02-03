import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Wallet,
    LogOut,
    Menu,
    X,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserLayout() {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
            {/* Mobile sidebar backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-neutral-200 dark:border-neutral-800">
                        <span className="text-xl font-bold text-red-600">
                            Dice World
                        </span>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-500">
                                <User size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate dark:text-white">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-neutral-500 truncate">
                                    {user?.email || user?.phoneNumber}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                                            ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'}
                  `}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-neutral-600 hover:text-red-600 hover:bg-red-50 dark:text-neutral-400 dark:hover:bg-red-900/10 dark:hover:text-red-400"
                            onClick={logout}
                        >
                            <LogOut size={18} className="mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-4 justify-between">
                    <span className="text-lg font-bold">Dice World</span>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </Button>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
