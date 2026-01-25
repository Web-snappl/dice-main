import { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
import { Bell, Megaphone, Trash2, Edit2, Play, Pause, Send, Plus } from 'lucide-react';
import { api } from '../api/client';
import type { Announcement } from '../types/communication';

export function CommunicationPage() {
    // const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'announcements' | 'push'>('announcements');

    // Announcement State
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        target: 'all',
        isActive: true
    });

    // Push State
    const [pushData, setPushData] = useState({
        title: '',
        message: '',
        userId: ''
    });
    const [pushSending, setPushSending] = useState(false);

    useEffect(() => {
        document.getElementById('page-title')!.textContent = 'Communication Center';
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        setIsLoading(true);
        try {
            const res = await api.getAnnouncements({ limit: 50 });
            setAnnouncements(res.items);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAnnouncement = async () => {
        try {
            if (editingItem) {
                await api.updateAnnouncement(editingItem._id, formData);
            } else {
                await api.createAnnouncement(formData);
            }
            setShowModal(false);
            setEditingItem(null);
            setFormData({ title: '', message: '', type: 'info', target: 'all', isActive: true });
            loadAnnouncements();
        } catch (error) {
            console.error('Failed to save', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await api.deleteAnnouncement(id);
            loadAnnouncements();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const handleSendPush = async () => {
        if (!pushData.title || !pushData.message) return;
        setPushSending(true);
        try {
            await api.sendNotification(pushData);
            alert('Notification queued successfully!');
            setPushData({ title: '', message: '', userId: '' });
        } catch (error) {
            console.error('Failed to send push', error);
        } finally {
            setPushSending(false);
        }
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'maintenance': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'update': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-dark-600 text-dark-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-dark-700">
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'announcements' ? 'border-primary-500 text-primary-400' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
                >
                    <Megaphone className="w-4 h-4" /> Announcements
                </button>
                <button
                    onClick={() => setActiveTab('push')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'push' ? 'border-primary-500 text-primary-400' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
                >
                    <Bell className="w-4 h-4" /> Send Notification
                </button>
            </div>

            {activeTab === 'announcements' ? (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setFormData({ title: '', message: '', type: 'info', target: 'all', isActive: true });
                                setShowModal(true);
                            }}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4 mr-2" /> New Announcement
                        </button>
                    </div>

                    <div className="card overflow-hidden p-0">
                        {isLoading ? (
                            <div className="p-8 text-center text-dark-400">Loading...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-dark-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">Title</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">Target</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-700">
                                        {announcements.map((item) => (
                                            <tr key={item._id} className="hover:bg-dark-700/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">{item.title}</div>
                                                    <div className="text-sm text-dark-400 truncate max-w-xs">{item.message}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full border ${getBadgeColor(item.type)}`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-dark-300 text-sm capitalize">{item.target}</td>
                                                <td className="px-6 py-4">
                                                    {item.isActive ? (
                                                        <span className="text-green-400 text-xs flex items-center gap-1"><Play className="w-3 h-3" /> Active</span>
                                                    ) : (
                                                        <span className="text-dark-400 text-xs flex items-center gap-1"><Pause className="w-3 h-3" /> Inactive</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(item);
                                                            setFormData({
                                                                title: item.title,
                                                                message: item.message,
                                                                type: item.type as any,
                                                                target: item.target as any,
                                                                isActive: item.isActive
                                                            });
                                                            setShowModal(true);
                                                        }}
                                                        className="p-2 hover:bg-dark-600 rounded text-blue-400"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="p-2 hover:bg-dark-600 rounded text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-xl mx-auto card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Send Push Notification</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Title</label>
                            <input
                                value={pushData.title}
                                onChange={(e) => setPushData({ ...pushData, title: e.target.value })}
                                className="input-field"
                                placeholder="Notification Title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Message</label>
                            <textarea
                                value={pushData.message}
                                onChange={(e) => setPushData({ ...pushData, message: e.target.value })}
                                className="input-field h-24"
                                placeholder="Notification Body..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Target User ID (Optional)</label>
                            <input
                                value={pushData.userId}
                                onChange={(e) => setPushData({ ...pushData, userId: e.target.value })}
                                className="input-field"
                                placeholder="Leave empty to send to ALL users"
                            />
                            <p className="text-xs text-dark-400 mt-1">If blank, this will be a global broadcast.</p>
                        </div>
                        <div className="pt-4">
                            <button
                                onClick={handleSendPush}
                                disabled={pushSending || !pushData.title || !pushData.message}
                                className="btn-primary w-full flex justify-center items-center gap-2"
                            >
                                {pushSending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Notification</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingItem ? 'Edit Announcement' : 'New Announcement'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-1">Title</label>
                                <input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-1">Message</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="input-field h-24"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="update">Update</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-1">Target</label>
                                    <select
                                        value={formData.target}
                                        onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="android">Android Only</option>
                                        <option value="ios">iOS Only</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="rounded border-dark-600 bg-dark-700 text-primary-500"
                                />
                                <label htmlFor="isActive" className="text-white">Active immediately</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSaveAnnouncement} className="btn-primary">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
