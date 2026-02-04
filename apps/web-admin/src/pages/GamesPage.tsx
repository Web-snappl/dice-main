import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Power, Settings, Percent, DollarSign, Users, RefreshCw, AlertTriangle, Save, Wrench } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface GameConfig {
    _id: string;
    gameId: string;
    name: string;
    description?: string;
    isActive: boolean;
    commissionRate: number;
    minBet: number;
    maxBet: number;
    minPlayers: number;
    maxPlayers: number;
    payoutMultiplier: number;
    dailyBetLimit: number | null;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    difficulty: string;
}

export function GamesPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const [games, setGames] = useState<GameConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingGame, setEditingGame] = useState<GameConfig | null>(null);
    const [formData, setFormData] = useState<Partial<GameConfig>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('games.title');
        loadGames();
    }, [t]);

    const loadGames = async () => {
        setIsLoading(true);
        try {
            const response = await api.getGameConfigs();
            if (response.games && response.games.length > 0) {
                setGames(response.games);
            } else {
                // Seed default configs if none exist
                await api.seedGameConfigs();
                const seededResponse = await api.getGameConfigs();
                setGames(seededResponse.games || []);
            }
        } catch (error) {
            console.error('Failed to load games:', error);
            // Try to seed on error
            try {
                await api.seedGameConfigs();
                const seededResponse = await api.getGameConfigs();
                setGames(seededResponse.games || []);
            } catch (seedError) {
                console.error('Failed to seed games:', seedError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (game: GameConfig) => {
        setEditingGame(game);
        setFormData({ ...game });
        setSaveSuccess(null);
    };

    const handleSave = async () => {
        if (!editingGame) return;
        setIsSaving(true);
        try {
            await api.updateGameConfig(editingGame.gameId, formData);
            setSaveSuccess('Configuration saved successfully!');
            loadGames();
            setTimeout(() => setSaveSuccess(null), 3000);
        } catch (error) {
            console.error('Failed to save game config:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleMaintenance = async (game: GameConfig) => {
        try {
            await api.updateGameConfig(game.gameId, {
                maintenanceMode: !game.maintenanceMode
            });
            loadGames();
        } catch (error) {
            console.error('Failed to toggle maintenance:', error);
        }
    };

    const handleToggleActive = async (game: GameConfig) => {
        try {
            await api.updateGameConfig(game.gameId, {
                isActive: !game.isActive
            });
            loadGames();
        } catch (error) {
            console.error('Failed to toggle active:', error);
        }
    };

    const getGameIcon = (gameId: string) => {
        return gameId === 'dice_duel' ? '🎲' : '🎰';
    };

    return (
        <div className="space-y-6">
            {/* Header with Seed Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Game Configuration</h2>
                <button
                    onClick={loadGames}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Games Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : games.length === 0 ? (
                <div className="card flex flex-col items-center justify-center h-64 text-dark-400">
                    <Gamepad2 className="w-12 h-12 mb-4" />
                    <p>No games configured</p>
                    <button onClick={loadGames} className="btn-primary mt-4">
                        Load Default Games
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {games.map((game) => (
                        <div key={game._id} className="card relative overflow-hidden">
                            {/* Status indicator */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${game.maintenanceMode ? 'bg-yellow-500' :
                                    game.isActive ? 'bg-green-500' : 'bg-red-500'
                                }`} />

                            {/* Header */}
                            <div className="flex items-start justify-between mt-2 mb-4">
                                <div className="flex items-center">
                                    <div className={`text-4xl mr-4`}>
                                        {getGameIcon(game.gameId)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{game.name}</h3>
                                        <p className="text-dark-400 text-sm">{game.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${game.isActive
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {game.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            {game.maintenanceMode && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                                                    Maintenance
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="bg-dark-700 rounded-lg p-3 text-center">
                                    <Percent className="w-5 h-5 mx-auto mb-1 text-primary-400" />
                                    <p className="text-2xl font-bold text-white">{game.commissionRate}%</p>
                                    <p className="text-xs text-dark-400">Commission</p>
                                </div>
                                <div className="bg-dark-700 rounded-lg p-3 text-center">
                                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                                    <p className="text-lg font-bold text-white">{game.minBet} - {game.maxBet}</p>
                                    <p className="text-xs text-dark-400">Bet Range</p>
                                </div>
                                <div className="bg-dark-700 rounded-lg p-3 text-center">
                                    <Users className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                                    <p className="text-2xl font-bold text-white">{game.minPlayers}-{game.maxPlayers}</p>
                                    <p className="text-xs text-dark-400">Players</p>
                                </div>
                                <div className="bg-dark-700 rounded-lg p-3 text-center">
                                    <span className="text-xl block mb-1">🏆</span>
                                    <p className="text-2xl font-bold text-white">{game.payoutMultiplier}x</p>
                                    <p className="text-xs text-dark-400">Payout</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isAdmin && (
                                <div className="flex gap-2 pt-4 border-t border-dark-700">
                                    <button
                                        onClick={() => handleEdit(game)}
                                        className="btn-secondary flex-1 text-sm"
                                    >
                                        <Settings className="w-4 h-4 mr-2 inline" />
                                        Configure
                                    </button>
                                    <button
                                        onClick={() => handleToggleMaintenance(game)}
                                        className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-colors ${game.maintenanceMode
                                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                            }`}
                                    >
                                        <Wrench className="w-4 h-4 inline mr-2" />
                                        {game.maintenanceMode ? 'End Maintenance' : 'Maintenance'}
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(game)}
                                        className={`px-4 py-2 rounded-lg transition-colors ${game.isActive
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            }`}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingGame && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="text-3xl">{getGameIcon(editingGame.gameId)}</span>
                            Configure {editingGame.name}
                        </h3>

                        {saveSuccess && (
                            <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg mb-4">
                                {saveSuccess}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Commission Rate */}
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                                    <Percent className="w-4 h-4" /> Commission Rate (%)
                                </label>
                                <input
                                    type="number"
                                    value={formData.commissionRate ?? 5}
                                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                                    className="input-field"
                                    min={0}
                                    max={50}
                                    step={0.5}
                                />
                                <p className="text-xs text-dark-500 mt-1">Platform fee deducted from winnings</p>
                            </div>

                            {/* Bet Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Min Bet</label>
                                    <input
                                        type="number"
                                        value={formData.minBet ?? 50}
                                        onChange={(e) => setFormData({ ...formData, minBet: parseInt(e.target.value) })}
                                        className="input-field"
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Max Bet</label>
                                    <input
                                        type="number"
                                        value={formData.maxBet ?? 10000}
                                        onChange={(e) => setFormData({ ...formData, maxBet: parseInt(e.target.value) })}
                                        className="input-field"
                                        min={1}
                                    />
                                </div>
                            </div>

                            {/* Player Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Min Players</label>
                                    <input
                                        type="number"
                                        value={formData.minPlayers ?? 2}
                                        onChange={(e) => setFormData({ ...formData, minPlayers: parseInt(e.target.value) })}
                                        className="input-field"
                                        min={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Max Players</label>
                                    <input
                                        type="number"
                                        value={formData.maxPlayers ?? 6}
                                        onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
                                        className="input-field"
                                        min={2}
                                    />
                                </div>
                            </div>

                            {/* Payout Multiplier */}
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">Payout Multiplier</label>
                                <input
                                    type="number"
                                    value={formData.payoutMultiplier ?? 2}
                                    onChange={(e) => setFormData({ ...formData, payoutMultiplier: parseFloat(e.target.value) })}
                                    className="input-field"
                                    min={1}
                                    max={10}
                                    step={0.1}
                                />
                                <p className="text-xs text-dark-500 mt-1">Win amount = Bet × Multiplier × (1 - Commission)</p>
                            </div>

                            {/* Daily Bet Limit */}
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">Daily Bet Limit (per user)</label>
                                <input
                                    type="number"
                                    value={formData.dailyBetLimit ?? ''}
                                    onChange={(e) => setFormData({ ...formData, dailyBetLimit: e.target.value ? parseInt(e.target.value) : null })}
                                    className="input-field"
                                    placeholder="No limit"
                                    min={0}
                                />
                                <p className="text-xs text-dark-500 mt-1">Leave empty for unlimited</p>
                            </div>

                            {/* Maintenance Message */}
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-400" /> Maintenance Message
                                </label>
                                <textarea
                                    value={formData.maintenanceMessage ?? ''}
                                    onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                                    className="input-field h-20 resize-none"
                                    placeholder="Shown when game is in maintenance mode..."
                                />
                            </div>

                            {/* Earnings Preview */}
                            <div className="bg-dark-700 rounded-lg p-4 mt-4">
                                <h4 className="text-sm font-medium text-dark-300 mb-2">Earnings Preview (100 bet)</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-dark-400">Total Pot:</span>
                                    <span className="text-white font-medium">200</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-dark-400">Platform Fee ({formData.commissionRate ?? 5}%):</span>
                                    <span className="text-yellow-400 font-medium">{((200 * (formData.commissionRate ?? 5)) / 100).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-dark-600 pt-2 mt-2">
                                    <span className="text-dark-400">Winner Payout:</span>
                                    <span className="text-green-400 font-medium">{(200 - (200 * (formData.commissionRate ?? 5)) / 100).toFixed(0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => setEditingGame(null)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn-primary"
                                disabled={isSaving}
                            >
                                <Save className="w-4 h-4 mr-2 inline" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
