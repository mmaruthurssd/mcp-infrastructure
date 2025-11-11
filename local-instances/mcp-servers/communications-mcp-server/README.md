---
type: readme
phase: stable
project: communications-mcp-server
tags: [API, MCP, communications, mcp-server, workflow]
category: mcp-servers
status: completed
priority: high
---

# Communications MCP Server

Send emails and Google Chat messages directly from Claude Code with **approval workflow**!

## Features

### Core Communications
- **Email (Gmail API)**: Send emails using your Gmail account with OAuth authentication
- **Email (SMTP)**: Send emails using any SMTP provider (simpler setup)
- **Google Chat (API)**: Send messages to Google Chat spaces with OAuth
- **Google Chat (Webhook)**: Send messages using webhook URLs (easiest method)

### Staging & Approval System ⭐ NEW
- **Stage emails for review** - Save drafts before sending
- **Web dashboard** - Review emails with To/From/Subject/Body
- **Batch approval** - Approve multiple emails at once
- **Approval logging** - Track who approved what and when
- **Priority levels** - Mark urgent/high/normal/low priority
- **Multiple accounts** - Stage from different email accounts

## Staging Workflow (Recommended)

**Why use staging?** Review emails before they're sent. Perfect for bulk sends, important communications, or team workflows.

1. **Start the review server:**
   ```bash
   npm run review-server
   ```
   Opens dashboard at http://localhost:3001/review

2. **Stage an email from Claude:**
   ```
   Claude, stage an email to john@example.com about the project update
   ```

3. **Review in dashboard:**
   - See To/From/Subject/Body
   - Add internal notes
   - Approve or reject

4. **Send approved emails:**
   ```
   Claude, send approved emails
   ```

See [STAGING_WORKFLOW.md](./STAGING_WORKFLOW.md) for complete guide.

---

## Quick Start - Google Chat Webhook (Easiest)

1. In Google Chat, create a webhook:
   - Go to a Chat space
   - Click the space name → Apps & integrations
   - Click "Add webhooks"
   - Name it "Claude Code" and create
   - Copy the webhook URL

2. Use in Claude Code:
   ```
   Send a message to Google Chat webhook https://chat.googleapis.com/v1/spaces/... saying "Hello from Claude!"
   ```

## Setup Options

### Option 1: SMTP Email (Recommended for Email)

Easiest email setup - works with Gmail, Outlook, etc.

**Gmail Example:**
1. Enable 2FA on your Google account
2. Create an App Password: https://myaccount.google.com/apppasswords
3. Set environment variables in `.mcp.json`

**Configuration:**
```json
{
  "env": {
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "your-email@gmail.com",
    "SMTP_PASSWORD": "your-app-password",
    "SMTP_FROM": "your-email@gmail.com"
  }
}
```

### Option 2: Gmail API (OAuth)

More powerful but requires OAuth setup.

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API and Google Chat API
4. Create OAuth 2.0 credentials:
   - Application type: Desktop app
   - Download credentials
5. Run OAuth flow to get refresh token

**Configuration:**
```json
{
  "env": {
    "GOOGLE_CLIENT_ID": "your-client-id",
    "GOOGLE_CLIENT_SECRET": "your-client-secret",
    "GOOGLE_REFRESH_TOKEN": "your-refresh-token"
  }
}
```

### Option 3: Google Chat Webhook (Simplest)

No authentication needed! Just use the webhook URL directly.

## Usage Examples

Once configured, just talk to Claude naturally:

- "Send an email to john@example.com with subject 'Meeting Tomorrow' saying we'll meet at 2pm"
- "Email the team at team@company.com about the deployment"
- "Send a message to Google Chat saying the build is complete"
- "Post to the webhook that the deployment was successful"

## Build Instructions

```bash
cd local-instances/mcp-servers/communications-mcp-server
npm install
npm run build
```

## Tools Available

1. **send_email_smtp**: Send email via SMTP (any provider)
2. **send_email_gmail**: Send email via Gmail API (OAuth required)
3. **send_google_chat_message**: Send to Chat space (OAuth required)
4. **send_google_chat_webhook**: Send via webhook (no auth needed)

## Security Notes

- Never commit credentials to version control
- Use App Passwords instead of real passwords
- Store credentials in environment variables
- Use webhooks for simple use cases to avoid credential management
