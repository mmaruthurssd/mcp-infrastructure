---
type: infrastructure
tags: [oauth, mcp, google-cloud, service-account, mcp-development]
---

# OAuth Domain-Wide Delegation for MCP Servers

**Status:** ✅ Active
**Last Updated:** 2025-11-16
**Workspace:** mcp-infrastructure

---

## Overview

This document explains how MCP servers can use the shared Google Cloud service account with domain-wide delegation for Google Workspace API access.

**For complete OAuth/delegation details, see:**
📘 `/Users/mmaruthurnew/Desktop/operations-workspace/workspace-management/shared-docs/OAUTH-DOMAIN-WIDE-DELEGATION.md`

---

## Service Account Identity

```
Service Account Email: ssd-automation-service-account@workspace-automation-ssdspc.iam.gserviceaccount.com
Google Cloud Project: workspace-automation-ssdspc
Client ID: 101331968393537100233
```

---

## OAuth Configuration for MCPs

### Client ID
```
101331968393537100233
```

### Pre-Authorized Scopes
```
https://www.googleapis.com/auth/script.scriptapp
https://www.googleapis.com/auth/script.projects
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/spreadsheets
```

**Admin Console Configuration:**
https://admin.google.com/ac/owl/domainwidedelegation

---

## Service Account Key Access

### Environment Variable Configuration

MCP servers should use environment variables to access the service account key:

```bash
# In MCP server .env file
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/Users/mmaruthurnew/Desktop/medical-patient-data/configuration/service-accounts/service-account.json

# Or set in shell
export GOOGLE_SERVICE_ACCOUNT_KEY_PATH="/Users/mmaruthurnew/Desktop/medical-patient-data/configuration/service-accounts/service-account.json"
```

### Development vs Production

**Development (dev-instance):**
```bash
# dev-instance/.env
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/Users/mmaruthurnew/Desktop/medical-patient-data/configuration/service-accounts/service-account.json
```

**Production (local-instances):**
```bash
# local-instances/mcp-servers/[mcp-name]/.env
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/Users/mmaruthurnew/Desktop/medical-patient-data/configuration/service-accounts/service-account.json
```

---

## MCP Implementation Patterns

### TypeScript MCP Server Pattern

```typescript
import { google } from 'googleapis';
import * as fs from 'fs';

interface GoogleAuthConfig {
  keyFile: string;
  scopes: string[];
  subject?: string; // User to impersonate
}

class GoogleWorkspaceMCP {
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

    if (!keyPath) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH not set');
    }

    if (!fs.existsSync(keyPath)) {
      throw new Error(`Service account key not found: ${keyPath}`);
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(keyPath, 'utf8')
    );

    this.auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      subject: 'mm@ssdspc.com' // Impersonate this user
    });
  }

  async getDriveService() {
    return google.drive({ version: 'v3', auth: this.auth });
  }

  async getSheetsService() {
    return google.sheets({ version: 'v4', auth: this.auth });
  }
}

// Usage in MCP tool
export async function handleListFiles() {
  const mcp = new GoogleWorkspaceMCP();
  const drive = await mcp.getDriveService();

  const response = await drive.files.list({
    pageSize: 10,
    fields: 'files(id, name, mimeType)'
  });

  return response.data.files;
}
```

### JavaScript MCP Server Pattern

```javascript
const { google } = require('googleapis');
const fs = require('fs');

class GoogleWorkspaceMCP {
  constructor() {
    this.auth = null;
    this.initializeAuth();
  }

  initializeAuth() {
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

    if (!keyPath) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH not set');
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(keyPath, 'utf8')
    );

    this.auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      subject: 'mm@ssdspc.com'
    });
  }

  async getDrive() {
    return google.drive({ version: 'v3', auth: this.auth });
  }

  async getSheets() {
    return google.sheets({ version: 'v4', auth: this.auth });
  }
}

module.exports = { GoogleWorkspaceMCP };
```

---

## MCP-Specific Use Cases

### Google Workspace Materials MCP

**Purpose:** Create and manage Google Docs/Slides for patient materials

**Required Scopes:**
```
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/documents (to be added)
https://www.googleapis.com/auth/presentations (to be added)
```

**Implementation:**
```typescript
// In google-workspace-materials-mcp
import { google } from 'googleapis';

async function createDocument(title: string, content: string) {
  const auth = new google.auth.JWT({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/documents'],
    subject: 'mm@ssdspc.com'
  });

  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.create({
    requestBody: {
      title: title
    }
  });

  return response.data.documentId;
}
```

### Sheets Automation MCP

**Purpose:** Automate Google Sheets operations

**Required Scopes:**
```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive
```

