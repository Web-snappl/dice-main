import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Wallet,
    LogOut,
    Menu,
    X,
    User,
    Download,
    Smartphone,
    Apple,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function UserLayout() {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    ];

    const handleAndroidDownload = () => {
        window.location.href = 'https://github.com/Web-snappl/dice-main/releases/tag/v.1.0.3#:~:text=3-,app%2Drelease.apk,-sha256%3A4bacbd87252a57b6f4ad233786549be4e5e5a1c644a08fc2f0dbda58b39f82cc';
    };

    const handleIOSClick = () => {
        toast.info('iOS version coming soon! Stay tuned.');
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex">
            {/* Mobile sidebar backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-neutral-900 border-r border-red-600/30 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-red-600/30">
                        <span className="text-xl font-bold text-red-500">
                            Dice World
                        </span>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b border-red-600/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-500">
                                <User size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate text-white">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-neutral-400 truncate">
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
                                            ? 'bg-red-900/30 text-red-400 border border-red-600/30'
                                            : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}
                  `}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Download App Section */}
                    <div className="p-4 border-t border-red-600/30">
                        <button
                            onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                        >
                            <span className="flex items-center gap-3">
                                <Download size={18} />
                                Download Dice World
                            </span>
                            {isDownloadOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isDownloadOpen && (
                            <div className="mt-2 ml-6 space-y-1">
                                <button
                                    onClick={handleAndroidDownload}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:bg-red-900/30 hover:text-red-400 transition-colors"
                                >
                                    <Smartphone size={16} />
                                    Android
                                    <span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded">APK</span>
                                </button>
                                <button
                                    onClick={handleIOSClick}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-500 cursor-not-allowed"
                                >
                                    <Apple size={16} />
                                    iOS
                                    <span className="ml-auto text-xs bg-neutral-700 text-neutral-400 px-2 py-0.5 rounded">Soon</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="p-4 border-t border-red-600/30">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-neutral-400 hover:text-red-500 hover:bg-red-900/20"
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
                <header className="lg:hidden h-16 bg-neutral-900 border-b border-red-600/30 flex items-center px-4 justify-between">
                    <span className="text-lg font-bold text-red-500">Dice World</span>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-neutral-800" onClick={() => setIsMobileMenuOpen(true)}>
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
