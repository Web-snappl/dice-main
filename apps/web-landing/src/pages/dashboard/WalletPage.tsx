import { useState } from 'react';
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
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    const handleDeposit = () => {
        toast.success(`Mockup: Initiating deposit of $${amount}`);
        setIsDepositOpen(false);
        setAmount('');
    };

    const transactions = [
        { id: 1, type: 'deposit', amount: 50, date: '2024-03-10', status: 'completed' },
        { id: 2, type: 'game_win', amount: 120, date: '2024-03-09', status: 'completed' },
        { id: 3, type: 'withdrawal', amount: -200, date: '2024-03-05', status: 'completed' },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold">My Wallet</h1>

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
                            ${(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs opacity-70 mt-1">
                            Updated just now
                        </p>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="col-span-1 border-dashed flex flex-col justify-center items-center p-6 bg-neutral-50 dark:bg-neutral-900/50 space-y-4">
                    <PaymentModal>
                        <Button size="lg" className="w-full min-h-[80px] flex flex-col gap-2 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-200 shadow-sm dark:bg-neutral-800 dark:text-neutral-50 dark:border-neutral-700">
                            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                <Plus className="h-6 w-6" />
                            </div>
                            <span className="font-semibold">Deposit Funds</span>
                        </Button>
                    </PaymentModal>

                    <Button variant="outline" size="lg" className="w-full min-h-[60px] flex flex-col gap-1 border-dashed" onClick={() => toast.info('Withdrawal integration coming soon')}>
                        <span className="font-semibold text-neutral-500">Withdraw Funds</span>
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <History className="h-5 w-5 text-neutral-500" />
                                    History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="pending">
                        <Card>
                            <CardContent className="pt-6 text-center text-neutral-500">
                                No pending transactions.
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
