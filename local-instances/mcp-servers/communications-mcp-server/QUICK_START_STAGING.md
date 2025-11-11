---
type: reference
phase: stable
project: communications-mcp-server
tags: [MCP, communications, configuration, mcp-server, workflow]
category: mcp-servers
status: completed
priority: medium
---

# Quick Start: Email Staging Workflow

Get up and running with email staging in 5 minutes!

## Setup (One Time)

1. **Install:**
   ```bash
   cd local-instances/mcp-servers/communications-mcp-server
   ./install.sh
   ```

2. **Configure SMTP** (in `.mcp.json`):
   ```json
   "communications": {
     "command": "node",
     "args": ["/.../dist/server.js"],
     "env": {
       "SMTP_HOST": "smtp.gmail.com",
       "SMTP_PORT": "587",
       "SMTP_USER": "you@gmail.com",
       "SMTP_PASSWORD": "your-app-password"
     }
   }
   ```

3. **Restart VS Code**

## Daily Workflow

### 1. Start Review Server

```bash
cd local-instances/mcp-servers/communications-mcp-server
npm run review-server
```

Leave this running. It opens: **http://localhost:3001/review**

### 2. Stage Emails via Claude

In VS Code with Claude Code:

**Single email:**
```
Stage an email to john@example.com about tomorrow's meeting
```

**Bulk emails:**
```
Stage emails to the team (alice@, bob@, carol@) about the deployment
```

**With priority:**
```
Stage an urgent email to support@company.com about the server outage
```

### 3. Review in Dashboard

Open: http://localhost:3001/review

You'll see:
- ✉️ All staged emails
- 📋 To/From/Subject/Body
- ⏱️ When created
- ⚡ Priority level

### 4. Approve

**Single approval:**
1. Enter your name
2. Click "Approve"

**Batch approval:**
1. Click checkboxes on multiple emails
2. Enter your name in batch field
3. Click "Approve Selected"

### 5. Send

Tell Claude:
```
Send approved emails
```

Done! Approved emails are sent.

## Common Commands

| Action | Claude Command |
|--------|---------------|
| Stage email | `Stage an email to X about Y` |
| List pending | `Show pending emails` |
| Get stats | `Show staging statistics` |
| Send approved | `Send approved emails` |

## Multiple Accounts

```
Stage an email from work@company.com to client@example.com
Stage an email from personal@gmail.com to friend@example.com
```

The dashboard shows which account each email will be sent from.

## Tips

- **Always review** - Especially important emails
- **Use batch approval** - Faster for 10+ emails
- **Add notes** - Help reviewers understand context
- **Check the dashboard** - Auto-refreshes every 30 seconds
- **Keep review server running** - Or restart when needed

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Review server won't start | Check if port 3001 is in use |
| Emails not appearing | Refresh dashboard, check staging-db.json exists |
| Can't approve | Enter your name first |
| Approved emails not sending | Check SMTP credentials, run "send approved emails" |

## What's Stored

All staged emails are in:
```
local-instances/mcp-servers/communications-mcp-server/staging-db.json
```

**Security:** This file stays on your local machine. Never commit to Git!

## Next Steps

- Full guide: [STAGING_WORKFLOW.md](./STAGING_WORKFLOW.md)
- Setup credentials: [SETUP.md](./SETUP.md)
- Main features: [README.md](./README.md)

---

**Need help?** The review dashboard is your friend. Everything is visual and easy to understand!
