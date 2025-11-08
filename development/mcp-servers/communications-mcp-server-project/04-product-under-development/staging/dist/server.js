#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { StagingDatabase } from './staging-db.js';
class CommunicationsServer {
    server;
    gmail;
    chat;
    stagingDb;
    stagingEnabled;
    constructor() {
        this.server = new Server({
            name: 'communications-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        // Enable staging by default, can be disabled via env var
        this.stagingEnabled = process.env.STAGING_ENABLED !== 'false';
        this.stagingDb = new StagingDatabase(process.env.STAGING_DB_PATH);
        this.setupToolHandlers();
        this.initializeGoogleAPIs();
    }
    async initialize() {
        await this.stagingDb.initialize();
    }
    initializeGoogleAPIs() {
        // Initialize OAuth2 client if credentials are provided
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'urn:ietf:wg:oauth:2.0:oob' // For installed apps
            );
            if (process.env.GOOGLE_REFRESH_TOKEN) {
                oauth2Client.setCredentials({
                    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
                });
            }
            this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            this.chat = google.chat({ version: 'v1', auth: oauth2Client });
        }
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: this.getTools(),
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    // Direct send tools
                    case 'send_email_gmail':
                        return await this.sendGmailEmail(args);
                    case 'send_email_smtp':
                        return await this.sendSMTPEmail(args);
                    case 'send_google_chat_message':
                        return await this.sendGoogleChatMessage(args);
                    case 'send_google_chat_webhook':
                        return await this.sendGoogleChatWebhook(args);
                    // Staging tools
                    case 'stage_email':
                        return await this.stageEmail(args);
                    case 'stage_chat_message':
                        return await this.stageChatMessage(args);
                    case 'list_staged_emails':
                        return await this.listStagedEmails(args);
                    case 'list_staged_messages':
                        return await this.listStagedMessages(args);
                    case 'approve_email':
                        return await this.approveEmail(args);
                    case 'reject_email':
                        return await this.rejectEmail(args);
                    case 'approve_message':
                        return await this.approveMessage(args);
                    case 'batch_approve_emails':
                        return await this.batchApproveEmails(args);
                    case 'send_approved_emails':
                        return await this.sendApprovedEmails();
                    case 'get_staging_stats':
                        return await this.getStagingStats();
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    getTools() {
        const tools = [
            // Staging tools (shown first for visibility)
            {
                name: 'stage_email',
                description: 'Stage an email for review before sending. Email will be saved and require approval.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        to: { type: 'string', description: 'Recipient email address' },
                        from: { type: 'string', description: 'Sender email (or account identifier)' },
                        subject: { type: 'string', description: 'Email subject line' },
                        body: { type: 'string', description: 'Email body (supports HTML)' },
                        cc: { type: 'string', description: 'CC email addresses (comma-separated)' },
                        bcc: { type: 'string', description: 'BCC email addresses (comma-separated)' },
                        isHtml: { type: 'boolean', description: 'Whether body contains HTML' },
                        priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Email priority' },
                        notes: { type: 'string', description: 'Internal notes about this email' },
                    },
                    required: ['to', 'subject', 'body'],
                },
            },
            {
                name: 'list_staged_emails',
                description: 'List all staged emails, optionally filtered by status',
                inputSchema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'sent'], description: 'Filter by status' },
                    },
                },
            },
            {
                name: 'approve_email',
                description: 'Approve a staged email for sending',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Email ID' },
                        approvedBy: { type: 'string', description: 'Name of approver' },
                    },
                    required: ['id', 'approvedBy'],
                },
            },
            {
                name: 'reject_email',
                description: 'Reject a staged email',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Email ID' },
                        rejectedBy: { type: 'string', description: 'Name of reviewer' },
                    },
                    required: ['id', 'rejectedBy'],
                },
            },
            {
                name: 'batch_approve_emails',
                description: 'Approve multiple staged emails at once',
                inputSchema: {
                    type: 'object',
                    properties: {
                        ids: { type: 'array', items: { type: 'string' }, description: 'Array of email IDs' },
                        approvedBy: { type: 'string', description: 'Name of approver' },
                    },
                    required: ['ids', 'approvedBy'],
                },
            },
            {
                name: 'send_approved_emails',
                description: 'Send all approved emails that haven\'t been sent yet',
                inputSchema: { type: 'object', properties: {} },
            },
            {
                name: 'get_staging_stats',
                description: 'Get statistics about staged emails and messages',
                inputSchema: { type: 'object', properties: {} },
            },
            {
                name: 'stage_chat_message',
                description: 'Stage a chat message for review before sending',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['google-chat', 'slack'], description: 'Chat platform type' },
                        destination: { type: 'string', description: 'Webhook URL or space ID' },
                        message: { type: 'string', description: 'Message text' },
                        notes: { type: 'string', description: 'Internal notes' },
                    },
                    required: ['type', 'destination', 'message'],
                },
            },
            {
                name: 'list_staged_messages',
                description: 'List all staged chat messages',
                inputSchema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'sent'] },
                    },
                },
            },
            {
                name: 'approve_message',
                description: 'Approve a staged chat message',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Message ID' },
                        approvedBy: { type: 'string', description: 'Name of approver' },
                    },
                    required: ['id', 'approvedBy'],
                },
            },
            // Direct send tools
            {
                name: 'send_email_gmail',
                description: 'Send an email using Gmail API (requires OAuth setup)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        to: {
                            type: 'string',
                            description: 'Recipient email address',
                        },
                        subject: {
                            type: 'string',
                            description: 'Email subject line',
                        },
                        body: {
                            type: 'string',
                            description: 'Email body (supports HTML)',
                        },
                        cc: {
                            type: 'string',
                            description: 'CC email addresses (comma-separated)',
                        },
                        bcc: {
                            type: 'string',
                            description: 'BCC email addresses (comma-separated)',
                        },
                    },
                    required: ['to', 'subject', 'body'],
                },
            },
            {
                name: 'send_email_smtp',
                description: 'Send an email using SMTP (simpler setup, works with any email provider)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        to: {
                            type: 'string',
                            description: 'Recipient email address',
                        },
                        subject: {
                            type: 'string',
                            description: 'Email subject line',
                        },
                        body: {
                            type: 'string',
                            description: 'Email body (supports HTML)',
                        },
                        cc: {
                            type: 'string',
                            description: 'CC email addresses (comma-separated)',
                        },
                        isHtml: {
                            type: 'boolean',
                            description: 'Whether the body contains HTML',
                        },
                    },
                    required: ['to', 'subject', 'body'],
                },
            },
            {
                name: 'send_google_chat_message',
                description: 'Send a message to Google Chat using the Chat API (requires OAuth)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        space: {
                            type: 'string',
                            description: 'Google Chat space ID (e.g., spaces/AAAAAAAAAAA)',
                        },
                        message: {
                            type: 'string',
                            description: 'Message text to send',
                        },
                        thread: {
                            type: 'string',
                            description: 'Optional thread ID to reply to',
                        },
                    },
                    required: ['space', 'message'],
                },
            },
            {
                name: 'send_google_chat_webhook',
                description: 'Send a message to Google Chat using a webhook URL (simplest method)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        webhookUrl: {
                            type: 'string',
                            description: 'Google Chat webhook URL',
                        },
                        message: {
                            type: 'string',
                            description: 'Message text to send',
                        },
                    },
                    required: ['webhookUrl', 'message'],
                },
            },
        ];
        return tools;
    }
    async sendGmailEmail(args) {
        if (!this.gmail) {
            throw new Error('Gmail API not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN');
        }
        const { to, subject, body, cc, bcc } = args;
        // Create email message
        const message = [
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `To: ${to}`,
            cc ? `Cc: ${cc}` : '',
            bcc ? `Bcc: ${bcc}` : '',
            `Subject: ${subject}`,
            '',
            body,
        ].filter(Boolean).join('\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const response = await this.gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        return {
            content: [
                {
                    type: 'text',
                    text: `✓ Email sent successfully via Gmail!\nMessage ID: ${response.data.id}\nTo: ${to}\nSubject: ${subject}`,
                },
            ],
        };
    }
    async sendSMTPEmail(args) {
        const { to, subject, body, cc, isHtml = false } = args;
        // Configure SMTP transport
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            cc,
            subject,
            [isHtml ? 'html' : 'text']: body,
        };
        const info = await transporter.sendMail(mailOptions);
        return {
            content: [
                {
                    type: 'text',
                    text: `✓ Email sent successfully via SMTP!\nMessage ID: ${info.messageId}\nTo: ${to}\nSubject: ${subject}`,
                },
            ],
        };
    }
    async sendGoogleChatMessage(args) {
        if (!this.chat) {
            throw new Error('Google Chat API not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN');
        }
        const { space, message, thread } = args;
        const requestBody = {
            text: message,
        };
        if (thread) {
            requestBody.thread = { name: thread };
        }
        const response = await this.chat.spaces.messages.create({
            parent: space,
            requestBody,
        });
        return {
            content: [
                {
                    type: 'text',
                    text: `✓ Google Chat message sent successfully!\nMessage: ${response.data.name}\nSpace: ${space}`,
                },
            ],
        };
    }
    async sendGoogleChatWebhook(args) {
        const { webhookUrl, message } = args;
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: message,
            }),
        });
        if (!response.ok) {
            throw new Error(`Webhook request failed: ${response.statusText}`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `✓ Google Chat webhook message sent successfully!\nMessage: "${message}"`,
                },
            ],
        };
    }
    // Staging methods
    async stageEmail(args) {
        const { to, from, subject, body, cc, bcc, isHtml = false, priority = 'normal', notes } = args;
        const id = await this.stagingDb.stageEmail({
            from: from || process.env.SMTP_FROM || process.env.SMTP_USER || 'unknown',
            to,
            cc,
            bcc,
            subject,
            body,
            isHtml,
            priority,
            notes,
            requestedBy: 'Claude Code',
        });
        return {
            content: [
                {
                    type: 'text',
                    text: `✓ Email staged for review!\n\nID: ${id}\nTo: ${to}\nSubject: ${subject}\n\nThe email has been saved and is pending approval. Review it at: http://localhost:3001/review`,
                },
            ],
        };
    }
    async stageChatMessage(args) {
        const { type, destination, message, notes } = args;
        const id = await this.stagingDb.stageMessage({
            type,
            destination,
            message,
            notes,
            requestedBy: 'Claude Code',
        });
        return {
            content: [
                {
                    type: 'text',
                    text: `✓ Chat message staged for review!\n\nID: ${id}\nType: ${type}\nMessage: "${message}"\n\nReview at: http://localhost:3001/review`,
                },
            ],
        };
    }
    async listStagedEmails(args) {
        const { status } = args;
        const emails = await this.stagingDb.getAllEmails(status);
        if (emails.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: status ? `No ${status} emails found.` : 'No staged emails found.',
                    },
                ],
            };
        }
        const emailList = emails.map(e => `[${e.status.toUpperCase()}] ${e.id.slice(0, 8)}\n` +
            `  To: ${e.to}\n` +
            `  Subject: ${e.subject}\n` +
            `  Created: ${new Date(e.createdAt).toLocaleString()}\n` +
            (e.priority && e.priority !== 'normal' ? `  Priority: ${e.priority}\n` : '') +
            (e.notes ? `  Notes: ${e.notes}\n` : '')).join('\n');
        return {
            content: [
                {
                    type: 'text',
                    text: `Staged Emails (${emails.length}):\n\n${emailList}\n\nReview at: http://localhost:3001/review`,
                },
            ],
        };
    }
    async listStagedMessages(args) {
        const { status } = args;
        const messages = await this.stagingDb.getAllMessages(status);
        if (messages.length === 0) {
            return {
                content: [{ type: 'text', text: status ? `No ${status} messages found.` : 'No staged messages found.' }],
            };
        }
        const messageList = messages.map(m => `[${m.status.toUpperCase()}] ${m.id.slice(0, 8)} - ${m.type}\n` +
            `  Message: "${m.message}"\n` +
            `  Created: ${new Date(m.createdAt).toLocaleString()}`).join('\n\n');
        return {
            content: [{ type: 'text', text: `Staged Messages (${messages.length}):\n\n${messageList}` }],
        };
    }
    async approveEmail(args) {
        const { id, approvedBy } = args;
        await this.stagingDb.approveEmail(id, approvedBy);
        return {
            content: [
                {
                    type: 'text',
                    text: `✓ Email ${id.slice(0, 8)} approved by ${approvedBy}!\n\nUse 'send_approved_emails' to send all approved emails.`,
                },
            ],
        };
    }
    async rejectEmail(args) {
        const { id, rejectedBy } = args;
        await this.stagingDb.rejectEmail(id, rejectedBy);
        return {
            content: [{ type: 'text', text: `✓ Email ${id.slice(0, 8)} rejected by ${rejectedBy}.` }],
        };
    }
    async approveMessage(args) {
        const { id, approvedBy } = args;
        await this.stagingDb.approveMessage(id, approvedBy);
        return {
            content: [{ type: 'text', text: `✓ Message ${id.slice(0, 8)} approved by ${approvedBy}!` }],
        };
    }
    async batchApproveEmails(args) {
        const { ids, approvedBy } = args;
        await this.stagingDb.batchApproveEmails(ids, approvedBy);
        return {
            content: [
                {
                    type: 'text',
                    text: `✓ Batch approved ${ids.length} emails by ${approvedBy}!\n\nUse 'send_approved_emails' to send them.`,
                },
            ],
        };
    }
    async sendApprovedEmails() {
        const approvedEmails = await this.stagingDb.getAllEmails('approved');
        if (approvedEmails.length === 0) {
            return {
                content: [{ type: 'text', text: 'No approved emails to send.' }],
            };
        }
        const results = [];
        for (const email of approvedEmails) {
            try {
                // Send via SMTP (you can add logic to choose Gmail API vs SMTP)
                await this.sendSMTPEmailDirect(email);
                await this.stagingDb.markEmailSent(email.id);
                results.push(`✓ Sent: ${email.to} - ${email.subject}`);
            }
            catch (error) {
                results.push(`✗ Failed: ${email.to} - ${error.message}`);
            }
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Sent ${results.filter(r => r.startsWith('✓')).length}/${approvedEmails.length} emails:\n\n${results.join('\n')}`,
                },
            ],
        };
    }
    async sendSMTPEmailDirect(email) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        await transporter.sendMail({
            from: email.from || process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email.to,
            cc: email.cc,
            bcc: email.bcc,
            subject: email.subject,
            [email.isHtml ? 'html' : 'text']: email.body,
        });
    }
    async getStagingStats() {
        const stats = await this.stagingDb.getStats();
        return {
            content: [
                {
                    type: 'text',
                    text: `Staging Statistics:\n\n` +
                        `Emails:\n` +
                        `  Total: ${stats.emails.total}\n` +
                        `  Pending: ${stats.emails.pending}\n` +
                        `  Approved: ${stats.emails.approved}\n` +
                        `  Sent: ${stats.emails.sent}\n` +
                        `  Rejected: ${stats.emails.rejected}\n\n` +
                        `Messages:\n` +
                        `  Total: ${stats.messages.total}\n` +
                        `  Pending: ${stats.messages.pending}\n` +
                        `  Approved: ${stats.messages.approved}\n` +
                        `  Sent: ${stats.messages.sent}\n` +
                        `  Rejected: ${stats.messages.rejected}`,
                },
            ],
        };
    }
    async run() {
        await this.initialize();
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Communications MCP Server running on stdio');
    }
}
const server = new CommunicationsServer();
server.run().catch(console.error);
