import { LanguageProvider } from '@/contexts/LanguageContext';
import { RegistrationProvider } from '@/contexts/RegistrationContext';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import GameConcept from '@/components/landing/GameConcept';
import Registration from '@/components/landing/Registration';
import Download from '@/components/landing/Download';
import Footer from '@/components/landing/Footer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

// Replace these with your actual app store URLs
const APP_STORE_URL = 'https://apps.apple.com/app/dice-world';
const PLAY_STORE_URL = 'https://github.com/Web-snappl/dice-main/releases/tag/v.1.0.3#:~:text=3-,app%2Drelease.apk,-sha256%3A4bacbd87252a57b6f4ad233786549be4e5e5a1c644a08fc2f0dbda58b39f82cc';

// Replace with your actual WhatsApp phone number (include country code, e.g., "48123456789")
const WHATSAPP_PHONE_NUMBER = '';

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
          <WhatsAppButton phoneNumber={WHATSAPP_PHONE_NUMBER} />
        </div>
      </RegistrationProvider>
    </LanguageProvider>
  );
};

export default Index;
