import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Power, Plus, Edit2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface GameConfig {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
    minPlayers: number;
    maxPlayers: number;
    difficulty: string;
    mode?: string;
    createdAt: string;
}

export function GamesPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const [games, setGames] = useState<GameConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGame, setEditingGame] = useState<GameConfig | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        minPlayers: 2,
        maxPlayers: 10,
        difficulty: 'medium',
    });

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('games.title');
        loadGames();
    }, [t]);

    const loadGames = async () => {
        setIsLoading(true);
        try {
            const response = await api.getGames();
            setGames(response.games);
        } catch (error) {
            console.error('Failed to load games:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleActive = async (game: GameConfig) => {
        try {
            if (game.isActive) {
                await api.deactivateGame(game._id);
            } else {
                await api.activateGame(game._id);
            }
            loadGames();
        } catch (error) {
            console.error('Failed to toggle game:', error);
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingGame) {
                await api.updateGame(editingGame._id, formData);
            } else {
                await api.createGame(formData);
            }
            setShowModal(false);
            setEditingGame(null);
            setFormData({ name: '', description: '', minPlayers: 2, maxPlayers: 10, difficulty: 'medium' });
            loadGames();
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    };

    const openEditModal = (game: GameConfig) => {
        setEditingGame(game);
        setFormData({
            name: game.name,
            description: game.description || '',
            minPlayers: game.minPlayers,
            maxPlayers: game.maxPlayers,
            difficulty: game.difficulty,
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            {isAdmin && (
                <div className="flex justify-end">
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus className="w-5 h-5 mr-2" />
                        {t('games.create')}
                    </button>
                </div>
            )}

            {/* Games Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : games.length === 0 ? (
                <div className="card flex flex-col items-center justify-center h-64 text-dark-400">
                    <Gamepad2 className="w-12 h-12 mb-4" />
                    <p>{t('common.noData')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <div key={game._id} className="card relative overflow-hidden">
                            {/* Status indicator */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${game.isActive ? 'bg-green-500' : 'bg-dark-600'}`} />

                            <div className="flex items-start justify-between mt-2">
                                <div className="flex items-center">
                                    <div className={`p-3 rounded-xl ${game.isActive ? 'bg-primary-500/20' : 'bg-dark-600'} mr-4`}>
                                        <Gamepad2 className={`w-6 h-6 ${game.isActive ? 'text-primary-400' : 'text-dark-400'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{game.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${game.isActive
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-dark-600 text-dark-400'
                                            }`}>
                                            {game.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {game.description && (
                                <p className="text-dark-400 text-sm mt-4 line-clamp-2">{game.description}</p>
                            )}

                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-dark-700">
                                <div className="text-center">
                                    <p className="text-dark-500 text-xs">{t('games.minPlayers')}</p>
                                    <p className="text-white font-medium">{game.minPlayers}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-dark-500 text-xs">{t('games.maxPlayers')}</p>
                                    <p className="text-white font-medium">{game.maxPlayers}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-dark-500 text-xs">{t('games.difficulty')}</p>
                                    <p className="text-white font-medium capitalize">{game.difficulty}</p>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex gap-2 mt-4 pt-4 border-t border-dark-700">
                                    <button
                                        onClick={() => openEditModal(game)}
                                        className="btn-secondary flex-1 text-sm"
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        {t('users.edit')}
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(game)}
                                        className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-colors ${game.isActive
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            }`}
                                    >
                                        <Power className="w-4 h-4 inline mr-2" />
                                        {game.isActive ? t('games.deactivate') : t('games.activate')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-6">
                            {editingGame ? 'Edit Game' : t('games.create')}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">{t('games.name')}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">{t('games.description')}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field h-24 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">{t('games.minPlayers')}</label>
                                    <input
                                        type="number"
                                        value={formData.minPlayers}
                                        onChange={(e) => setFormData({ ...formData, minPlayers: parseInt(e.target.value) })}
                                        className="input-field"
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">{t('games.maxPlayers')}</label>
                                    <input
                                        type="number"
                                        value={formData.maxPlayers}
                                        onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
                                        className="input-field"
                                        min={2}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">{t('games.difficulty')}</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        {editingGame && <GameIssuesList gameId={editingGame._id} />}

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => { setShowModal(false); setEditingGame(null); }}
                                className="btn-secondary"
                            >
                                {t('common.cancel')}
                            </button>
                            <button onClick={handleSubmit} className="btn-primary" disabled={!formData.name}>
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple Issues Component
function GameIssuesList({ gameId }: { gameId: string }) {
    const [issues, setIssues] = useState<any[]>([]);
    const [newIssue, setNewIssue] = useState({ title: '', description: '', severity: 'medium' });

    useEffect(() => {
        api.getGameIssues(gameId).then(setIssues);
    }, [gameId]);

    const handleAdd = async () => {
        await api.createGameIssue(gameId, newIssue);
        setNewIssue({ title: '', description: '', severity: 'medium' });
        const updated = await api.getGameIssues(gameId);
        setIssues(updated);
    };

    return (
        <div className="mt-4 border-t border-dark-700 pt-4">
            <h4 className="font-bold text-white mb-2">Reported Issues</h4>
            <div className="space-y-2 mb-4">
                {issues.map(issue => (
                    <div key={issue._id} className="bg-dark-700 p-2 rounded text-sm flex justify-between">
                        <div>
                            <div className="font-bold text-white">{issue.title}</div>
                            <div className="text-dark-400">{issue.description}</div>
                        </div>
                        <div className={`text-xs uppercase px-2 py-1 rounded self-start ${issue.status === 'open' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                            }`}>
                            {issue.status}
                        </div>
                    </div>
                ))}
                {issues.length === 0 && <p className="text-dark-500 text-sm">No issues reported.</p>}
            </div>

            <div className="bg-dark-800 p-3 rounded">
                <input
                    className="input-field mb-2 text-sm"
                    placeholder="Issue Title"
                    value={newIssue.title}
                    onChange={e => setNewIssue({ ...newIssue, title: e.target.value })}
                />
                <textarea
                    className="input-field mb-2 text-sm h-16"
                    placeholder="Description..."
                    value={newIssue.description}
                    onChange={e => setNewIssue({ ...newIssue, description: e.target.value })}
                />
                <button onClick={handleAdd} className="btn-primary w-full text-sm">Report Issue</button>
            </div>
        </div>
    );
}
