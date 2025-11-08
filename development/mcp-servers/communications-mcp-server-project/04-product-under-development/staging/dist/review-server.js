#!/usr/bin/env node
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { StagingDatabase } from './staging-db.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = parseInt(process.env.REVIEW_SERVER_PORT || '3001');
// Initialize database
const db = new StagingDatabase(process.env.STAGING_DB_PATH);
await db.initialize();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
// API endpoints
app.get('/api/emails', async (req, res) => {
    try {
        const status = req.query.status;
        const emails = await db.getAllEmails(status);
        res.json(emails);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/emails/:id', async (req, res) => {
    try {
        const email = await db.getEmail(req.params.id);
        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }
        res.json(email);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/emails/:id/approve', async (req, res) => {
    try {
        const { approvedBy } = req.body;
        if (!approvedBy) {
            return res.status(400).json({ error: 'approvedBy is required' });
        }
        await db.approveEmail(req.params.id, approvedBy);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/emails/:id/reject', async (req, res) => {
    try {
        const { rejectedBy } = req.body;
        if (!rejectedBy) {
            return res.status(400).json({ error: 'rejectedBy is required' });
        }
        await db.rejectEmail(req.params.id, rejectedBy);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/emails/:id/notes', async (req, res) => {
    try {
        const { notes } = req.body;
        await db.updateEmailNotes(req.params.id, notes);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/emails/batch-approve', async (req, res) => {
    try {
        const { ids, approvedBy } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'ids array is required' });
        }
        if (!approvedBy) {
            return res.status(400).json({ error: 'approvedBy is required' });
        }
        await db.batchApproveEmails(ids, approvedBy);
        res.json({ success: true, count: ids.length });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/messages', async (req, res) => {
    try {
        const status = req.query.status;
        const messages = await db.getAllMessages(status);
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/messages/:id/approve', async (req, res) => {
    try {
        const { approvedBy } = req.body;
        if (!approvedBy) {
            return res.status(400).json({ error: 'approvedBy is required' });
        }
        await db.approveMessage(req.params.id, approvedBy);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await db.getStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Main review page
app.get('/review', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/review.html'));
});
app.get('/', (req, res) => {
    res.redirect('/review');
});
app.listen(PORT, () => {
    console.log(`\n✓ Email Review Server running at: http://localhost:${PORT}/review\n`);
});
