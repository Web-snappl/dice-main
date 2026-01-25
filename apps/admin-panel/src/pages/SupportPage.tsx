import { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
import { MessageSquare, AlertCircle, Clock, User, Send } from 'lucide-react';
import { api } from '../api/client';
import type { SupportTicket, SupportStats } from '../types/communication';

export function SupportPage() {
    // const { t } = useTranslation();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [stats, setStats] = useState<SupportStats | null>(null);
    // const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        document.getElementById('page-title')!.textContent = 'Support Tickets';
        loadData();
    }, [statusFilter]);

    const loadData = async () => {
        // setIsLoading(true);
        try {
            const [ticketRes, statsRes] = await Promise.all([
                api.getTickets({ status: statusFilter, limit: 50 }),
                api.getTicketStats()
            ]);
            setTickets(ticketRes.items);
            setStats(statsRes);
        } catch (error) {
            console.error(error);
        } finally {
            // setIsLoading(false);
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyText) return;
        try {
            await api.replyToTicket(selectedTicket._id, replyText);
            setReplyText('');
            // Refresh detailed ticket
            const updated = await api.getTicket(selectedTicket._id);
            setSelectedTicket(updated);
            // Refresh list
            loadData();
        } catch (error) {
            console.error('Failed to reply', error);
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!selectedTicket) return;
        try {
            const updated = await api.updateTicketStatus(selectedTicket._id, status);
            setSelectedTicket(updated);
            loadData();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-dark-400 bg-dark-500/10 border-dark-500/20';
        }
    };

    return (
        <div className="flex h-[calc(100vh-10rem)] gap-6">
            {/* Ticket List */}
            <div className={`flex-1 flex flex-col gap-4 ${selectedTicket ? 'hidden md:flex' : ''}`}>
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="card p-4 flex items-center justify-between">
                        <div>
                            <div className="text-dark-400 text-xs uppercase">Total Tickets</div>
                            <div className="text-2xl font-bold text-white">{stats?.total || 0}</div>
                        </div>
                        <MessageSquare className="text-primary-500 w-8 h-8 opacity-50" />
                    </div>
                    <div className="card p-4 flex items-center justify-between">
                        <div>
                            <div className="text-dark-400 text-xs uppercase">Open</div>
                            <div className="text-2xl font-bold text-white">{stats?.open || 0}</div>
                        </div>
                        <Clock className="text-yellow-500 w-8 h-8 opacity-50" />
                    </div>
                    <div className="card p-4 flex items-center justify-between">
                        <div>
                            <div className="text-dark-400 text-xs uppercase">Critical</div>
                            <div className="text-2xl font-bold text-white">{stats?.critical || 0}</div>
                        </div>
                        <AlertCircle className="text-red-500 w-8 h-8 opacity-50" />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field max-w-xs"
                    >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                {/* List */}
                <div className="card flex-1 overflow-hidden p-0 flex flex-col">
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {tickets.map(ticket => (
                            <div
                                key={ticket._id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedTicket?._id === ticket._id
                                    ? 'bg-primary-500/10 border-primary-500/50'
                                    : 'bg-dark-700/30 border-dark-700 hover:bg-dark-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white line-clamp-1">{ticket.subject}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-dark-400">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ticket.userEmail || ticket.userId.substring(0, 8)}</span>
                                    <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-green-500' : 'bg-dark-500'}`} />
                                    <span className="text-xs uppercase text-dark-300">{ticket.status.replace('_', ' ')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ticket Detail */}
            {selectedTicket ? (
                <div className="w-full md:w-[600px] card flex flex-col h-full overflow-hidden p-0">
                    {/* Header */}
                    <div className="p-4 border-b border-dark-700 bg-dark-800 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <button onClick={() => setSelectedTicket(null)} className="md:hidden text-dark-400 mr-2">←</button>
                                <h3 className="font-bold text-lg text-white">{selectedTicket.subject}</h3>
                            </div>
                            <div className="text-sm text-dark-400">
                                Ref: {selectedTicket._id} • {selectedTicket.category}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <select
                                value={selectedTicket.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="bg-dark-900 border border-dark-600 rounded px-2 py-1 text-xs text-white"
                            >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="waiting_user">Waiting User</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/50">
                        {/* Initial User Message (simulated as first message if exists, or separate field) */}
                        {selectedTicket.messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col max-w-[85%] ${msg.senderType === 'admin' ? 'self-end items-end ml-auto' : 'self-start items-start'}`}
                            >
                                <div className={`p-3 rounded-xl text-sm ${msg.senderType === 'admin'
                                    ? 'bg-primary-600 text-white rounded-br-none'
                                    : 'bg-dark-700 text-dark-100 rounded-bl-none'
                                    }`}>
                                    {msg.message}
                                </div>
                                <span className="text-[10px] text-dark-500 mt-1">
                                    {msg.senderType === 'admin' ? 'Agent' : 'User'} • {new Date(msg.createdAt).toLocaleString()}
                                </span>
                            </div>
                        ))}

                        {selectedTicket.messages.length === 0 && (
                            <div className="text-center text-dark-500 italic mt-10">No messages yet.</div>
                        )}
                    </div>

                    {/* Reply Input */}
                    <div className="p-4 bg-dark-800 border-t border-dark-700">
                        <div className="flex gap-2">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="input-field flex-1 h-20 resize-none py-2"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleReply();
                                    }
                                }}
                            />
                            <button
                                onClick={handleReply}
                                disabled={!replyText.trim()}
                                className="btn-primary h-auto px-4"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 card items-center justify-center text-dark-400 bg-dark-800/50 border-dashed">
                    <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Select a ticket to view details</p>
                    </div>
                </div>
            )}
        </div>
    );
}
