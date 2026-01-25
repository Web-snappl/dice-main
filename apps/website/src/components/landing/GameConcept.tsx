import { useLanguage } from '@/contexts/LanguageContext';
import { User, Swords, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const GameConcept = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: User,
      title: t('concept.feature1.title'),
      description: t('concept.feature1.desc'),
    },
    {
      icon: Swords,
      title: t('concept.feature2.title'),
      description: t('concept.feature2.desc'),
    },
    {
      icon: Users,
      title: t('concept.feature3.title'),
      description: t('concept.feature3.desc'),
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('concept.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('concept.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-2xl md:text-3xl font-semibold text-gradient">
          {t('concept.description')}
        </p>
      </div>
    </section>
  );
};

export default GameConcept;
