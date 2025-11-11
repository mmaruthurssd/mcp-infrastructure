import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface StagedEmail {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  createdAt: string;
  approvedAt?: string;
  sentAt?: string;
  approvedBy?: string;

  // Email details
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

  // Metadata
  requestedBy: string; // "Claude Code" or user identifier
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

  // Message details
  type: 'google-chat' | 'slack';
  destination: string; // webhook URL or space ID
  message: string;

  // Metadata
  requestedBy: string;
  notes?: string;
}

export class StagingDatabase {
  private dbPath: string;
  private data: {
    emails: StagedEmail[];
    messages: StagedChatMessage[];
  };

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), '.mcp-data/staging-db.json');
    this.data = { emails: [], messages: [] };
  }

  async initialize() {
    try {
      const content = await fs.readFile(this.dbPath, 'utf-8');
      this.data = JSON.parse(content);
    } catch (error) {
      // File doesn't exist, create it
      await this.save();
    }
  }

  private async save() {
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  // Email methods
  async stageEmail(email: Omit<StagedEmail, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const id = randomUUID();
    const stagedEmail: StagedEmail = {
      ...email,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.emails.push(stagedEmail);
    await this.save();
    return id;
  }

  async getEmail(id: string): Promise<StagedEmail | undefined> {
    return this.data.emails.find(e => e.id === id);
  }

  async getAllEmails(status?: StagedEmail['status']): Promise<StagedEmail[]> {
    if (status) {
      return this.data.emails.filter(e => e.status === status);
    }
    return this.data.emails;
  }

  async approveEmail(id: string, approvedBy: string): Promise<void> {
    const email = this.data.emails.find(e => e.id === id);
    if (!email) throw new Error(`Email ${id} not found`);

    email.status = 'approved';
    email.approvedAt = new Date().toISOString();
    email.approvedBy = approvedBy;
    await this.save();
  }

  async rejectEmail(id: string, rejectedBy: string): Promise<void> {
    const email = this.data.emails.find(e => e.id === id);
    if (!email) throw new Error(`Email ${id} not found`);

    email.status = 'rejected';
    email.approvedBy = rejectedBy; // reuse field for "reviewed by"
    email.approvedAt = new Date().toISOString();
    await this.save();
  }

  async markEmailSent(id: string): Promise<void> {
    const email = this.data.emails.find(e => e.id === id);
    if (!email) throw new Error(`Email ${id} not found`);

    email.status = 'sent';
    email.sentAt = new Date().toISOString();
    await this.save();
  }

  async batchApproveEmails(ids: string[], approvedBy: string): Promise<void> {
    for (const id of ids) {
      await this.approveEmail(id, approvedBy);
    }
  }

  async updateEmailNotes(id: string, notes: string): Promise<void> {
    const email = this.data.emails.find(e => e.id === id);
    if (!email) throw new Error(`Email ${id} not found`);

    email.notes = notes;
    await this.save();
  }

  // Chat message methods
  async stageMessage(message: Omit<StagedChatMessage, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const id = randomUUID();
    const stagedMessage: StagedChatMessage = {
      ...message,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.messages.push(stagedMessage);
    await this.save();
    return id;
  }

  async getMessage(id: string): Promise<StagedChatMessage | undefined> {
    return this.data.messages.find(m => m.id === id);
  }

  async getAllMessages(status?: StagedChatMessage['status']): Promise<StagedChatMessage[]> {
    if (status) {
      return this.data.messages.filter(m => m.status === status);
    }
    return this.data.messages;
  }

  async approveMessage(id: string, approvedBy: string): Promise<void> {
    const message = this.data.messages.find(m => m.id === id);
    if (!message) throw new Error(`Message ${id} not found`);

    message.status = 'approved';
    message.approvedAt = new Date().toISOString();
    message.approvedBy = approvedBy;
    await this.save();
  }

  async rejectMessage(id: string, rejectedBy: string): Promise<void> {
    const message = this.data.messages.find(m => m.id === id);
    if (!message) throw new Error(`Message ${id} not found`);

    message.status = 'rejected';
    message.approvedBy = rejectedBy;
    message.approvedAt = new Date().toISOString();
    await this.save();
  }

  async markMessageSent(id: string): Promise<void> {
    const message = this.data.messages.find(m => m.id === id);
    if (!message) throw new Error(`Message ${id} not found`);

    message.status = 'sent';
    message.sentAt = new Date().toISOString();
    await this.save();
  }

  // Statistics
  async getStats() {
    return {
      emails: {
        total: this.data.emails.length,
        pending: this.data.emails.filter(e => e.status === 'pending').length,
        approved: this.data.emails.filter(e => e.status === 'approved').length,
        rejected: this.data.emails.filter(e => e.status === 'rejected').length,
        sent: this.data.emails.filter(e => e.status === 'sent').length,
      },
      messages: {
        total: this.data.messages.length,
        pending: this.data.messages.filter(m => m.status === 'pending').length,
        approved: this.data.messages.filter(m => m.status === 'approved').length,
        rejected: this.data.messages.filter(m => m.status === 'rejected').length,
        sent: this.data.messages.filter(m => m.status === 'sent').length,
      },
    };
  }
}
