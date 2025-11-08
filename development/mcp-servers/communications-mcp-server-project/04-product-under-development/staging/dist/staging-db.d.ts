export interface StagedEmail {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'sent';
    createdAt: string;
    approvedAt?: string;
    sentAt?: string;
    approvedBy?: string;
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    isHtml: boolean;
    attachments?: Array<{
        filename: string;
        path: string;
        size: number;
    }>;
    requestedBy: string;
    notes?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
}
export interface StagedChatMessage {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'sent';
    createdAt: string;
    approvedAt?: string;
    sentAt?: string;
    approvedBy?: string;
    type: 'google-chat' | 'slack';
    destination: string;
    message: string;
    requestedBy: string;
    notes?: string;
}
export declare class StagingDatabase {
    private dbPath;
    private data;
    constructor(dbPath?: string);
    initialize(): Promise<void>;
    private save;
    stageEmail(email: Omit<StagedEmail, 'id' | 'status' | 'createdAt'>): Promise<string>;
    getEmail(id: string): Promise<StagedEmail | undefined>;
    getAllEmails(status?: StagedEmail['status']): Promise<StagedEmail[]>;
    approveEmail(id: string, approvedBy: string): Promise<void>;
    rejectEmail(id: string, rejectedBy: string): Promise<void>;
    markEmailSent(id: string): Promise<void>;
    batchApproveEmails(ids: string[], approvedBy: string): Promise<void>;
    updateEmailNotes(id: string, notes: string): Promise<void>;
    stageMessage(message: Omit<StagedChatMessage, 'id' | 'status' | 'createdAt'>): Promise<string>;
    getMessage(id: string): Promise<StagedChatMessage | undefined>;
    getAllMessages(status?: StagedChatMessage['status']): Promise<StagedChatMessage[]>;
    approveMessage(id: string, approvedBy: string): Promise<void>;
    rejectMessage(id: string, rejectedBy: string): Promise<void>;
    markMessageSent(id: string): Promise<void>;
    getStats(): Promise<{
        emails: {
            total: number;
            pending: number;
            approved: number;
            rejected: number;
            sent: number;
        };
        messages: {
            total: number;
            pending: number;
            approved: number;
            rejected: number;
            sent: number;
        };
    }>;
}
