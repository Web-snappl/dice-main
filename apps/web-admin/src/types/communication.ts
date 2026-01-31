export interface Announcement {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'maintenance' | 'update';
    target: 'all' | 'user' | 'android' | 'ios';
    targetUserId?: string;
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
    createdBy: string;
}

export interface TicketMessage {
    senderId: string;
    senderType: 'user' | 'admin' | 'system';
    message: string;
    attachments: string[];
    createdAt: string;
    readAt?: string;
}

export interface SupportTicket {
    _id: string;
    userId: string;
    userEmail?: string;
    subject: string;
    category: 'account' | 'technical' | 'billing' | 'report' | 'other';
    status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    messages: TicketMessage[];
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SupportStats {
    total: number;
    open: number;
    critical: number;
    byCategory: { _id: string; count: number }[];
}