**Implementation:**
```typescript
async function updateSheetData(spreadsheetId: string, range: string, values: any[][]) {
  const auth = new google.auth.JWT({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    subject: 'mm@ssdspc.com'
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}
```

### Apps Script Deployment MCP

**Purpose:** Deploy Apps Script projects programmatically

**Required Scopes:**
```
https://www.googleapis.com/auth/script.projects
https://www.googleapis.com/auth/script.scriptapp
```

**Implementation:**
```typescript
async function deployScript(scriptId: string, version: number) {
  const auth = new google.auth.JWT({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes: [
      'https://www.googleapis.com/auth/script.projects',
      'https://www.googleapis.com/auth/script.scriptapp'
    ],
    subject: 'mm@ssdspc.com'
  });

  const script = google.script({ version: 'v1', auth });

  await script.projects.deployments.create({
    scriptId,
    requestBody: {
      versionNumber: version,
      description: 'Automated deployment'
    }
  });
}
```

---

## Error Handling in MCPs

### Common Errors and Handling

```typescript
async function safeDriveOperation() {
  try {
    const drive = await getDriveService();
    const result = await drive.files.list({});
    return { success: true, data: result.data };
  } catch (error: any) {

    // Handle unauthorized_client
    if (error.message?.includes('unauthorized_client')) {
      return {
        success: false,
        error: 'Domain-wide delegation not configured',
        details: 'Contact admin to verify Client ID and scopes in Admin Console'
      };
    }

    // Handle invalid_grant
    if (error.message?.includes('invalid_grant')) {
      return {
        success: false,
        error: 'User impersonation failed',
        details: 'Verify user email exists and service account has delegation'
      };
    }

    // Handle API not enabled
    if (error.message?.includes('API has not been used')) {
      return {
        success: false,
        error: 'Google API not enabled',
        details: 'Enable the required API in Google Cloud Console'
      };
    }

    // Generic error
    return {
      success: false,
      error: 'Google API error',
      details: error.message
    };
  }
}
```

---

## Testing MCP Integration

### Unit Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { GoogleWorkspaceMCP } from '../src/google-workspace';

describe('Google Workspace MCP', () => {

  it('should initialize with service account', () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH = '/path/to/service-account.json';

    const mcp = new GoogleWorkspaceMCP();
    expect(mcp).toBeDefined();
  });

  it('should throw error if key path not set', () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

    expect(() => {
      new GoogleWorkspaceMCP();
    }).toThrow('GOOGLE_SERVICE_ACCOUNT_KEY_PATH not set');
  });

  it('should authenticate and list files', async () => {
    const mcp = new GoogleWorkspaceMCP();
    const drive = await mcp.getDriveService();

    const response = await drive.files.list({ pageSize: 1 });
    expect(response.data.files).toBeDefined();
  });

});
```

### Integration Tests

```bash
# Test delegation from MCP
cd development/mcp-servers/your-mcp-project/04-product-under-development/dev-instance
npm test -- --testPathPattern=integration
```

---

## Security Best Practices for MCPs

### Environment Variables

**DO:**
- ✅ Use environment variables for service account key path
- ✅ Document required env vars in MCP README
- ✅ Provide .env.example template
- ✅ Validate env vars on MCP startup

**DON'T:**
- ❌ Hardcode service account paths in MCP code
- ❌ Commit .env files with actual key paths
- ❌ Include service account keys in MCP distribution
- ❌ Share keys via MCP configuration files

### Scope Management

**DO:**
- ✅ Request minimum required scopes only
- ✅ Document why each scope is needed
- ✅ Test with least-privilege scopes first
- ✅ Request additional scopes when needed

**DON'T:**
- ❌ Request all scopes "just in case"
- ❌ Use broader scopes than necessary
- ❌ Bypass scope validation
- ❌ Cache scopes without validation

### User Impersonation

**DO:**
- ✅ Validate user email before impersonation
- ✅ Log which user is being impersonated
- ✅ Document why impersonation is needed
- ✅ Use least-privilege user when possible

**DON'T:**
- ❌ Impersonate admin users unnecessarily
- ❌ Allow arbitrary user impersonation
- ❌ Skip user validation
- ❌ Impersonate users for PHI access (use medical-patient-data workspace)

---

## MCP Configuration Template

### .env.example Template

```bash
# Google Cloud Service Account Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/Users/mmaruthurnew/Desktop/medical-patient-data/configuration/service-accounts/service-account.json

# Google Workspace Configuration
GOOGLE_WORKSPACE_DOMAIN=ssdspc.com
GOOGLE_WORKSPACE_USER_EMAIL=mm@ssdspc.com

