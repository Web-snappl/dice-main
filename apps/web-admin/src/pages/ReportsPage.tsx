import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

interface Report {
    _id: string;
    reporterId: string;
    reporterName?: string;
    reportedUserId: string;
    reportedUserName?: string;
    reason: string;
    description?: string;
    status: string;
    moderatorId?: string;
    moderatorName?: string;
    moderatorNotes?: string;
    resolution?: string;
    createdAt: string;
    resolvedAt?: string;
}

interface ReportStats {
    open: number;
    inReview: number;
    resolved: number;
    total: number;
}

export function ReportsPage() {
    const { t } = useTranslation();
    const [reports, setReports] = useState<Report[]>([]);
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [, setTotal] = useState(0);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [updateStatus, setUpdateStatus] = useState('');
    const [moderatorNotes, setModeratorNotes] = useState('');

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('reports.title');
        loadStats();
    }, [t]);

    useEffect(() => {
        loadReports();
    }, [page, statusFilter]);

    const loadStats = async () => {
        try {
            const statsData = await api.getReportStats();
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = { page, limit: 20 };
            if (statusFilter) params.status = statusFilter;

            const response = await api.getReports(params);
            setReports(response.reports);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateReport = async () => {
        if (!selectedReport || !updateStatus) return;

        try {
            await api.updateReport(selectedReport._id, {
                status: updateStatus,
                moderatorNotes,
            });
            setSelectedReport(null);
            setUpdateStatus('');
            setModeratorNotes('');
            loadReports();
            loadStats();
        } catch (error) {
            console.error('Failed to update report:', error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            case 'in_review':
                return <Clock className="w-5 h-5 text-yellow-400" />;
            case 'resolved':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            default:
                return <Flag className="w-5 h-5 text-dark-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            open: 'bg-red-500/20 text-red-400 border-red-500/30',
            in_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
        return styles[status] || styles.open;
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div
                        className={`card cursor-pointer transition-all ${statusFilter === '' ? 'ring-2 ring-primary-500' : ''}`}
                        onClick={() => { setStatusFilter(''); setPage(1); }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-400 text-sm">Total</p>
                                <p className="text-2xl font-bold text-white">{stats.total}</p>
                            </div>
                            <Flag className="w-8 h-8 text-dark-500" />
                        </div>
                    </div>
                    <div
                        className={`card cursor-pointer transition-all ${statusFilter === 'open' ? 'ring-2 ring-red-500' : ''}`}
                        onClick={() => { setStatusFilter('open'); setPage(1); }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-400 text-sm">{t('reports.open')}</p>
                                <p className="text-2xl font-bold text-red-400">{stats.open}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                    <div
                        className={`card cursor-pointer transition-all ${statusFilter === 'in_review' ? 'ring-2 ring-yellow-500' : ''}`}
                        onClick={() => { setStatusFilter('in_review'); setPage(1); }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-400 text-sm">{t('reports.inReview')}</p>
                                <p className="text-2xl font-bold text-yellow-400">{stats.inReview}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>
                    <div
                        className={`card cursor-pointer transition-all ${statusFilter === 'resolved' ? 'ring-2 ring-green-500' : ''}`}
                        onClick={() => { setStatusFilter('resolved'); setPage(1); }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-400 text-sm">{t('reports.resolved')}</p>
                                <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Reports List */}
            <div className="card p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                        <Flag className="w-12 h-12 mb-4" />
                        <p>{t('common.noData')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-dark-700">
                        {reports.map((report) => (
                            <div
                                key={report._id}
                                className="p-6 hover:bg-dark-700/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedReport(report)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        {getStatusIcon(report.status)}
                                        <div>
                                            <div className="flex items-center space-x-3 mb-1">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(report.status)}`}>
                                                    {report.status.replace('_', ' ')}
                                                </span>
                                                <span className="text-dark-500 text-sm">
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-white font-medium">{report.reason}</p>
                                            {report.description && (
                                                <p className="text-dark-400 text-sm mt-1 line-clamp-2">{report.description}</p>
                                            )}
                                            <div className="flex items-center space-x-4 mt-2 text-sm">
                                                <span className="text-dark-500">
                                                    {t('reports.reporter')}: <span className="text-dark-300">{report.reporterName || report.reporterId}</span>
                                                </span>
                                                <span className="text-dark-500">
                                                    {t('reports.reported')}: <span className="text-dark-300">{report.reportedUserName || report.reportedUserId}</span>
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

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Report Details</h3>
                            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(selectedReport.status)}`}>
                                {selectedReport.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <p className="text-dark-400 text-sm mb-1">{t('reports.reason')}</p>
                                <p className="text-white">{selectedReport.reason}</p>
                            </div>
                            {selectedReport.description && (
                                <div>
                                    <p className="text-dark-400 text-sm mb-1">Description</p>
                                    <p className="text-dark-200">{selectedReport.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-dark-400 text-sm mb-1">{t('reports.reporter')}</p>
                                    <p className="text-dark-200">{selectedReport.reporterName || selectedReport.reporterId}</p>
                                </div>
                                <div>
                                    <p className="text-dark-400 text-sm mb-1">{t('reports.reported')}</p>
                                    <p className="text-dark-200">{selectedReport.reportedUserName || selectedReport.reportedUserId}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-dark-400 text-sm mb-1">{t('reports.date')}</p>
                                <p className="text-dark-200">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                            </div>
                        </div>

                        {selectedReport.status !== 'resolved' && (
                            <div className="border-t border-dark-700 pt-6">
                                <h4 className="text-lg font-semibold text-white mb-4">{t('reports.updateStatus')}</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-2">New Status</label>
                                        <select
                                            value={updateStatus}
                                            onChange={(e) => setUpdateStatus(e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="">Select status...</option>
                                            <option value="in_review">{t('reports.inReview')}</option>
                                            <option value="resolved">{t('reports.resolved')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-2">Moderator Notes</label>
                                        <textarea
                                            value={moderatorNotes}
                                            onChange={(e) => setModeratorNotes(e.target.value)}
                                            className="input-field h-24 resize-none"
                                            placeholder="Add notes..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => { setSelectedReport(null); setUpdateStatus(''); setModeratorNotes(''); }}
                                className="btn-secondary"
                            >
                                {t('common.cancel')}
                            </button>
                            {selectedReport.status !== 'resolved' && (
                                <button
                                    onClick={handleUpdateReport}
                                    className="btn-primary"
                                    disabled={!updateStatus}
                                >
                                    {t('common.save')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
