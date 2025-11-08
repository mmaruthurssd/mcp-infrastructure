import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
export class StagingDatabase {
    dbPath;
    data;
    constructor(dbPath) {
        this.dbPath = dbPath || path.join(process.cwd(), '.mcp-data/staging-db.json');
        this.data = { emails: [], messages: [] };
    }
    async initialize() {
        try {
            const content = await fs.readFile(this.dbPath, 'utf-8');
            this.data = JSON.parse(content);
        }
        catch (error) {
            // File doesn't exist, create it
            await this.save();
        }
    }
    async save() {
        await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
    }
    // Email methods
    async stageEmail(email) {
        const id = randomUUID();
        const stagedEmail = {
            ...email,
            id,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };
        this.data.emails.push(stagedEmail);
        await this.save();
        return id;
    }
    async getEmail(id) {
        return this.data.emails.find(e => e.id === id);
    }
    async getAllEmails(status) {
        if (status) {
            return this.data.emails.filter(e => e.status === status);
        }
        return this.data.emails;
    }
    async approveEmail(id, approvedBy) {
        const email = this.data.emails.find(e => e.id === id);
        if (!email)
            throw new Error(`Email ${id} not found`);
        email.status = 'approved';
        email.approvedAt = new Date().toISOString();
        email.approvedBy = approvedBy;
        await this.save();
    }
    async rejectEmail(id, rejectedBy) {
        const email = this.data.emails.find(e => e.id === id);
        if (!email)
            throw new Error(`Email ${id} not found`);
        email.status = 'rejected';
        email.approvedBy = rejectedBy; // reuse field for "reviewed by"
        email.approvedAt = new Date().toISOString();
        await this.save();
    }
    async markEmailSent(id) {
        const email = this.data.emails.find(e => e.id === id);
        if (!email)
            throw new Error(`Email ${id} not found`);
        email.status = 'sent';
        email.sentAt = new Date().toISOString();
        await this.save();
    }
    async batchApproveEmails(ids, approvedBy) {
        for (const id of ids) {
            await this.approveEmail(id, approvedBy);
        }
    }
    async updateEmailNotes(id, notes) {
        const email = this.data.emails.find(e => e.id === id);
        if (!email)
            throw new Error(`Email ${id} not found`);
        email.notes = notes;
        await this.save();
    }
    // Chat message methods
    async stageMessage(message) {
        const id = randomUUID();
        const stagedMessage = {
            ...message,
            id,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };
        this.data.messages.push(stagedMessage);
        await this.save();
        return id;
    }
    async getMessage(id) {
        return this.data.messages.find(m => m.id === id);
    }
    async getAllMessages(status) {
        if (status) {
            return this.data.messages.filter(m => m.status === status);
        }
        return this.data.messages;
    }
    async approveMessage(id, approvedBy) {
        const message = this.data.messages.find(m => m.id === id);
        if (!message)
            throw new Error(`Message ${id} not found`);
        message.status = 'approved';
        message.approvedAt = new Date().toISOString();
        message.approvedBy = approvedBy;
        await this.save();
    }
    async rejectMessage(id, rejectedBy) {
        const message = this.data.messages.find(m => m.id === id);
        if (!message)
            throw new Error(`Message ${id} not found`);
        message.status = 'rejected';
        message.approvedBy = rejectedBy;
        message.approvedAt = new Date().toISOString();
        await this.save();
    }
    async markMessageSent(id) {
        const message = this.data.messages.find(m => m.id === id);
        if (!message)
            throw new Error(`Message ${id} not found`);
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
