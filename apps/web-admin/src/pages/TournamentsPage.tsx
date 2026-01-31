import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, Clock, CheckCircle, X, Play } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Tournament {
    _id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: string;
    maxParticipants?: number;
    createdAt: string;
}

export function TournamentsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        maxParticipants: 100,
    });

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('tournaments.title');
        loadTournaments();
    }, [t, statusFilter, page]);

    const loadTournaments = async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = { page, limit: 20 };
            if (statusFilter) params.status = statusFilter;
            const response = await api.getTournaments(params);
            setTournaments(response.tournaments);
        } catch (error) {
            console.error('Failed to load tournaments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            await api.createTournament(formData);
            setShowModal(false);
            setFormData({ name: '', description: '', startDate: '', endDate: '', maxParticipants: 100 });
            loadTournaments();
        } catch (error) {
            console.error('Failed to create tournament:', error);
        }
    };

    const handleUpdateStatus = async (tournament: Tournament, newStatus: string) => {
        try {
            await api.updateTournament(tournament._id, { status: newStatus });
            loadTournaments();
        } catch (error) {
            console.error('Failed to update tournament:', error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <Clock className="w-5 h-5 text-blue-400" />;
            case 'active':
                return <Play className="w-5 h-5 text-green-400" />;
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-gray-400" />;
            case 'cancelled':
                return <X className="w-5 h-5 text-red-400" />;
            default:
                return <Calendar className="w-5 h-5 text-dark-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-dark-600 text-dark-300',
            scheduled: 'bg-blue-500/20 text-blue-400',
            active: 'bg-green-500/20 text-green-400',
            completed: 'bg-gray-500/20 text-gray-400',
            cancelled: 'bg-red-500/20 text-red-400',
        };
        return styles[status] || styles.draft;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex gap-2">
                    {['', 'draft', 'scheduled', 'active', 'completed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => { setStatusFilter(status); setPage(1); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === status
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                                }`}
                        >
                            {status ? t(`tournaments.${status}`) : 'All'}
                        </button>
                    ))}
                </div>
                {isAdmin && (
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus className="w-5 h-5 mr-2" />
                        {t('tournaments.create')}
                    </button>
                )}
            </div>

            {/* Tournaments List */}
            <div className="card p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : tournaments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                        <Calendar className="w-12 h-12 mb-4" />
                        <p>{t('common.noData')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-dark-700">
                        {tournaments.map((tournament) => (
                            <div key={tournament._id} className="p-6 hover:bg-dark-700/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-3 rounded-xl ${getStatusBadge(tournament.status)} bg-opacity-30`}>
                                            {getStatusIcon(tournament.status)}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-lg font-semibold text-white">{tournament.name}</h3>
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(tournament.status)}`}>
                                                    {t(`tournaments.${tournament.status}`)}
                                                </span>
                                            </div>
                                            {tournament.description && (
                                                <p className="text-dark-400 text-sm mt-1">{tournament.description}</p>
                                            )}
                                            <div className="flex items-center space-x-4 mt-3 text-sm">
                                                <span className="text-dark-500">
                                                    {t('tournaments.startDate')}: <span className="text-dark-300">{new Date(tournament.startDate).toLocaleDateString()}</span>
                                                </span>
                                                <span className="text-dark-500">
                                                    {t('tournaments.endDate')}: <span className="text-dark-300">{new Date(tournament.endDate).toLocaleDateString()}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {isAdmin && tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
                                        <div className="flex gap-2">
                                            {tournament.status === 'draft' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(tournament, 'scheduled')}
                                                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 transition-colors"
                                                >
                                                    Schedule
                                                </button>
                                            )}
                                            {tournament.status === 'scheduled' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(tournament, 'active')}
                                                    className="px-3 py-1.5 bg-green-500/20 text-green-400 text-sm rounded-lg hover:bg-green-500/30 transition-colors"
                                                >
                                                    Start
                                                </button>
                                            )}
                                            {tournament.status === 'active' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(tournament, 'completed')}
                                                    className="px-3 py-1.5 bg-gray-500/20 text-gray-400 text-sm rounded-lg hover:bg-gray-500/30 transition-colors"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleUpdateStatus(tournament, 'cancelled')}
                                                className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-6">{t('tournaments.create')}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">{t('tournaments.name')}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field h-24 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">{t('tournaments.startDate')}</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">{t('tournaments.endDate')}</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">Max Participants</label>
                                <input
                                    type="number"
                                    value={formData.maxParticipants}
                                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                                    className="input-field"
                                    min={2}
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
                                disabled={!formData.name || !formData.startDate || !formData.endDate}
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
