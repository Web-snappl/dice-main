import { useLanguage } from '@/contexts/LanguageContext';
import { Dice5 } from 'lucide-react';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Dice5 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">Dice-world</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollToSection('register')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('nav.register')}
          </button>
          <button
            onClick={() => scrollToSection('download')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('nav.download')}
          </button>
          <a
            href="/login"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Login
          </a>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Mobile Login Link */}
          <a
            href="/login"
            className="md:hidden text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Login
          </a>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${language === 'en'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${language === 'fr'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              FR
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
