---
type: plan
phase: planning
tags: [communications, sms, twilio, text-messaging, future-enhancement]
category: future-ideas
status: planned
priority: medium
---

# SMS/Text Messaging Integration

**Status:** Planned Future Enhancement
**Priority:** Medium
**Estimated Effort:** Medium (2-3 days)

---

## Overview

Extend the communications MCP server to support SMS/text messaging, making it a comprehensive communication hub for email, chat, AND text messages.

**Current capabilities:**
- ✅ Email (SMTP, Gmail API)
- ✅ Google Chat (API, webhook)
- ✅ Staging & approval workflow

**Planned addition:**
- 📱 SMS/Text messaging

---

## Integration Options

### Option 1: Twilio (Recommended)

**Pros:**
- Industry standard for SMS
- Excellent API and documentation
- Supports international SMS
- MMS support (images, media)
- Programmable messaging features
- Delivery receipts and status callbacks
- Very reliable infrastructure

**Cons:**
- Requires paid account (usage-based pricing)
- Need to verify/register phone number
- Regulatory compliance for mass messaging

**Setup Complexity:** Medium
**Cost:** ~$0.0075 per SMS (varies by country)

**Environment Variables:**
```bash
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+15551234567"
```

### Option 2: AWS SNS (Simple Notification Service)

**Pros:**
- Already integrated if using AWS
- Simple API
- Pay only for what you use
- Global coverage

**Cons:**
- Limited to transactional SMS
- Less feature-rich than Twilio
- Requires AWS account setup

**Setup Complexity:** Medium
**Cost:** $0.00645 per SMS (US)

### Option 3: Vonage (formerly Nexmo)

**Pros:**
- Good international coverage
- Competitive pricing
- Developer-friendly API

**Cons:**
- Smaller ecosystem than Twilio
- Fewer advanced features

**Setup Complexity:** Medium

---

## Proposed Tools

### 1. `send_sms`

Send a text message directly.

**Parameters:**
- `to` (string, required) - Recipient phone number (E.164 format: +15551234567)
- `message` (string, required) - Text message content (max 160 chars for single SMS)
- `from` (string, optional) - Sender phone number (defaults to TWILIO_PHONE_NUMBER)

**Example:**
```
Send SMS to +15551234567 saying "Your appointment is confirmed for 2pm today"
```

### 2. `send_mms`

Send multimedia message (image, video, etc.).

**Parameters:**
- `to` (string, required) - Recipient phone number
- `message` (string, required) - Text message content
- `mediaUrl` (string, required) - URL of media to attach
- `from` (string, optional) - Sender phone number

**Example:**
```
Send MMS to +15551234567 with image https://example.com/image.jpg and message "Here's your order confirmation"
```

### 3. `stage_sms`

Stage an SMS for review before sending (following existing staging pattern).

**Parameters:**
- `to` (string, required) - Recipient phone number
- `message` (string, required) - Text message content
- `priority` (string, optional) - urgent/high/normal/low
- `notes` (string, optional) - Internal notes for reviewer

