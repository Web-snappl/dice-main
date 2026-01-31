import { useTranslation } from 'react-i18next';
import { LogOut, Globe, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'fr' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('admin-lang', newLang);
    };

    return (
        <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-dark-800 border-b border-dark-700 z-30 transition-all duration-200">
            <div className="h-full flex items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden text-dark-300 hover:text-white p-1 rounded-lg hover:bg-dark-700 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Page Title - will be updated by each page */}
                    <h1 className="text-lg md:text-xl font-semibold text-white" id="page-title">
                        {t('dashboard.title')}
                    </h1>
                </div>

                {/* Right side actions */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center px-2 md:px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                        title={i18n.language === 'en' ? 'Français' : 'English'}
                    >
                        <Globe className="w-5 h-5 mr-0 md:mr-2" />
                        <span className="text-sm font-medium uppercase hidden md:inline">{i18n.language}</span>
                    </button>

                    {/* User Info */}
                    <div className="hidden md:flex items-center px-4 py-2 bg-dark-700 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-white">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </span>
                        </div>
                        <div className="mr-4">
                            <p className="text-sm font-medium text-white">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
                        </div>
                    </div>

                    {/* Mobile User Avatar (Simplified) */}
                    <div className="md:hidden w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-2 md:px-3 py-2 text-dark-300 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
                        title={t('app.logout')}
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
