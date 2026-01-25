import { useLanguage } from '@/contexts/LanguageContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { Button } from '@/components/ui/button';
import heroDesktop from '@/assets/hero-desktop.jpg';
import heroMobile from '@/assets/hero-mobile.jpeg';

const Hero = () => {
  const { t } = useLanguage();
  const { isRegistered } = useRegistration();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadClick = () => {
    if (isRegistered) {
      scrollToSection('download');
    } else {
      scrollToSection('register');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        {/* Desktop Image */}
        <img
          src={heroDesktop}
          alt="Dice-world hero"
          className="hidden md:block w-full h-full object-cover"
        />
        {/* Mobile Image */}
        <img
          src={heroMobile}
          alt="Dice-world hero"
          className="md:hidden w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 opacity-0 animate-fade-in-up">
            <span className="text-foreground">{t('hero.title')}</span>
            <br />
            <span className="text-gradient">{t('hero.titleHighlight')}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto opacity-0 animate-fade-in-up animation-delay-200">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up animation-delay-300">
            <Button
              size="lg"
              onClick={() => scrollToSection('register')}
              className="text-lg px-8 py-6 glow-primary hover-glow"
            >
              {t('hero.cta.register')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleDownloadClick}
              className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10"
            >
              {t('hero.cta.download')}
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-fade-in animation-delay-400">
        <div className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
