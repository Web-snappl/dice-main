import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    PaymentElement,
    Elements,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Make sure to put your publishable key here
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const CheckoutForm = ({ amount, clientSecret, onSuccess, refreshUser, updateUser, user }: { amount: number, clientSecret: string, onSuccess: () => void, refreshUser: () => Promise<void>, updateUser: (u: any) => void, user: any }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/dashboard/wallet',
            },
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message ?? 'An unknown error occurred');
            setIsProcessing(false);
        } else {
            // Successful payment - Optimistic Update
            toast.success(`Successfully deposited $${amount}`);

            // 1. Optimistic local update (Instant feedback)
            updateUser({ balance: (Number(user?.balance) || 0) + Number(amount) });

            // 2. Poll server for real update (every 2s for 20s) to catch webhook processing
            let attempts = 0;
            const maxAttempts = 10;
            const interval = setInterval(async () => {
                attempts++;
                await refreshUser();
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                }
            }, 2000);

            onSuccess();
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
            <Button disabled={!stripe || isProcessing} className="w-full bg-red-600 hover:bg-red-700 text-white">
                {isProcessing ? 'Processing...' : `Pay $${amount}`}
            </Button>
        </form>
    );
};

export default function PaymentModal({ children, onSuccess }: { children: React.ReactNode, onSuccess?: () => void }) {
    const { user, refreshUser, updateUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInitPayment = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stripe/create-deposit-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    uid: user?.uid, // specific to this app structure
                    amount: Number(amount)
                })
            });

            if (!response.ok) throw new Error('Failed to create payment intent');

            const data = await response.json();
            setClientSecret(data.clientSecret);
        } catch (error) {
            toast.error('Failed to initialize payment');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                setClientSecret(null);
                setAmount('');
            }
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Funds</DialogTitle>
                    <DialogDescription>
                        Enter amount to deposit via secure Stripe payment.
                    </DialogDescription>
                </DialogHeader>

                {!clientSecret ? (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="25.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleInitPayment} disabled={isLoading} className="w-full">
                            {isLoading ? 'Initializing...' : 'Continue to Payment'}
                        </Button>
                    </div>
                ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm
                            amount={Number(amount)}
                            clientSecret={clientSecret}
                            onSuccess={() => {
                                setIsOpen(false);
                                onSuccess?.();
                            }}

                            refreshUser={refreshUser}
                            updateUser={updateUser}
                            user={user}
                        />
                    </Elements>
                )}
            </DialogContent>
        </Dialog>
    );
}