**Workflow:**
1. Stage SMS via Claude
2. Review in dashboard (http://localhost:3001/review)
3. Approve or reject
4. Send approved SMS

### 4. `list_staged_sms`

List all staged SMS messages by status.

### 5. `send_approved_sms`

Send all approved SMS messages (batch sending).

---

## Receiving SMS/MMS (Two-Way Communication)

**Status:** Advanced Feature (requires VPS deployment or ngrok)

Twilio fully supports **receiving** SMS/MMS messages, enabling two-way conversations. However, this requires the communications server to have a public URL for Twilio to send webhooks.

### How It Works:

1. **Configure Twilio webhook** - Point to your server's public URL (e.g., `https://your-vps.com/sms/incoming`)
2. **Someone texts your Twilio number** - Message arrives at Twilio
3. **Twilio sends HTTP POST** - Delivers message to your webhook URL
4. **Your server processes** - Store message, make available to Claude, optionally auto-respond

### Deployment Requirements:

**Option A: VPS Deployment (Recommended for Production)**
- Deploy communications server to VPS with public IP
- Configure domain/subdomain pointing to VPS
- Twilio webhook: `https://comms.yourdomain.com/sms/incoming`
- Server always running to receive messages

**Pros:**
- Always available, reliable
- Production-ready
- Can handle high volume

**Cons:**
- Requires VPS setup (~$5-20/month)
- Need to manage server deployment

**Related:** See `vps-communications-deployment` plan

**Option B: ngrok for Development/Testing**
- Run server locally
- Use ngrok to create public tunnel: `ngrok http 3001`
- Twilio webhook: `https://abc123.ngrok.io/sms/incoming`

**Pros:**
- Easy for testing
- No hosting costs
- Quick setup

**Cons:**
- URL changes each time ngrok restarts
- Not suitable for production
- Requires local machine to be running

**Option C: Serverless (AWS Lambda, Google Cloud Functions)**
- Deploy webhook handler as serverless function
- Twilio calls function directly
- Function stores messages in database

**Pros:**
- No server maintenance
- Auto-scaling
- Pay only for usage

**Cons:**
- More complex architecture
- Need separate storage (database)
- Cold start latency

### Proposed Tools for Receiving:

### 6. `get_incoming_sms`

List received SMS/MMS messages.

**Parameters:**
- `since` (date, optional) - Show messages since this date (default: last 24 hours)
- `from` (phone, optional) - Filter by sender phone number
- `unread` (boolean, optional) - Only show unread messages
- `limit` (number, optional) - Max messages to return (default: 50)

**Example:**
```
Show me unread SMS messages from the last hour
```

**Response:**
```
Found 3 unread messages:

1. From: +15551234567 (2 minutes ago)
   "CONFIRM - I'll be there at 2pm"

2. From: +15559876543 (15 minutes ago)
   "What are your hours today?"

3. From: +15551111111 (45 minutes ago)
   "My order hasn't arrived yet. Order #12345"
```

### 7. `reply_to_sms`

Reply to a received SMS (maintains conversation thread).

**Parameters:**
- `messageId` (string, required) - ID of incoming message to reply to
- `reply` (string, required) - Reply text content
- `markRead` (boolean, optional) - Mark original as read (default: true)

**Example:**
```
Reply to SMS abc123 saying "Thank you for confirming! See you at 2pm."
```

### 8. `mark_sms_read`

Mark received message(s) as read.

**Parameters:**
- `messageIds` (array, required) - IDs of messages to mark as read

### 9. `create_sms_autoresponder`

Set up automatic replies for incoming messages matching patterns.

**Parameters:**
- `trigger` (string, required) - Keyword or pattern to match (case-insensitive)
- `response` (string, required) - Auto-response text
- `enabled` (boolean, optional) - Enable/disable (default: true)
- `activeHours` (string, optional) - Active time range (e.g., "9am-5pm Mon-Fri")

**Example:**
```
Create autoresponder: when someone texts "HOURS", reply with "We're open Monday-Friday 9am-6pm, Saturday 10am-4pm"
```

### 10. `list_sms_autoresponders`

List all configured autoresponders.

### 11. `delete_sms_autoresponder`

Remove an autoresponder.

### Conversation Management:

**Threaded conversations:**
- Group messages by phone number
- Show conversation history
- Reply maintains thread context

**Example conversation view:**
```
Conversation with +15551234567:

[Yesterday 3:15pm] Them: "Do you have appointments available this week?"
[Yesterday 3:17pm] You: "Yes! We have openings Wed at 2pm and Fri at 10am"
[Today 9:30am] Them: "CONFIRM - I'll take Wed at 2pm"
[Today 9:31am] You: "Perfect! Confirmed for Wed 2pm. See you then!"
```

### Database Schema Extension:

```typescript
interface IncomingSMS {
  id: string;
  from: string;          // Sender phone number
  to: string;            // Your Twilio number
  body: string;          // Message text
  mediaUrls: string[];   // MMS media URLs (if any)
  receivedAt: Date;
  read: boolean;
  repliedTo: boolean;
  replyId?: string;      // ID of reply message
  twilioSid: string;     // Twilio message SID
}

interface SMSAutoresponder {
  id: string;
  trigger: string;       // Keyword or regex pattern
  response: string;
  enabled: boolean;
  activeHours?: string;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}
```

---

## Staging & Approval Extension

The existing staging workflow would be extended to support SMS:

**Current support:**
- ✅ Emails
- ✅ Chat messages

**New support:**
- 📱 SMS messages
- 📱 MMS messages

**Review Dashboard Updates:**
- New "SMS" tab in dashboard
- Display: To, From, Message, Created Date, Priority
- Character count indicator (SMS length limits)
- Preview of media for MMS

---

## Implementation Plan

### Phase 1: Core SMS Support (Day 1)
1. Add Twilio SDK to dependencies
2. Implement `send_sms` tool
3. Create Twilio client initialization
4. Add environment variable handling
5. Update README with Twilio setup instructions

### Phase 2: Staging Integration (Day 2)
1. Extend staging database schema for SMS
2. Implement `stage_sms` tool
3. Update review dashboard to show SMS
4. Implement `send_approved_sms` tool
5. Add SMS-specific validation (phone format, length limits)

### Phase 3: Advanced Features (Day 3)
1. Implement `send_mms` tool
2. Add delivery status tracking
3. Add batch SMS support
4. Implement SMS templates
5. Add phone number validation/formatting

### Phase 4: Two-Way Communication (Optional - Day 4)
**Requires:** VPS deployment or ngrok setup

1. Implement webhook endpoint `/sms/incoming`
2. Add incoming message storage to database
3. Implement `get_incoming_sms` tool
4. Implement `reply_to_sms` tool
5. Add conversation threading
6. Implement `mark_sms_read` tool
7. Implement autoresponder system
8. Update review dashboard with "Inbox" tab

### Phase 5: Documentation & Testing
1. Update all documentation
2. Add SMS examples to README
3. Create TWILIO_SETUP.md guide
4. Create WEBHOOK_SETUP.md for receiving (if Phase 4 implemented)
5. Test all tools end-to-end
6. Update TEMPLATE-INFO.json

---

## Technical Considerations

### Phone Number Format
- Enforce E.164 format: +[country code][number]
- Auto-format common formats (US: (555) 123-4567 → +15551234567)
- Validation before sending

### Character Limits
- SMS: 160 characters (GSM-7)
- SMS: 70 characters (Unicode/emoji)
- Auto-split long messages
- Warn in staging if message will be split

### Cost Management
- Staging workflow prevents accidental mass sends
- Batch approval for cost control
- Optional daily/monthly spend limits
- Cost estimate in staging dashboard

### Compliance
- TCPA compliance (US) - opt-in required
- GDPR considerations for international
- Time-of-day restrictions (no 9pm-8am by default)
- Add compliance warnings to documentation

### Error Handling
- Invalid phone numbers
- Insufficient Twilio balance
- Carrier errors
- Rate limiting

---

## Configuration Example

**Minimal (SMS only):**
```json
{
  "mcpServers": {
    "communications": {
      "command": "node",
      "args": ["${workspaceFolder}/local-instances/mcp-servers/communications-mcp-server/dist/server.js"],
      "env": {
        "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxx",
        "TWILIO_AUTH_TOKEN": "your-auth-token",
        "TWILIO_PHONE_NUMBER": "+15551234567"
      }
    }
  }
}
```

**Complete (Email + Chat + SMS):**
```json
{
  "mcpServers": {
    "communications": {
      "command": "node",
      "args": ["${workspaceFolder}/local-instances/mcp-servers/communications-mcp-server/dist/server.js"],
      "env": {
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "user@gmail.com",
        "SMTP_PASSWORD": "app-password",
        "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxx",
        "TWILIO_AUTH_TOKEN": "your-auth-token",
        "TWILIO_PHONE_NUMBER": "+15551234567"
      }
    }
  }
}
```

---

## Use Cases

### 1. Appointment Reminders
```
Stage SMS to +15551234567 saying "Reminder: Your appointment with Dr. Smith is tomorrow at 2pm. Reply CONFIRM to confirm."
```

### 2. Order Status Updates
```
Send SMS to +15551234567 saying "Your order #12345 has shipped! Track at: https://track.example.com/12345"
```

### 3. Verification Codes
```
Send SMS to +15551234567 saying "Your verification code is: 123456. Valid for 10 minutes."
```

### 4. Emergency Alerts
```
Stage urgent SMS to multiple numbers about system outage
```

### 5. Marketing Campaigns (with staging)
```
Stage 100 SMS messages for Black Friday promotion
Review in dashboard
Batch approve and send
```

### 6. Two-Way Appointment Confirmation (requires receiving)
```
→ Send: "Reminder: Your appointment is tomorrow at 2pm. Reply CONFIRM or CANCEL"
← Receive: "CONFIRM"
→ Auto-respond: "Great! See you tomorrow at 2pm. Reply DIRECTIONS if you need directions."
```

### 7. Customer Support Inbox (requires receiving)
```
← Receive: "My order #12345 hasn't arrived yet"
→ Claude: "New support message from +15551234567 about order #12345"
→ Reply: "I've looked up your order. It shipped yesterday and should arrive by Friday. Tracking: https://..."
```

### 8. Keyword-Based Information (requires receiving)
```
← Receive: "HOURS"
→ Auto-respond: "We're open Mon-Fri 9am-6pm, Sat 10am-4pm. Visit https://example.com/hours"

← Receive: "LOCATION"
→ Auto-respond: "123 Main St, City, State 12345. Map: https://maps.google.com/..."
```

### 9. Survey/Feedback Collection (requires receiving)
```
→ Send: "How was your visit? Reply 1-5 (1=poor, 5=excellent)"
← Receive: "5"
→ Auto-respond: "Thank you! Would you like to leave a review? Reply YES or NO"
← Receive: "YES"
→ Reply: "Here's our review link: https://..."
```

### 10. Lead Qualification (requires receiving)
```
← Receive: "I'm interested in your services"
→ Auto-respond: "Great! What service are you interested in? Reply A) Consultation B) Installation C) Repair"
← Receive: "A"
→ Reply: "Perfect! Our consultations are $50. Available times: Wed 2pm, Thu 10am, Fri 3pm. Which works?"
```

---

## Success Metrics

Once implemented, success will be measured by:

**Sending (Phase 1-3):**
- ✅ All 5 sending tools working reliably
- ✅ SMS integrated into staging dashboard
- ✅ <1% delivery failure rate
- ✅ Complete documentation for setup
- ✅ Compliance warnings in place
- ✅ Cost tracking visible in dashboard

**Receiving (Phase 4 - Optional):**
- ✅ All 6 receiving tools working reliably
- ✅ Webhook receiving messages successfully
- ✅ Conversation threading working
- ✅ Autoresponders triggering correctly
- ✅ Inbox visible in review dashboard
- ✅ <100ms webhook response time

---

## Related Resources

**Documentation to create:**
- `TWILIO_SETUP.md` - Step-by-step Twilio account setup
- `SMS_BEST_PRACTICES.md` - Guidelines for SMS usage
- `COMPLIANCE.md` - Legal requirements for SMS

**Updates needed:**
- `README.md` - Add SMS section
- `SETUP.md` - Add Twilio configuration
- `STAGING_WORKFLOW.md` - Add SMS examples
- `TEMPLATE-INFO.json` - Add new tools and env vars

---

## Dependencies

**New package:**
```json
"dependencies": {
  "@modelcontextprotocol/sdk": "^0.5.0",
  "googleapis": "^140.0.0",
  "nodemailer": "^6.9.13",
  "express": "^4.18.2",
  "twilio": "^5.0.0"  // NEW
}
```

---

## Alternative Future Enhancements

Beyond Twilio, consider:
- **Slack integration** - Native Slack messaging
- **Microsoft Teams** - Teams channel messaging
- **Discord** - Discord server messaging
- **WhatsApp Business API** - WhatsApp messages via Twilio
- **Signal** - Encrypted messaging
- **Telegram Bot API** - Telegram messaging

Each could follow the same pattern:
1. Direct send tools
2. Staging support
3. Dashboard integration
4. Approval workflow

---

## Next Steps

When ready to implement:

1. **User confirms interest** in SMS capability
2. **Research compliance** requirements for intended use case
3. **Set up Twilio trial account** for testing
4. **Implement Phase 1** (core SMS support)
5. **Test thoroughly** with staging workflow
6. **Deploy and document**

**Status:** Awaiting prioritization and user approval

---

**Created:** 2025-10-26
**Last Updated:** 2025-10-26
**Author:** SSD Medical Practice
**Related:** vps-communications-deployment (VPS deployment would enable always-on SMS)
