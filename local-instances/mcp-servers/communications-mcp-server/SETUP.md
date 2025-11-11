---
type: guide
phase: stable
project: communications-mcp-server
tags: [MCP, communications, installation, mcp-server]
category: mcp-servers
status: completed
priority: high
---

# Setup Instructions

## Step 1: Fix npm permissions (if needed)

```bash
sudo chown -R $(id -u):$(id -g) "$HOME/.npm"
```

## Step 2: Install and build

```bash
cd /Users/mmaruthurnew/Desktop/operations-workspace/local-instances/mcp-servers/communications-mcp-server
npm install
npm run build
```

## Step 3: Choose your setup method

### Method A: Google Chat Webhook (EASIEST - Start Here!)

1. **Create a webhook in Google Chat:**
   - Open Google Chat in browser
   - Go to a space where you want to receive messages
   - Click the space name at top → "Apps & integrations"
   - Click "Add webhooks"
   - Name: "Claude Code Bot"
   - Avatar URL (optional): Any image URL
   - Click "Save" and copy the webhook URL

2. **Test it immediately:**
   Just tell Claude:
   ```
   Send "Hello from Claude!" to Google Chat webhook https://chat.googleapis.com/v1/spaces/AAAAxxxx/messages?key=xxxxx
   ```

   That's it! No configuration needed.

### Method B: SMTP Email (SIMPLE)

**For Gmail:**

1. **Create App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Claude Code"
   - Copy the 16-character password

2. **Update `.mcp.json`:**
   Edit `/Users/mmaruthurnew/Desktop/operations-workspace/.mcp.json` and add:

```json
{
  "mcpServers": {
    "communications": {
      "command": "node",
      "args": [
        "/Users/mmaruthurnew/Desktop/operations-workspace/local-instances/mcp-servers/communications-mcp-server/dist/server.js"
      ],
      "env": {
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "YOUR_EMAIL@gmail.com",
        "SMTP_PASSWORD": "YOUR_APP_PASSWORD",
        "SMTP_FROM": "YOUR_EMAIL@gmail.com"
      }
    }
  }
}
```

3. **Restart VS Code** to load the new MCP server

4. **Test:**
   ```
   Send an email to someone@example.com with subject "Test" saying "This is a test from Claude Code!"
   ```

**For other providers (Outlook, etc):**
- Outlook: `smtp.office365.com`, port 587
- Yahoo: `smtp.mail.yahoo.com`, port 465
- Custom SMTP: Use your provider's settings

### Method C: Full OAuth (ADVANCED)

Only needed if you want:
- Gmail API with full features
- Google Chat API (instead of webhooks)

**Steps:**

1. **Google Cloud Console:**
   - Go to https://console.cloud.google.com/
   - Create a new project: "Claude Code Communications"
   - Enable APIs: Gmail API, Google Chat API

2. **Create OAuth Credentials:**
   - APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Desktop app
   - Name: "Claude Code"
   - Download JSON credentials

3. **Get Refresh Token:**
   ```bash
   npx google-oauth-cli \
     --client-id YOUR_CLIENT_ID \
     --client-secret YOUR_CLIENT_SECRET \
     --scope "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/chat.messages"
   ```

   This will open a browser for OAuth flow and give you a refresh token.

4. **Update `.mcp.json`:**
   ```json
   {
     "mcpServers": {
       "communications": {
         "command": "node",
         "args": [
           "/Users/mmaruthurnew/Desktop/operations-workspace/local-instances/mcp-servers/communications-mcp-server/dist/server.js"
         ],
         "env": {
           "GOOGLE_CLIENT_ID": "YOUR_CLIENT_ID",
           "GOOGLE_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
           "GOOGLE_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN"
         }
       }
     }
   }
   ```

## Step 4: Add to .mcp.json

Merge the configuration from your chosen method into your existing `.mcp.json`.

**Current .mcp.json needs this added** (example for webhook-only setup):

```json
{
  "mcpServers": {
    ...existing servers...,
    "communications": {
      "command": "node",
      "args": [
        "/Users/mmaruthurnew/Desktop/operations-workspace/local-instances/mcp-servers/communications-mcp-server/dist/server.js"
      ]
    }
  }
}
```

## Step 5: Restart and Test

1. **Restart VS Code** (or reload Claude Code)
2. **Verify the server loaded:**
   Check that you see `communications-mcp-server` tools available
3. **Test with simple commands:**
   - Webhook: `Send "Test" to Google Chat webhook https://...`
   - Email: `Send email to test@example.com saying hello`

## Troubleshooting

**Server not loading?**
- Check `dist/server.js` exists after `npm run build`
- Look for errors in VS Code Output panel → Claude Code

**Email not sending?**
- Verify SMTP credentials are correct
- Check if 2FA is enabled (required for Gmail App Passwords)
- Test SMTP settings with a simple email client first

**Google Chat webhook not working?**
- Verify webhook URL is complete and correct
- Check that the space still exists
- Try creating a new webhook

## Security Best Practices

1. **Never commit credentials:**
   - Add `.mcp.json` to `.gitignore` if it contains secrets
   - Or use environment variables from system

2. **Use webhooks when possible:**
   - No credential management needed
   - Easy to rotate (just create new webhook)
   - Limited scope (only that space)

3. **App Passwords > Real Passwords:**
   - Can be revoked individually
   - Limited scope
   - No 2FA prompts

## VPS Deployment (Optional)

If you want this running on a VPS instead:

1. **Create HTTP wrapper** around the MCP server
2. **Deploy to your VPS** with systemd/docker
3. **Add authentication** (API keys, OAuth)
4. **Update .mcp.json** to use HTTP transport:
   ```bash
   claude mcp add --transport http communications https://your-vps.com/mcp
   ```

This is more complex but allows:
- Multiple users sharing same server
- Running even when local machine is off
- Centralized logging and monitoring
