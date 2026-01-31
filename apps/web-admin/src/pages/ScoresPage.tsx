import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, AlertTriangle, Medal } from 'lucide-react';
import { api } from '../api/client';

interface RankingEntry {
    rank: number;
    userId: string;
    displayName: string;
    totalWins: number;
    totalGames: number;
    winRate: number;
}

interface SuspiciousScore {
    userId: string;
    displayName: string;
    totalWins: number;
    totalGames: number;
    winRate: number;
    flagReason: string;
    flaggedAt: string;
}

export function ScoresPage() {
    const { t } = useTranslation();
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [suspiciousScores, setSuspiciousScores] = useState<SuspiciousScore[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState('global');
    const [activeTab, setActiveTab] = useState<'rankings' | 'suspicious'>('rankings');

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('scores.title');
        loadData();
    }, [t, period]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [rankingsData, suspiciousData] = await Promise.all([
                api.getRankings({ period }),
                api.getSuspiciousScores().catch(() => []),
            ]);
            setRankings(rankingsData);
            setSuspiciousScores(suspiciousData);
        } catch (error) {
            console.error('Failed to load scores:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
        if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
        if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800';
        return 'bg-dark-600';
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex space-x-4 border-b border-dark-700">
                <button
                    onClick={() => setActiveTab('rankings')}
                    className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'rankings'
                        ? 'text-primary-400 border-primary-400'
                        : 'text-dark-400 border-transparent hover:text-white'
                        }`}
                >
                    <Trophy className="w-5 h-5 inline mr-2" />
                    {t('scores.rankings')}
                </button>
                <button
                    onClick={() => setActiveTab('suspicious')}
                    className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'suspicious'
                        ? 'text-orange-400 border-orange-400'
                        : 'text-dark-400 border-transparent hover:text-white'
                        }`}
                >
                    <AlertTriangle className="w-5 h-5 inline mr-2" />
                    {t('scores.suspicious')}
                    {suspiciousScores.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                            {suspiciousScores.length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'rankings' && (
                <>
                    {/* Period Filter */}
                    <div className="flex justify-end">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="input-field w-48"
                        >
                            <option value="global">{t('scores.global')}</option>
                            <option value="weekly">{t('scores.weekly')}</option>
                            <option value="monthly">{t('scores.monthly')}</option>
                        </select>
                    </div>

                    {/* Rankings Table */}
                    <div className="card p-0 overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                            </div>
                        ) : rankings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                                <Trophy className="w-12 h-12 mb-4" />
                                <p>{t('common.noData')}</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-dark-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">{t('scores.rank')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">{t('scores.player')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase">{t('scores.wins')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase">{t('scores.games')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase">{t('scores.winRate')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {rankings.map((entry) => (
                                        <tr key={entry.userId} className="hover:bg-dark-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadge(entry.rank)}`}>
                                                        {entry.rank <= 3 ? <Medal className="w-4 h-4" /> : entry.rank}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-white font-medium">{entry.displayName}</p>
                                                <p className="text-dark-500 text-xs">{entry.userId}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right text-green-400 font-medium">{entry.totalWins}</td>
                                            <td className="px-6 py-4 text-right text-dark-300">{entry.totalGames}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-medium ${entry.winRate >= 50 ? 'text-green-400' : 'text-dark-300'}`}>
                                                    {entry.winRate.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'suspicious' && (
                <div className="card p-0 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        </div>
                    ) : suspiciousScores.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                            <AlertTriangle className="w-12 h-12 mb-4" />
                            <p>No suspicious activity detected</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-dark-700">
                            {suspiciousScores.map((entry) => (
                                <div key={entry.userId} className="p-6 hover:bg-dark-700/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-white font-medium">{entry.displayName}</p>
                                            <p className="text-dark-500 text-sm">{entry.userId}</p>
                                            <div className="mt-2 flex items-center space-x-4 text-sm">
                                                <span className="text-dark-400">Wins: <span className="text-green-400">{entry.totalWins}</span></span>
                                                <span className="text-dark-400">Games: <span className="text-dark-300">{entry.totalGames}</span></span>
                                                <span className="text-dark-400">Win Rate: <span className="text-red-400 font-bold">{entry.winRate.toFixed(1)}%</span></span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full">
                                                {entry.flagReason}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
