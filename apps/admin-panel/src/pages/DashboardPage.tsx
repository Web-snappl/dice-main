import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Activity, Gamepad2, Flag, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../api/client';

interface DashboardData {
    users: {
        total: number;
        newToday: number;
        newThisWeek: number;
        activeToday: number;
        activeThisWeek: number;
    };
    games: {
        totalPlayed: number;
        playedToday: number;
        playedThisWeek: number;
    };
    notes?: {
        averagePlaytime?: string;
        sessionData?: string;
    };
}

interface ReportStats {
    open: number;
    inReview: number;
    resolved: number;
    total: number;
}

export function DashboardPage() {
    const { t } = useTranslation();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [reportStats, setReportStats] = useState<ReportStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = t('dashboard.title');
        loadData();
    }, [t]);

    const loadData = async () => {
        try {
            const [dashboardData, reportsData] = await Promise.all([
                api.getDashboard(),
                api.getReportStats().catch(() => ({ open: 0, inReview: 0, resolved: 0, total: 0 })),
            ]);
            setDashboard(dashboardData);
            setReportStats(reportsData);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    const stats = [
        {
            title: t('dashboard.totalUsers'),
            value: dashboard?.users?.total || 0,
            change: `+${dashboard?.users?.newThisWeek || 0}`,
            changeLabel: t('dashboard.newThisWeek'),
            icon: Users,
            trend: 'up',
            color: 'from-blue-500 to-blue-600',
        },
        {
            title: t('dashboard.activeToday'),
            value: dashboard?.users?.activeToday || 0,
            change: `${dashboard?.users?.activeThisWeek || 0}`,
            changeLabel: 'This week',
            icon: Activity,
            trend: 'up',
            color: 'from-green-500 to-green-600',
        },
        {
            title: t('dashboard.gamesPlayed'),
            value: dashboard?.games?.totalPlayed || 0,
            change: `+${dashboard?.games?.playedToday || 0}`,
            changeLabel: t('dashboard.playedToday'),
            icon: Gamepad2,
            trend: 'up',
            color: 'from-purple-500 to-purple-600',
        },
        {
            title: t('dashboard.openReports'),
            value: reportStats?.open || 0,
            change: `${reportStats?.inReview || 0}`,
            changeLabel: t('dashboard.pendingReview'),
            icon: Flag,
            trend: reportStats?.open && reportStats.open > 5 ? 'down' : 'up',
            color: 'from-orange-500 to-orange-600',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card relative overflow-hidden">
                        {/* Background gradient accent */}
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-8 -mt-8`}></div>

                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-dark-400 text-sm font-medium mb-1">{stat.title}</p>
                                <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                            </div>
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center text-sm">
                            {stat.trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                            )}
                            <span className={stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}>
                                {stat.change}
                            </span>
                            <span className="text-dark-500 ml-2">{stat.changeLabel}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Placeholder */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <a href="/users" className="flex items-center p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                            <Users className="w-5 h-5 text-primary-400 mr-3" />
                            <span className="text-dark-200">Manage Users</span>
                        </a>
                        <a href="/reports" className="flex items-center p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                            <Flag className="w-5 h-5 text-orange-400 mr-3" />
                            <span className="text-dark-200">Review Reports ({reportStats?.open || 0} open)</span>
                        </a>
                        <a href="/tournaments" className="flex items-center p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                            <Gamepad2 className="w-5 h-5 text-green-400 mr-3" />
                            <span className="text-dark-200">Manage Tournaments</span>
                        </a>
                    </div>
                </div>

                {/* Notes about data availability */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">Data Notes</h3>
                    <div className="space-y-4 text-sm">
                        {dashboard?.notes?.averagePlaytime && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-yellow-300 font-medium">Average Playtime</p>
                                <p className="text-dark-400 mt-1">{dashboard.notes.averagePlaytime}</p>
                            </div>
                        )}
                        {dashboard?.notes?.sessionData && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-yellow-300 font-medium">Session Data</p>
                                <p className="text-dark-400 mt-1">{dashboard.notes.sessionData}</p>
                            </div>
                        )}
                        <div className="p-3 bg-dark-700 rounded-lg">
                            <p className="text-dark-300">
                                Some metrics require additional event tracking to be implemented in the game client.
                                Cards showing "Requires event tracking" will become active once tracking is enabled.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
