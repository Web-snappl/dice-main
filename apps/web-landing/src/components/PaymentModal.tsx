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
            toast.success(`Successfully deposited ${amount} CFA`);

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
                {isProcessing ? 'Processing...' : `Pay ${amount} CFA`}
            </Button>
        </form>
    );
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stripeApi } from '@/api/client';

export default function PaymentModal({ children, onSuccess, initialTab = 'deposit' }: { children: React.ReactNode, onSuccess?: () => void, initialTab?: 'deposit' | 'withdraw' }) {
    const { user, refreshUser, updateUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleInitPayment = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) < 200) {
            toast.error('Minimum deposit is 200 CFA');
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
                    uid: user?.uid,
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

    const handleConnectStripe = async () => {
        setIsLoading(true);
        try {
            const returnUrl = window.location.href;
            const refreshUrl = window.location.href;
            const { url } = await stripeApi.onboard(user!.uid, returnUrl, refreshUrl);
            window.location.href = url;
        } catch (error: any) {
            toast.error(error.message || 'Failed to start onboarding');
            console.error(error);
            setIsLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (Number(withdrawAmount) > (user?.balance || 0)) {
            toast.error('Insufficient funds');
            return;
        }

        setIsLoading(true);
        try {
            await stripeApi.withdraw(user!.uid, Number(withdrawAmount));
            toast.success('Withdrawal successful!');

            // Optimistic update
            updateUser({ balance: (user?.balance || 0) - Number(withdrawAmount) });
            setIsOpen(false);
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || 'Withdrawal failed');
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
                setWithdrawAmount('');
            } else {
                // Refresh user status on open to check if stripe connected updated
                refreshUser();
            }
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Wallet</DialogTitle>
                    <DialogDescription>
                        Manage your funds securely with Stripe.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="deposit" value={activeTab} onValueChange={(v) => setActiveTab(v as 'deposit' | 'withdraw')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="deposit">Deposit</TabsTrigger>
                        <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                    </TabsList>

                    <TabsContent value="deposit">
                        {!clientSecret ? (
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount (CFA)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="1000"
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
                    </TabsContent>

                    <TabsContent value="withdraw">
                        <div className="grid gap-4 py-4">
                            {!user?.isStripeConnected ? (
                                <div className="text-center space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        To withdraw funds, you need to connect your bank account via Stripe.
                                    </p>
                                    <Button onClick={handleConnectStripe} disabled={isLoading} className="w-full">
                                        {isLoading ? 'Connecting...' : 'Connect Bank Account'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="withdrawAmount">Amount (CFA)</Label>
                                        <Input
                                            id="withdrawAmount"
                                            type="number"
                                            placeholder="0.00"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            max={user?.balance}
                                        />
                                        <p className="text-xs text-muted-foreground">Available balance: {user?.balance?.toFixed(0)} CFA</p>
                                    </div>
                                    <Button onClick={handleWithdraw} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                                        {isLoading ? 'Processing...' : 'Withdraw Funds'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
