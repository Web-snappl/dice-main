import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../api/client';

interface AuditLog {
    _id: string;
    adminId: string;
    adminEmail: string;
    action: string;
    entityType: string;
    entityId?: string;
    description: string;
    beforeSnapshot?: any;
    afterSnapshot?: any;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
}

export function AuditLogPage() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    useEffect(() => {
        document.getElementById('page-title')!.textContent = t('auditLog.title');
        loadLogs();
    }, [t, page]);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const response = await api.getAuditLogs({ page, limit: 20 });
            setLogs(response.logs);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('CREATE') || action.includes('ACTIVATE')) return 'text-green-400';
        if (action.includes('DELETE') || action.includes('BAN') || action.includes('DEACTIVATE')) return 'text-red-400';
        if (action.includes('UPDATE') || action.includes('SUSPEND')) return 'text-yellow-400';
        return 'text-blue-400';
    };

    return (
        <div className="space-y-6">
            <div className="card p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                        <FileText className="w-12 h-12 mb-4" />
                        <p>{t('common.noData')}</p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-dark-700">
                            {logs.map((log) => (
                                <div key={log._id} className="hover:bg-dark-700/50 transition-colors">
                                    <div
                                        className="p-6 cursor-pointer"
                                        onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className={`font-mono text-sm font-bold ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-dark-600 text-dark-300 text-xs rounded">
                                                        {log.entityType}
                                                    </span>
                                                </div>
                                                <p className="text-white">{log.description}</p>
                                                <div className="flex items-center space-x-4 mt-2 text-sm text-dark-500">
                                                    <span>{t('auditLog.admin')}: <span className="text-dark-300">{log.adminEmail}</span></span>
                                                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <button className="p-2 hover:bg-dark-600 rounded-lg">
                                                {expandedLog === log._id ? (
                                                    <ChevronUp className="w-5 h-5 text-dark-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-dark-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedLog === log._id && (
                                        <div className="px-6 pb-6 pt-0">
                                            <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {log.beforeSnapshot && (
                                                        <div>
                                                            <p className="text-dark-500 text-sm mb-2">Before</p>
                                                            <pre className="text-xs text-dark-300 overflow-x-auto bg-dark-800 p-3 rounded">
                                                                {JSON.stringify(log.beforeSnapshot, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {log.afterSnapshot && (
                                                        <div>
                                                            <p className="text-dark-500 text-sm mb-2">After</p>
                                                            <pre className="text-xs text-green-400 overflow-x-auto bg-dark-800 p-3 rounded">
                                                                {JSON.stringify(log.afterSnapshot, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                                {log.ipAddress && (
                                                    <div className="mt-4 pt-4 border-t border-dark-700 text-sm text-dark-500">
                                                        <span>IP: {log.ipAddress}</span>
                                                        {log.userAgent && <span className="ml-4">Agent: {log.userAgent}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {total > 20 && (
                            <div className="px-6 py-4 border-t border-dark-700 flex items-center justify-between">
                                <p className="text-dark-400 text-sm">
                                    {t('common.showing')} {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} {t('common.of')} {total}
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
                                        disabled={page * 20 >= total}
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
        </div>
    );
}
