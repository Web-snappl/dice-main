export class Announcement {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'maintenance' | 'update';
    target: 'all' | 'user' | 'android' | 'ios';
    targetUserId?: string;
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    createdBy: string;
}

export class SupportTicket {
    userId: string;
    userEmail: string;
    subject: string;
    category: 'account' | 'technical' | 'billing' | 'report' | 'other';
    status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    messages: TicketMessage[];
    assignedTo?: string; // Admin ID
    createdAt: Date;
    updatedAt: Date;
}

export class TicketMessage {
    senderId: string;
    senderType: 'user' | 'admin' | 'system';
    message: string;
    attachments?: string[];
    createdAt: Date;
    readAt?: Date;
}
