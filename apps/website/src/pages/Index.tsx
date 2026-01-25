import { LanguageProvider } from '@/contexts/LanguageContext';
import { RegistrationProvider } from '@/contexts/RegistrationContext';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import GameConcept from '@/components/landing/GameConcept';
import Registration from '@/components/landing/Registration';
import Download from '@/components/landing/Download';
import Footer from '@/components/landing/Footer';

// Replace these with your actual app store URLs
const APP_STORE_URL = 'https://apps.apple.com/app/dice-world';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.diceworld';

const Index = () => {
  return (
    <LanguageProvider>
      <RegistrationProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Hero />
            <HowItWorks />
            <GameConcept />
            <Registration />
            <Download appStoreUrl={APP_STORE_URL} playStoreUrl={PLAY_STORE_URL} />
          </main>
          <Footer />
        </div>
      </RegistrationProvider>
    </LanguageProvider>
  );
};

export default Index;
