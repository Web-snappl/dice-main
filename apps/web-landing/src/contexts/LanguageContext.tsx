import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'nav.register': 'Register',
    'nav.download': 'Download',

    // Hero
    'hero.title': 'Roll the Dice.',
    'hero.titleHighlight': 'Master the Game.',
    'hero.subtitle': 'Where luck meets strategy. Dice-world is the online dice game that rewards smart decisions and bold moves.',
    'hero.cta.register': 'Create Account',
    'hero.cta.download': 'Download App',

    // How it works
    'howItWorks.title': 'How It Works',
    'howItWorks.step1.title': 'Register',
    'howItWorks.step1.desc': 'Create your free account in seconds',
    'howItWorks.step2.title': 'Download',
    'howItWorks.step2.desc': 'Get the app on iOS or Android',
    'howItWorks.step3.title': 'Play',
    'howItWorks.step3.desc': 'Start playing Dice-world instantly',

    // Game Concept
    'concept.title': 'Strategy Meets Luck',
    'concept.subtitle': 'Every roll counts. Every decision matters.',
    'concept.feature1.title': 'Solo Play',
    'concept.feature1.desc': 'Challenge yourself and climb the leaderboard',
    'concept.feature2.title': 'Duel Mode',
    'concept.feature2.desc': 'Face opponents in intense 1v1 battles',
    'concept.feature3.title': 'Group Games',
    'concept.feature3.desc': 'Compete with friends in multiplayer matches',
    'concept.description': 'Fast games. Real thinking. Pure excitement.',

    // Registration
    'register.title': 'Join the Game',
    'register.subtitle': 'Create your account and start playing',
    'register.email': 'Email address',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm password',
    'register.submit': 'Create Account',
    'register.success.title': 'Welcome to Dice-world!',
    'register.success.message': 'Your account is ready. Download the app to start playing.',
    'register.success.cta': 'Download Now',
    'register.error.passwordMatch': 'Passwords do not match',
    'register.error.email': 'Please enter a valid email',
    'register.error.password': 'Password must be at least 8 characters',

    // Download
    'download.title': 'Download Dice-world',
    'download.subtitle': 'Available on iOS and Android. Free to play.',
    'download.free': 'Free at launch',
    'download.appStore': 'Download on the App Store',
    'download.playStore': 'Get it on Google Play',

    // Footer
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.copyright': '© 2025 Dice-world. All rights reserved.',

    // WhatsApp
    'whatsapp.label': 'Contact Support',
  },
  fr: {
    // Header
    'nav.register': 'S\'inscrire',
    'nav.download': 'Télécharger',

    // Hero
    'hero.title': 'Lancez les dés.',
    'hero.titleHighlight': 'Maîtrisez le jeu.',
    'hero.subtitle': 'Là où la chance rencontre la stratégie. Dice-world est le jeu de dés en ligne qui récompense les décisions intelligentes et les coups audacieux.',
    'hero.cta.register': 'Créer un compte',
    'hero.cta.download': 'Télécharger',

    // How it works
    'howItWorks.title': 'Comment ça marche',
    'howItWorks.step1.title': 'Inscription',
    'howItWorks.step1.desc': 'Créez votre compte gratuit en quelques secondes',
    'howItWorks.step2.title': 'Téléchargement',
    'howItWorks.step2.desc': 'Obtenez l\'app sur iOS ou Android',
    'howItWorks.step3.title': 'Jouer',
    'howItWorks.step3.desc': 'Commencez à jouer à Dice-world instantanément',

    // Game Concept
    'concept.title': 'La stratégie rencontre la chance',
    'concept.subtitle': 'Chaque lancer compte. Chaque décision importe.',
    'concept.feature1.title': 'Mode Solo',
    'concept.feature1.desc': 'Défiez-vous et grimpez au classement',
    'concept.feature2.title': 'Mode Duel',
    'concept.feature2.desc': 'Affrontez des adversaires en 1v1 intense',
    'concept.feature3.title': 'Jeux de groupe',
    'concept.feature3.desc': 'Jouez avec vos amis en multijoueur',
    'concept.description': 'Parties rapides. Réflexion réelle. Pure excitation.',

    // Registration
    'register.title': 'Rejoignez le jeu',
    'register.subtitle': 'Créez votre compte et commencez à jouer',
    'register.email': 'Adresse email',
    'register.password': 'Mot de passe',
    'register.confirmPassword': 'Confirmer le mot de passe',
    'register.submit': 'Créer un compte',
    'register.success.title': 'Bienvenue sur Dice-world !',
    'register.success.message': 'Votre compte est prêt. Téléchargez l\'app pour commencer à jouer.',
    'register.success.cta': 'Télécharger maintenant',
    'register.error.passwordMatch': 'Les mots de passe ne correspondent pas',
    'register.error.email': 'Veuillez entrer un email valide',
    'register.error.password': 'Le mot de passe doit contenir au moins 8 caractères',

    // Download
    'download.title': 'Téléchargez Dice-world',
    'download.subtitle': 'Disponible sur iOS et Android. Gratuit.',
    'download.free': 'Gratuit au lancement',
    'download.appStore': 'Télécharger sur l\'App Store',
    'download.playStore': 'Disponible sur Google Play',

    // Footer
    'footer.terms': 'Conditions d\'utilisation',
    'footer.privacy': 'Politique de confidentialité',
    'footer.copyright': '© 2025 Dice-world. Tous droits réservés.',

    // WhatsApp
    'whatsapp.label': 'Contacter le support',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('dice-world-lang') as Language;
    if (saved && (saved === 'en' || saved === 'fr')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('dice-world-lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
