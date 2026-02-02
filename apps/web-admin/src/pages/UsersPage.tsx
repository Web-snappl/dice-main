import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MoreVertical, Eye, Ban, Undo2, UserX, Check, DollarSign, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    status: string;
    createdAt: string;
    lastLoginAt?: string;
    balance?: number;
}

interface UserResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
}

export function UsersPage() {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

    const [data, setData] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [modalAction, setModalAction] = useState<{ type: string; user: User } | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('users.title');
    }, [t]);

    useEffect(() => {
        loadUsers();
    }, [page, search, roleFilter, statusFilter]);

    const loadUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, any> = { page, limit: 20 };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;
            if (statusFilter) params.status = statusFilter;

            const response = await api.getUsers(params);
            setData(response);
        } catch (err: any) {
            console.error('Failed to load users:', err);
            setError(err.message || 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async () => {
        if (!modalAction) return;

        try {
            switch (modalAction.type) {
                case 'suspend':
                    await api.suspendUser(modalAction.user.id, actionReason);
                    break;
                case 'ban':
                    await api.banUser(modalAction.user.id, actionReason);
                    break;
                case 'restore':
                    await api.restoreUser(modalAction.user.id);
                    break;
                case 'delete':
                    await api.deleteUser(modalAction.user.id);
                    break;
                case 'edit_balance':
                    await api.updateUser(modalAction.user.id, { balance: parseFloat(actionReason) });
                    break;
            }
            setModalAction(null);
            setActionReason('');
            loadUsers();
        } catch (error) {
            console.error('Action failed:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-500/20 text-green-400 border-green-500/30',
            suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            banned: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return styles[status] || styles.active;
    };

    const getRoleBadge = (role: string) => {
        const normalizedRole = role.toLowerCase();
        const styles: Record<string, string> = {
            admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            moderator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            user: 'bg-dark-600 text-dark-300 border-dark-500',
        };
        return styles[normalizedRole] || styles.user;
    };

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                        type="text"
                        placeholder={t('users.search')}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="input-field pl-10"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="input-field w-40"
                    >
                        <option value="">{t('users.role')}</option>
                        <option value="user">{t('users.player')}</option>
                        <option value="moderator">{t('users.moderator')}</option>
                        <option value="admin">{t('users.administrator')}</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="input-field w-40"
                    >
                        <option value="">{t('users.status')}</option>
                        <option value="active">{t('users.active')}</option>
                        <option value="suspended">{t('users.suspended')}</option>
                        <option value="banned">{t('users.banned')}</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">{error}</p>
                        <button onClick={loadUsers} className="mt-4 btn-secondary">
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                                            {t('users.role')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                                            {t('users.status')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                                            {t('users.createdAt')}
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                                            Coins
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                                            {t('users.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {data?.users.map((user) => {
                                        console.log(`User ${user.id} balance:`, user.balance);
                                        return (
                                            <tr key={user.id} className="hover:bg-dark-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center mr-4">
                                                            <span className="text-sm font-bold text-white">
                                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">
                                                                {user.firstName} {user.lastName}
                                                            </p>
                                                            <p className="text-dark-400 text-sm">{user.email || user.phoneNumber}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadge(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(user.status || 'active')}`}>
                                                        {user.status || 'active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-dark-400 text-sm">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-yellow-400 font-medium font-mono">
                                                    {user.balance?.toLocaleString() ?? 0}
                                                </td>
                                                <td className="px-6 py-4 text-right relative">
                                                    <button
                                                        onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                                                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical className="w-5 h-5 text-dark-400" />
                                                    </button>

                                                    {actionMenu === user.id && (
                                                        <div className="absolute right-6 top-12 w-48 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-10">
                                                            <button
                                                                onClick={() => { setActionMenu(null); setModalAction({ type: 'view', user }); }}
                                                                className="w-full flex items-center px-4 py-3 text-sm text-dark-200 hover:bg-dark-600 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 mr-3" /> {t('users.view')}
                                                            </button>
                                                            {user.status === 'active' && (
                                                                <button
                                                                    onClick={() => { setActionMenu(null); setModalAction({ type: 'suspend', user }); }}
                                                                    className="w-full flex items-center px-4 py-3 text-sm text-yellow-400 hover:bg-dark-600 transition-colors"
                                                                >
                                                                    <UserX className="w-4 h-4 mr-3" /> {t('users.suspend')}
                                                                </button>
                                                            )}
                                                            {isAdmin && user.status !== 'banned' && (
                                                                <button
                                                                    onClick={() => { setActionMenu(null); setModalAction({ type: 'ban', user }); }}
                                                                    className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-dark-600 transition-colors"
                                                                >
                                                                    <Ban className="w-4 h-4 mr-3" /> {t('users.ban')}
                                                                </button>
                                                            )}
                                                            {isAdmin && (user.status === 'suspended' || user.status === 'banned') && (
                                                                <button
                                                                    onClick={() => { setActionMenu(null); setModalAction({ type: 'restore', user }); }}
                                                                    className="w-full flex items-center px-4 py-3 text-sm text-green-400 hover:bg-dark-600 transition-colors"
                                                                >
                                                                    <Undo2 className="w-4 h-4 mr-3" /> {t('users.restore')}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => { setActionMenu(null); setModalAction({ type: 'edit_balance', user }); setActionReason(user.balance?.toString() || '0'); }}
                                                                className="w-full flex items-center px-4 py-3 text-sm text-yellow-400 hover:bg-dark-600 transition-colors"
                                                            >
                                                                <DollarSign className="w-4 h-4 mr-3" /> Edit Balance
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data && data.total > data.limit && (
                            <div className="px-6 py-4 border-t border-dark-700 flex items-center justify-between">
                                <p className="text-dark-400 text-sm">
                                    {t('common.showing')} {(page - 1) * data.limit + 1}-{Math.min(page * data.limit, data.total)} {t('common.of')} {data.total}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="btn-secondary disabled:opacity-50"
                                    >
                                        {t('common.previous')}
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page * data.limit >= data.total}
                                        className="btn-secondary disabled:opacity-50"
                                    >
                                        {t('common.next')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Action Modal */}
            {modalAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {modalAction.type === 'suspend' && t('users.suspend')}
                            {modalAction.type === 'ban' && t('users.ban')}
                            {modalAction.type === 'restore' && t('users.restore')}
                            {modalAction.type === 'delete' && t('users.delete')}
                            {modalAction.type === 'view' && 'User Details:'}
                            {modalAction.type === 'edit_balance' && 'Edit Balance:'}
                            {' '}{modalAction.user.firstName} {modalAction.user.lastName}
                        </h3>

                        {modalAction.type === 'edit_balance' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-dark-300 mb-2">New Balance (Coins)</label>
                                <input
                                    type="number"
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter amount..."
                                />
                            </div>
                        )}

                        {(modalAction.type === 'suspend' || modalAction.type === 'ban') && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-dark-300 mb-2">Reason</label>
                                <textarea
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    className="input-field h-24 resize-none"
                                    placeholder="Enter reason..."
                                    required
                                />
                            </div>
                        )}

                        {modalAction.type === 'view' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-400">Full Name</label>
                                    <p className="text-white">{modalAction.user.firstName} {modalAction.user.lastName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-400">Email</label>
                                    <p className="text-white">{modalAction.user.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-400">Phone</label>
                                    <p className="text-white">{modalAction.user.phoneNumber}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-400">Role</label>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadge(modalAction.user.role)}`}>
                                        {modalAction.user.role}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-400">Joined</label>
                                    <p className="text-white">{new Date(modalAction.user.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setModalAction(null); setActionReason(''); }}
                                className="btn-secondary"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAction}
                                className={modalAction.type === 'restore' ? 'btn-primary' : 'btn-danger'}
                                disabled={(modalAction.type === 'suspend' || modalAction.type === 'ban') && !actionReason}
                                style={{ display: modalAction.type === 'view' ? 'none' : 'block' }}
                            >
                                <Check className="w-4 h-4 mr-2 inline-block" />
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
