import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Tag, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const Registration = () => {
  const { t } = useLanguage();
  const { isRegistered, setIsRegistered, setUserEmail } = useRegistration();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    promoCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPromoField, setShowPromoField] = useState(false);
  const [promoStatus, setPromoStatus] = useState<{
    checking: boolean;
    valid?: boolean;
    bonusAmount?: number;
    reason?: string;
  }>({ checking: false });
  const promoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validatePromoCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setPromoStatus({ checking: false });
      return;
    }
    setPromoStatus({ checking: true });
    try {
      const result = await api.auth.validatePromoCode(code.trim());
      setPromoStatus({ checking: false, ...result });
    } catch {
      setPromoStatus({ checking: false, valid: false, reason: 'Network error' });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Debounced promo code validation
    if (name === 'promoCode') {
      if (promoDebounceRef.current) clearTimeout(promoDebounceRef.current);
      if (!value.trim()) {
        setPromoStatus({ checking: false });
      } else {
        setPromoStatus({ checking: true });
        promoDebounceRef.current = setTimeout(() => validatePromoCode(value), 500);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('register.error.email');
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = t('register.error.password');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.error.passwordMatch');
    }

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await api.auth.publicSignup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        ...(formData.promoCode ? { promoCode: formData.promoCode } : {}),
      });

      setUserEmail(formData.email);
      setIsRegistered(true);
      toast.success(t('register.success.message'));
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToDownload = () => {
    const element = document.getElementById('download');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isRegistered) {
    return (
      <section id="register" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto bg-card border-primary/30 glow-primary">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t('register.success.title')}</h3>
              <p className="text-muted-foreground mb-6">{t('register.success.message')}</p>
              <Button size="lg" onClick={scrollToDownload} className="glow-primary">
                {t('register.success.cta')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
            <CardDescription>{t('register.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? 'border-destructive' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Input
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? 'border-destructive' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Input
                  name="phoneNumber"
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <Input
                  name="email"
                  type="email"
                  placeholder={t('register.email')}
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Input
                  name="password"
                  type="password"
                  placeholder={t('register.password')}
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder={t('register.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div>
                {!showPromoField ? (
                  <button
                    type="button"
                    onClick={() => setShowPromoField(true)}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    {t('register.promoCode.toggle')}
                  </button>
                ) : (
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {t('register.promoCode.label')}
                    </label>
                    <div className="relative">
                      <Input
                        name="promoCode"
                        placeholder={t('register.promoCode.placeholder')}
                        value={formData.promoCode}
                        onChange={handleChange}
                        className={`uppercase pr-10 ${promoStatus.valid === true ? 'border-green-500' :
                            promoStatus.valid === false ? 'border-destructive' : ''
                          }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {promoStatus.checking && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                        {!promoStatus.checking && promoStatus.valid === true && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {!promoStatus.checking && promoStatus.valid === false && (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    {promoStatus.valid === true && promoStatus.bonusAmount && (
                      <p className="text-xs text-green-500">+{promoStatus.bonusAmount} CFA bonus!</p>
                    )}
                    {promoStatus.valid === false && promoStatus.reason && (
                      <p className="text-xs text-destructive">{promoStatus.reason}</p>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full glow-primary"
                disabled={isLoading}
              >
                {isLoading ? '...' : t('register.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Registration;
