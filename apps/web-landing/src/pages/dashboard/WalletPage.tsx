import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PaymentModal from '@/components/PaymentModal';
import {
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    Wallet,
    History
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function WalletPage() {
    const { user, refreshUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    // Refresh balance on mount
    useEffect(() => {
        refreshUser();
    }, []);

    const handleDeposit = () => {
        // This is handled by PaymentModal now, so this legacy function might be removed or updated
        setIsDepositOpen(false);
        setAmount('');
    };

    // TODO: Connect to real transaction history API
    const transactions: any[] = [];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white">My Wallet</h1>

            {/* Balance Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-gradient-to-br from-red-600 to-red-800 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Available Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CFA
                        </div>
                        <p className="text-xs opacity-70 mt-1">
                            Updated just now
                        </p>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="col-span-1 border-red-600/30 flex flex-col justify-center items-center p-6 bg-neutral-900 space-y-4">
                    <PaymentModal>
                        <Button size="lg" className="w-full min-h-[80px] flex flex-col gap-2 bg-neutral-800 hover:bg-neutral-700 text-white border border-red-600/30 shadow-sm">
                            <div className="h-10 w-10 rounded-full bg-red-900/30 text-red-500 flex items-center justify-center">
                                <Plus className="h-6 w-6" />
                            </div>
                            <span className="font-semibold">Deposit Funds</span>
                        </Button>
                    </PaymentModal>

                    <Button variant="outline" size="lg" className="w-full min-h-[60px] flex flex-col gap-1 border-red-600/30 bg-transparent hover:bg-neutral-800 text-neutral-300" onClick={() => toast.info('Withdrawal integration coming soon')}>
                        <span className="font-semibold">Withdraw Funds</span>
                    </Button>
                </Card>
            </div>

            {/* Transaction History */}
            <div className="mt-8">
                <Tabs defaultValue="transactions" className="w-full">
                    <TabsList>
                        <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                    </TabsList>
                    <TabsContent value="transactions" className="mt-4">
                        <Card className="bg-neutral-900 border-red-600/30">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-white">
                                    <History className="h-5 w-5 text-red-500" />
                                    History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {transactions.length > 0 ? (
                                    <div className="space-y-4">
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                        {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {tx.type === 'deposit' ? 'Deposit' : tx.type === 'game_win' ? 'Game Winnings' : 'Withdrawal'}
                                                        </p>
                                                        <p className="text-sm text-neutral-500">{tx.date}</p>
                                                    </div>
                                                </div>
                                                <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-neutral-900 dark:text-neutral-100'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="text-center pt-4">
                                            <Button variant="link" className="text-neutral-500">View all transactions</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-neutral-400">
                                        No recent transactions found.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="pending">
                        <Card className="bg-neutral-900 border-red-600/30">
                            <CardContent className="pt-6 text-center text-neutral-400">
                                No pending transactions.
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
