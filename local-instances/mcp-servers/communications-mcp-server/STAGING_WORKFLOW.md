---
type: guide
phase: stable
project: communications-mcp-server
tags: [MCP, communications, mcp-server, workflow]
category: mcp-servers
status: completed
priority: high
---

# Email Staging & Approval Workflow

The Communications MCP Server includes a **staging and approval system** that lets you review emails and messages before they're sent.

## How It Works

```
Claude Code → Stage Email → Review Dashboard → Approve → Send
     ↓              ↓              ↓               ↓        ↓
   User asks    Saved to DB    Human reviews   Approved   Email sent
```

## Quick Start

### 1. Start the Review Server

```bash
cd local-instances/mcp-servers/communications-mcp-server
npm run review-server
```

This starts a web server at **http://localhost:3001/review**

### 2. Stage an Email from Claude

In VS Code with Claude Code:

```
Claude, stage an email to john@example.com with subject "Project Update" saying the project is on track
```

Claude will use the `stage_email` tool and give you a link to review.

### 3. Review in the Dashboard

Open **http://localhost:3001/review** in your browser. You'll see:

- **Pending emails** - Awaiting approval
- **Email details** - To, From, Subject, Body, Attachments
- **Approve/Reject buttons** - Review and decide
- **Batch approval** - Approve multiple emails at once

### 4. Approve & Send

**Option A: Approve one email**
1. Enter your name in the approval field
2. Click "Approve"
3. Tell Claude: "Send approved emails"

**Option B: Batch approve**
1. Check multiple pending emails
2. Enter your name in batch approval field
3. Click "Approve Selected"
4. Tell Claude: "Send approved emails"

## Using with Claude Code

### Stage an Email

```
Claude, stage an email to team@company.com about the deployment being complete
```

Claude will call `stage_email` and save it for review.

### List Staged Emails

```
Claude, show me pending emails
```

or

```
Claude, list all staged emails
```

### Approve from Claude (if you know the ID)

```
Claude, approve email abc123 as "John Smith"
```

### Send All Approved Emails

```
Claude, send all approved emails
```

Claude will send every email that has been approved via the dashboard.

### Get Statistics

```
Claude, show staging statistics
```

## Review Dashboard Features

### Stats Dashboard
- **Pending** - Emails awaiting review
- **Approved** - Ready to send
- **Sent** - Already delivered
- **Rejected** - Declined

### Email Details View
- **To/From/CC/BCC** - All recipients
- **Subject & Body** - Full content preview
- **Created date** - When staged
- **Priority** - Urgent/High/Normal/Low
- **Notes** - Internal comments

### Filtering
- Filter by status (Pending, Approved, Rejected, Sent)
- Auto-refresh every 30 seconds

### Batch Operations
- Select multiple emails
- Approve all at once
- "Select All Pending" button for quick approval

## Multiple Accounts

You can stage emails from different accounts by specifying the `from` field:

```
Claude, stage an email from my work account (work@company.com) to client@example.com
```

The staging database tracks which account each email should be sent from.

## Workflow Examples

### Example 1: Review Before Sending

**You:** "Claude, draft an email to the board about Q4 results and stage it for review"

**Claude:** Creates email and stages it

**You:** Open dashboard → Review content → Approve

**You:** "Claude, send approved emails"

**Claude:** Sends the approved email

---

### Example 2: Batch Approval

**You:** "Claude, stage emails to each team member with their performance review summaries"

**Claude:** Stages 10 emails

**You:** Open dashboard → "Select All Pending" → Enter name → "Approve Selected"

**You:** "Claude, send approved emails"

**Claude:** Sends all 10 emails

---

### Example 3: Reject & Edit

**You:** Open dashboard → See email with typo → Click "Reject"

**You:** "Claude, stage a new email to john@example.com with the corrected message"

**Claude:** Stages corrected version

**You:** Open dashboard → Approve

**You:** "Claude, send approved emails"

---

## Advanced Features

### Priority Levels

Stage emails with priority:

```
Claude, stage an urgent email to support@company.com about the server outage
```

High-priority emails are highlighted in the dashboard.

### Internal Notes

Add notes for reviewers:

```
Claude, stage an email to investors with notes "Check revenue numbers before sending"
```

Notes appear in the dashboard but are never sent.

### Auto-Send After Approval (Optional)

You can set up a cron job or background process to automatically send approved emails:

```bash
# Every 5 minutes, tell Claude to send approved emails
*/5 * * * * cd /path/to/workspace && claude-cli "send approved emails"
```

## Database Location

Staged emails are stored in:
```
local-instances/mcp-servers/communications-mcp-server/staging-db.json
```

You can backup this file to preserve your email history.

## Security Notes

- Staged emails are stored **locally** on your machine
- The review server runs on **localhost only** (not accessible from internet)
- All approvals are logged with approver name and timestamp
- **Never commit `staging-db.json` to version control** (contains email content)

## Configuration

Set these environment variables in `.mcp.json`:

```json
{
  "communications": {
    "env": {
      "STAGING_ENABLED": "true",
      "STAGING_DB_PATH": "/custom/path/staging-db.json",
      "REVIEW_SERVER_PORT": "3001"
    }
  }
}
```

**STAGING_ENABLED** - Enable/disable staging (default: true)
**STAGING_DB_PATH** - Custom database location
**REVIEW_SERVER_PORT** - Web server port (default: 3001)

## Troubleshooting

**Review server won't start?**
- Check if port 3001 is already in use
- Change port with `REVIEW_SERVER_PORT` env var

**Emails not appearing in dashboard?**
- Verify `staging-db.json` exists
- Check server logs for errors
- Refresh the page

**Can't approve emails?**
- Make sure you entered your name
- Check browser console for errors

**Approved emails not sending?**
- Verify SMTP credentials are configured
- Run "send approved emails" command in Claude

## Tips

1. **Always review emails** - Especially bulk sends or important communications
2. **Use batch approval** - Faster for multiple emails
3. **Add notes** - Help future reviewers understand context
4. **Set priorities** - High-priority emails stand out
5. **Keep the dashboard open** - Auto-refreshes every 30 seconds

## Next Steps

- [Main README](./README.md) - Server overview and features
- [Setup Guide](./SETUP.md) - Installation and configuration
- [MCP Documentation](https://modelcontextprotocol.io) - Learn more about MCP servers
