import { useTranslation } from 'react-i18next';
import { LogOut, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function TopBar() {
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
        <header className="fixed top-0 left-64 right-0 h-16 bg-dark-800 border-b border-dark-700 z-30">
            <div className="h-full flex items-center justify-between px-6">
                {/* Page Title - will be updated by each page */}
                <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-white" id="page-title">
                        {t('dashboard.title')}
                    </h1>
                </div>

                {/* Right side actions */}
                <div className="flex items-center space-x-4">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                        title={i18n.language === 'en' ? 'Français' : 'English'}
                    >
                        <Globe className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium uppercase">{i18n.language}</span>
                    </button>

                    {/* User Info */}
                    <div className="flex items-center px-4 py-2 bg-dark-700 rounded-lg">
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

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-3 py-2 text-dark-300 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
                        title={t('app.logout')}
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
