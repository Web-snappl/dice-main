import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Plus, Trash2, Gift } from 'lucide-react';
import { api } from '../api/client';

interface PromoCode {
    _id: string;
    code: string;
    bonusAmount: number;
    maxUses: number;
    currentUses: number;
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
}

export function PromoCodesPage() {
    const { t } = useTranslation();
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        bonusAmount: 0,
        maxUses: 0,
        expiresAt: '',
    });

    useEffect(() => {
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = t('promoCodes.title');
        loadData();
    }, [t]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await api.getPromoCodes();
            setPromoCodes(data);
        } catch (error) {
            console.error('Failed to load promo codes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            await api.createPromoCode({
                code: formData.code,
                bonusAmount: formData.bonusAmount,
                maxUses: formData.maxUses,
                ...(formData.expiresAt ? { expiresAt: formData.expiresAt } : {}),
            });
            setShowModal(false);
            setFormData({ code: '', bonusAmount: 0, maxUses: 0, expiresAt: '' });
            loadData();
        } catch (error: any) {
            console.error('Failed to create promo code:', error);
            alert(error?.response?.data?.message || 'Failed to create promo code');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('promoCodes.confirmDelete'))) return;
        try {
            await api.deletePromoCode(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete promo code:', error);
        }
    };

    const getStatusInfo = (promo: PromoCode) => {
        if (!promo.isActive) return { label: t('promoCodes.inactive'), style: 'bg-dark-600 text-dark-400' };
        if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return { label: t('promoCodes.expired'), style: 'bg-red-500/20 text-red-400' };
        if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) return { label: t('promoCodes.maxedOut'), style: 'bg-orange-500/20 text-orange-400' };
        return { label: t('promoCodes.active'), style: 'bg-green-500/20 text-green-400' };
    };

    const activeCount = promoCodes.filter(p => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > new Date()) && (p.maxUses === 0 || p.currentUses < p.maxUses)).length;
    const totalUses = promoCodes.reduce((sum, p) => sum + p.currentUses, 0);

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                    <p className="text-dark-400 text-sm">{t('promoCodes.totalCodes')}</p>
                    <p className="text-2xl font-bold text-white">{promoCodes.length}</p>
                </div>
                <div className="card">
                    <p className="text-dark-400 text-sm">{t('promoCodes.activeCodes')}</p>
                    <p className="text-2xl font-bold text-green-400">{activeCount}</p>
                </div>
                <div className="card">
                    <p className="text-dark-400 text-sm">{t('promoCodes.totalUses')}</p>
                    <p className="text-2xl font-bold text-blue-400">{totalUses}</p>
                </div>
            </div>

            {/* Header */}
            <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    {t('promoCodes.add')}
                </button>
            </div>

            {/* Promo Codes List */}
            <div className="card p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : promoCodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                        <Ticket className="w-12 h-12 mb-4" />
                        <p>{t('common.noData')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-dark-700">
                        {promoCodes.map((promo) => {
                            const status = getStatusInfo(promo);
                            return (
                                <div key={promo._id} className="p-6 hover:bg-dark-700/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 rounded-xl bg-primary-500/20">
                                                <Gift className="w-6 h-6 text-primary-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <span className="text-lg font-bold text-white font-mono tracking-wider">
                                                        {promo.code}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.style}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm">
                                                    <span className="text-dark-500">
                                                        {t('promoCodes.bonus')}: <span className="text-green-400 font-semibold">{promo.bonusAmount} CFA</span>
                                                    </span>
                                                    <span className="text-dark-500">
                                                        {t('promoCodes.uses')}: <span className="text-dark-300">{promo.currentUses}{promo.maxUses > 0 ? ` / ${promo.maxUses}` : ' / ∞'}</span>
                                                    </span>
                                                    {promo.expiresAt && (
                                                        <span className="text-dark-500">
                                                            {t('promoCodes.expires')}: <span className="text-dark-300">{new Date(promo.expiresAt).toLocaleDateString()}</span>
                                                        </span>
                                                    )}
                                                    <span className="text-dark-500">
                                                        {new Date(promo.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(promo._id)}
                                            className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title={t('promoCodes.delete')}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-6">{t('promoCodes.add')}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">{t('promoCodes.code')}</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="input-field uppercase"
                                    placeholder="e.g. WELCOME200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">{t('promoCodes.bonusAmount')}</label>
                                <input
                                    type="number"
                                    value={formData.bonusAmount}
                                    onChange={(e) => setFormData({ ...formData, bonusAmount: parseInt(e.target.value) || 0 })}
                                    className="input-field"
                                    placeholder="200"
                                    min="0"
                                />
                                <p className="text-xs text-dark-500 mt-1">{t('promoCodes.bonusHint')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">{t('promoCodes.maxUsesLabel')}</label>
                                <input
                                    type="number"
                                    value={formData.maxUses}
                                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })}
                                    className="input-field"
                                    placeholder="0"
                                    min="0"
                                />
                                <p className="text-xs text-dark-500 mt-1">{t('promoCodes.maxUsesHint')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">{t('promoCodes.expiresAt')}</label>
                                <input
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    className="input-field"
                                />
                                <p className="text-xs text-dark-500 mt-1">{t('promoCodes.expiresHint')}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="btn-primary"
                                disabled={!formData.code || formData.bonusAmount <= 0}
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
