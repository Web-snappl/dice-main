import { useLanguage } from '@/contexts/LanguageContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { Button } from '@/components/ui/button';
import { Apple, Play } from 'lucide-react';

interface DownloadProps {
  appStoreUrl: string;
  playStoreUrl: string;
}

const Download = ({ appStoreUrl, playStoreUrl }: DownloadProps) => {
  const { t } = useLanguage();
  const { isRegistered } = useRegistration();

  const scrollToRegister = () => {
    const element = document.getElementById('register');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="download" className="py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {t('download.title')}
        </h2>
        <p className="text-xl text-muted-foreground mb-4">
          {t('download.subtitle')}
        </p>
        <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-10">
          {t('download.free')}
        </span>

        {isRegistered ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 bg-foreground text-background hover:bg-foreground/90"
            >
              <a href={appStoreUrl} target="_blank" rel="noopener noreferrer">
                <Apple className="mr-2 h-6 w-6" />
                {t('download.appStore')}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 glow-primary"
            >
              <a href={playStoreUrl} target="_blank" rel="noopener noreferrer">
                <Play className="mr-2 h-6 w-6" />
                {t('download.playStore')}
              </a>
            </Button>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <p className="text-muted-foreground mb-6">
              {t('register.subtitle')}
            </p>
            <Button size="lg" onClick={scrollToRegister} className="glow-primary">
              {t('hero.cta.register')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Download;