# Optional: Override scopes (defaults to Drive + Sheets)
# GOOGLE_API_SCOPES=https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/spreadsheets
```

### MCP README Template

```markdown
## Google Workspace Integration

This MCP uses domain-wide delegation to access Google Workspace APIs.

### Setup

1. Set environment variable:
   ```bash
   export GOOGLE_SERVICE_ACCOUNT_KEY_PATH="/Users/mmaruthurnew/Desktop/medical-patient-data/configuration/service-accounts/service-account.json"
   ```

2. Verify OAuth configuration:
   - Client ID: 101331968393537100233
   - Required scopes: (list scopes)

3. Test delegation:
   ```bash
   npm run test:delegation
   ```

### Required Scopes

This MCP requires the following OAuth scopes:
- `https://www.googleapis.com/auth/drive` - For Drive access
- `https://www.googleapis.com/auth/spreadsheets` - For Sheets access

### Documentation

- OAuth Setup: /Users/mmaruthurnew/Desktop/operations-workspace/workspace-management/shared-docs/OAUTH-DOMAIN-WIDE-DELEGATION.md
- MCP OAuth Guide: /Users/mmaruthurnew/Desktop/mcp-infrastructure/infrastructure/oauth-delegation-config.md
```

---

## Troubleshooting MCP OAuth Issues

### Check Environment Variables

```typescript
// Add to MCP startup validation
function validateEnvironment() {
  const required = ['GOOGLE_SERVICE_ACCOUNT_KEY_PATH'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Environment variables validated');
}
```

### Check Service Account Key

```typescript
function validateServiceAccountKey() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Service account key not found: ${keyPath}`);
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Invalid service account key format');
    }

    console.log('✅ Service account key validated');
    console.log('   Email:', serviceAccount.client_email);

  } catch (error) {
    throw new Error(`Failed to parse service account key: ${error.message}`);
  }
}
```

### Test Delegation

```typescript
async function testDelegation() {
  try {
    const auth = new google.auth.JWT({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/drive'],
      subject: 'mm@ssdspc.com'
    });

    await auth.authorize();
    console.log('✅ Delegation test passed');

  } catch (error) {
    console.error('❌ Delegation test failed:', error.message);
    throw error;
  }
}
```

---

## Adding New Scopes to MCP

### Process

1. **Update Admin Console:**
   - Go to https://admin.google.com/ac/owl/domainwidedelegation
   - Find Client ID: `101331968393537100233`
   - Add new scope to comma-separated list
   - Wait 15-30 minutes for propagation

2. **Update MCP Code:**
   ```typescript
   // Add new scope to auth configuration
   const auth = new google.auth.JWT({
     keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
     scopes: [
       'https://www.googleapis.com/auth/drive',
       'https://www.googleapis.com/auth/spreadsheets',
       'https://www.googleapis.com/auth/documents' // NEW SCOPE
     ],
     subject: 'mm@ssdspc.com'
   });
   ```

3. **Update MCP Documentation:**
   - Update README with new scope
   - Document why scope is needed
   - Update .env.example if needed

4. **Test MCP:**
   ```bash
   npm run test:delegation
   npm run test:integration
   ```

---

## Related Documentation

### Master OAuth Reference
📘 `/Users/mmaruthurnew/Desktop/operations-workspace/workspace-management/shared-docs/OAUTH-DOMAIN-WIDE-DELEGATION.md`
- Complete OAuth configuration
- All scopes and patterns
- Cross-workspace usage

### medical-patient-data Reference
📘 `/Users/mmaruthurnew/Desktop/medical-patient-data/infrastructure/google-cloud-service-account.md`
- Detailed service account info
- API enablement
- Key management

### operations-workspace Reference
📘 `/Users/mmaruthurnew/Desktop/operations-workspace/infrastructure/google-cloud-service-account.md`
- Workspace-specific guidance
- Cross-workspace coordination

---

## Quick Reference for MCP Developers

**Environment Variable:**
```bash
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/Users/mmaruthurnew/Desktop/medical-patient-data/configuration/service-accounts/service-account.json
```

**Service Account Email:**
```
ssd-automation-service-account@workspace-automation-ssdspc.iam.gserviceaccount.com
```

**Client ID:**
```
101331968393537100233
```

**Pre-Authorized Scopes:**
```
https://www.googleapis.com/auth/script.scriptapp
https://www.googleapis.com/auth/script.projects
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/spreadsheets
```

**Test Delegation:**
```bash
cd /Users/mmaruthurnew/Desktop/medical-patient-data/google-workspace-oauth-setup
node test-delegation.js
```

---

**Last Updated:** 2025-11-16
**Next Review:** 2025-12-16
**Maintained By:** MCP infrastructure team
