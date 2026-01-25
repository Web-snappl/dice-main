import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Reward {
    _id: string;
    userId: string;
    userName?: string;
    type: string;
    description: string;
    value?: number;
    status: string;
    allocatedByName?: string;
    createdAt: string;
}

interface RewardStats {
    pending: number;
    allocated: number;
    claimed: number;
    expired: number;
    total: number;
}

export function RewardsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const [rewards, setRewards] = useState<Reward[]>([]);
    const [stats, setStats] = useState<RewardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        userId: '',
        userName: '',
        type: 'manual',
        description: '',
        value: 0,
    });

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('rewards.title');
        loadData();
    }, [t, statusFilter]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = { limit: 50 };
            if (statusFilter) params.status = statusFilter;

            const [rewardsData, statsData] = await Promise.all([
                api.getRewards(params),
                api.getRewardStats(),
            ]);
            setRewards(rewardsData.rewards);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load rewards:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            await api.createReward(formData);
            setShowModal(false);
            setFormData({ userId: '', userName: '', type: 'manual', description: '', value: 0 });
            loadData();
        } catch (error) {
            console.error('Failed to create reward:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-500/20 text-yellow-400',
            allocated: 'bg-blue-500/20 text-blue-400',
            claimed: 'bg-green-500/20 text-green-400',
            expired: 'bg-dark-600 text-dark-400',
        };
        return styles[status] || styles.pending;
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            manual: 'bg-purple-500/20 text-purple-400',
            tournament: 'bg-blue-500/20 text-blue-400',
            achievement: 'bg-green-500/20 text-green-400',
            bonus: 'bg-orange-500/20 text-orange-400',
        };
        return styles[type] || styles.manual;
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                        { key: '', label: 'Total', value: stats.total, color: 'text-white' },
                        { key: 'pending', label: t('rewards.pending'), value: stats.pending, color: 'text-yellow-400' },
                        { key: 'allocated', label: t('rewards.allocated'), value: stats.allocated, color: 'text-blue-400' },
                        { key: 'claimed', label: t('rewards.claimed'), value: stats.claimed, color: 'text-green-400' },
                        { key: 'expired', label: t('rewards.expired'), value: stats.expired, color: 'text-dark-400' },
                    ].map((stat) => (
                        <div
                            key={stat.key}
                            onClick={() => { setStatusFilter(stat.key); }}
                            className={`card cursor-pointer transition-all ${statusFilter === stat.key ? 'ring-2 ring-primary-500' : ''}`}
                        >
                            <p className="text-dark-400 text-sm">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Header */}
            {isAdmin && (
                <div className="flex justify-end">
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus className="w-5 h-5 mr-2" />
                        {t('rewards.allocate')}
                    </button>
                </div>
            )}

            {/* Rewards List */}
            <div className="card p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : rewards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                        <Gift className="w-12 h-12 mb-4" />
                        <p>{t('common.noData')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-dark-700">
                        {rewards.map((reward) => (
                            <div key={reward._id} className="p-6 hover:bg-dark-700/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className="p-3 rounded-xl bg-primary-500/20">
                                            <Gift className="w-6 h-6 text-primary-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3 mb-1">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadge(reward.type)}`}>
                                                    {t(`rewards.${reward.type}`)}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(reward.status)}`}>
                                                    {t(`rewards.${reward.status}`)}
                                                </span>
                                            </div>
                                            <p className="text-white font-medium">{reward.description}</p>
                                            <div className="flex items-center space-x-4 mt-2 text-sm">
                                                <span className="text-dark-500">
                                                    User: <span className="text-dark-300">{reward.userName || reward.userId}</span>
                                                </span>
                                                {reward.value && (
                                                    <span className="text-dark-500">
                                                        Value: <span className="text-green-400">{reward.value}</span>
                                                    </span>
                                                )}
                                                <span className="text-dark-500">
                                                    {new Date(reward.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Allocate Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-6">{t('rewards.allocate')}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">User ID</label>
                                <input
                                    type="text"
                                    value={formData.userId}
                                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                    className="input-field"
                                    placeholder="Enter user ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">User Name (optional)</label>
                                <input
                                    type="text"
                                    value={formData.userName}
                                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">{t('rewards.type')}</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="manual">{t('rewards.manual')}</option>
                                    <option value="bonus">{t('rewards.bonus')}</option>
                                    <option value="tournament">{t('rewards.tournament')}</option>
                                    <option value="achievement">{t('rewards.achievement')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field h-24 resize-none"
                                    placeholder="Reason for reward..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">Value (optional)</label>
                                <input
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) })}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="btn-primary"
                                disabled={!formData.userId || !formData.description}
                            >
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
