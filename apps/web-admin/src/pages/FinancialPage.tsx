import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, AlertTriangle, Lock } from 'lucide-react';
import { api } from '../api/client';

interface FinancialSummary {
    deposits: {
        count: number;
        totalAmount: number;
    };
    rewards: {
        count: number;
        breakdown: Record<string, number>;
    };
    message?: string;
}

interface Transaction {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    type: string;
    timestamp: string;
    status: string;
    method?: string;
    accountNumber?: string;
}

interface Anomaly {
    userId: string;
    userName: string;
    totalDeposits: number;
    totalAmount: number;
    avgAmount: number;
    flagReason: string;
}

export function FinancialPage() {
    const { t } = useTranslation();
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'summary' | 'transactions' | 'anomalies'>('summary');

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('financial.title');
        loadData();
    }, [t]);

    const loadData = async (statusFilter?: string) => {
        setIsLoading(true);
        try {
            const [summaryData, transactionsData, anomaliesData] = await Promise.all([
                api.getFinancialSummary(),
                api.getTransactions(statusFilter ? { status: statusFilter } : {}),
                api.getFinancialAnomalies(),
            ]);
            setSummary(summaryData);
            setTransactions(transactionsData.transactions || []);
            setAnomalies(anomaliesData.anomalies || []);
        } catch (error) {
            console.error('Failed to load financial data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Read-only banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center">
                <Lock className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
                <p className="text-yellow-300 text-sm">
                    {t('financial.readOnly')} - Some operations are restricted here. Deposit verification and balance crediting are enforced server-side.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-dark-700">
                {['summary', 'transactions', 'anomalies'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === tab
                            ? 'text-primary-400 border-primary-400'
                            : 'text-dark-400 border-transparent hover:text-white'
                            }`}
                    >
                        {t(`financial.${tab}`)}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'summary' && summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="card">
                                <h3 className="text-lg font-semibold text-white mb-4">Coin Purchases</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-dark-400">Total Transactions</span>
                                        <span className="text-white font-medium">{summary.deposits.count.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-dark-400">Total Amount</span>
                                        <span className="text-green-400 font-bold text-xl">{summary.deposits.totalAmount.toLocaleString()} Coins</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-semibold text-white mb-4">Rewards</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-dark-400">Total Rewards</span>
                                        <span className="text-white font-medium">{summary.rewards.count.toLocaleString()}</span>
                                    </div>
                                    {Object.entries(summary.rewards.breakdown).map(([status, count]) => (
                                        <div key={status} className="flex justify-between">
                                            <span className="text-dark-400 capitalize">{status}</span>
                                            <span className="text-white">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {summary.message && (
                                <div className="md:col-span-2 p-4 bg-dark-700 rounded-lg">
                                    <p className="text-dark-400 text-sm">{summary.message}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <>
                            {/* Filter Controls */}
                            <div className="flex space-x-4 mb-4">
                                <select
                                    className="bg-dark-700 text-white rounded px-3 py-2 border border-dark-600"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        loadData(val === 'ALL' ? undefined : val);
                                    }}
                                    defaultValue="ALL"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="SUCCESS">Success</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                            </div>

                            <div className="card p-0">
                                {transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                                        <DollarSign className="w-12 h-12 mb-4" />
                                        <p>{t('financial.notAvailable')}</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-dark-700">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">User</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">Type</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">Method</th>
                                                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase">Amount</th>
                                                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase">Date</th>
                                                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-dark-700/50 transition-colors">
                                                    <td className="px-6 py-4 text-white">
                                                        <div>{tx.userName || tx.userId}</div>
                                                        {tx.accountNumber && <div className="text-xs text-dark-400">{tx.accountNumber}</div>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${tx.type === 'DEPOSIT' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                                            }`}>
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${tx.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                                                            tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {tx.status || 'UNKNOWN'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-dark-300 text-sm">{tx.method}</td>
                                                    <td className="px-6 py-4 text-right font-medium text-white">{tx.amount.toLocaleString()} CFA</td>
                                                    <td className="px-6 py-4 text-right text-dark-400">{new Date(tx.timestamp).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        {tx.type === 'WITHDRAW' && tx.status === 'PENDING' && (
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        if (confirm('Approve withdrawal? Ensure you have manually sent the funds.')) {
                                                                            await api.approveWithdrawal(tx.id);
                                                                            loadData(); // Refresh
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        const reason = prompt('Reason for rejection:');
                                                                        if (reason) {
                                                                            await api.rejectWithdrawal(tx.id, reason);
                                                                            loadData();
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'anomalies' && (
                        <div className="card p-0">
                            {anomalies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                                    <AlertTriangle className="w-12 h-12 mb-4" />
                                    <p>No anomalies detected</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-dark-700">
                                    {anomalies.map((anomaly, index) => (
                                        <div key={index} className="p-6 hover:bg-dark-700/50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-white font-medium">{anomaly.userName || anomaly.userId}</p>
                                                    <div className="flex items-center space-x-4 mt-2 text-sm">
                                                        <span className="text-dark-500">
                                                            Deposits: <span className="text-dark-300">{anomaly.totalDeposits}</span>
                                                        </span>
                                                        <span className="text-dark-500">
                                                            Total: <span className="text-green-400">{anomaly.totalAmount.toLocaleString()}</span>
                                                        </span>
                                                        <span className="text-dark-500">
                                                            Avg: <span className="text-dark-300">{anomaly.avgAmount.toLocaleString()}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full">
                                                    {anomaly.flagReason}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
