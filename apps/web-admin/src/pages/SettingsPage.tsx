import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon } from 'lucide-react';

export function SettingsPage() {
    const { t, i18n } = useTranslation();

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('settings.title');
    }, [t]);

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('admin-lang', lang);
    };

    return (
        <div className="max-w-2xl space-y-6">
            {/* Language Settings */}
            <div className="card">
                <div className="flex items-center mb-6">
                    <Globe className="w-6 h-6 text-primary-400 mr-3" />
                    <h3 className="text-lg font-semibold text-white">{t('settings.language')}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleLanguageChange('en')}
                        className={`p-4 rounded-lg border-2 transition-all ${i18n.language === 'en'
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-dark-600 hover:border-dark-500'
                            }`}
                    >
                        <p className="text-2xl mb-2">🇬🇧</p>
                        <p className={`font-medium ${i18n.language === 'en' ? 'text-primary-400' : 'text-white'}`}>
                            {t('settings.english')}
                        </p>
                    </button>

                    <button
                        onClick={() => handleLanguageChange('fr')}
                        className={`p-4 rounded-lg border-2 transition-all ${i18n.language === 'fr'
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-dark-600 hover:border-dark-500'
                            }`}
                    >
                        <p className="text-2xl mb-2">🇫🇷</p>
                        <p className={`font-medium ${i18n.language === 'fr' ? 'text-primary-400' : 'text-white'}`}>
                            {t('settings.french')}
                        </p>
                    </button>
                </div>
            </div>

            {/* Theme Settings */}
            <div className="card">
                <div className="flex items-center mb-6">
                    <Moon className="w-6 h-6 text-primary-400 mr-3" />
                    <h3 className="text-lg font-semibold text-white">{t('settings.theme')}</h3>
                </div>

                <div className="p-4 bg-dark-700 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="text-white font-medium">{t('settings.dark')}</p>
                        <p className="text-dark-400 text-sm">Currently active theme</p>
                    </div>
                    <div className="px-3 py-1 bg-primary-500/20 text-primary-400 text-sm rounded-full">
                        Active
                    </div>
                </div>
            </div>

            {/* Placeholder for future settings */}
            <div className="card opacity-50">
                <h3 className="text-lg font-semibold text-white mb-4">{t('settings.maintenance')}</h3>
                <p className="text-dark-400 text-sm">
                    Maintenance mode settings will be available in a future update.
                </p>
            </div>
        </div>
    );
}
