# Security & Compliance MCP - Developer Guide

## Architecture Overview

The Security & Compliance MCP Server is built with a modular architecture designed for extensibility and maintainability.

### Core Components

```
src/
├── server.ts              # MCP server entry point
├── types/                 # TypeScript type definitions
│   ├── index.ts          # Main types (violations, scans, configs)
│   └── audit.ts          # Audit trail types
├── patterns/              # Detection patterns
│   ├── credential-patterns.ts  # Credential regex patterns
│   └── phi-patterns.ts        # PHI regex patterns
├── scanners/              # Scanning engines
│   ├── credential-scanner.ts  # Credential detection engine
│   └── phi-scanner.ts         # PHI detection engine
├── tools/                 # MCP tools (public API)
│   ├── scan-for-credentials.ts
│   ├── scan-for-phi.ts
│   ├── manage-secrets.ts
│   ├── manage-hooks.ts
│   └── manage-allowlist.ts
├── secrets/               # Secrets management
│   └── secrets-manager.ts
├── keystore/              # OS-native keystores
│   ├── keystore-interface.ts  # Abstraction layer
│   ├── macos-keychain.ts      # macOS Keychain
│   ├── windows-credential-manager.ts
│   ├── linux-secret-service.ts
│   └── file-keystore.ts       # Encrypted fallback
├── audit/                 # Audit logging
│   ├── audit-logger.ts       # Core audit logger
│   └── audit-helper.ts       # Convenience functions
├── hooks/                 # Git hooks
│   ├── hook-manager.ts       # Hook installation
│   └── pre-commit.ts         # Pre-commit logic
└── config/                # Configuration
    └── security-config.ts
```

## Development Setup

### Prerequisites

- Node.js 18+
- TypeScript 5+
- Jest for testing

### Installation

```bash
# Clone repository
git clone <repo-url>
cd security-compliance-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run in development
npm run dev
```

### Development Workflow

1. Make changes in `src/`
2. Run `npm run build` to compile TypeScript
3. Run `npm test` to verify tests pass
4. Test with MCP client (Claude Desktop or compatible)

## Key Concepts

### Pattern-Based Detection

Both credential and PHI scanners use regex-based pattern matching with confidence scoring.

**Pattern Definition:**
```typescript
interface CredentialPattern {
  name: string;           // Human-readable name
  pattern: RegExp;        // Detection regex
  severity: SeverityLevel; // critical | high | medium | low
  confidence: number;     // 0.0 to 1.0
  description?: string;   // Optional description
}
```

**Adding New Patterns:**

1. Edit `src/patterns/credential-patterns.ts` or `phi-patterns.ts`
2. Add new pattern object to array
3. Set appropriate severity and confidence
4. Test with sample data

**Example:**
```typescript
{
  name: 'New API Token',
  pattern: /new-api-[a-zA-Z0-9]{32}/gi,
  severity: 'high',
  confidence: 0.9,
  description: 'New API service token format'
}
```

### Confidence Scoring

Confidence represents likelihood that a match is a true positive:

- **0.9-1.0**: Very confident (e.g., exact format match)
- **0.7-0.9**: Confident (e.g., common pattern)
- **0.5-0.7**: Moderate (e.g., generic pattern)
- **< 0.5**: Low confidence (high false positive rate)

### Medical Context Detection

PHI scanner adjusts confidence based on medical context:

```typescript
private detectMedicalContext(content: string, filePath: string): boolean {
  // Check file path
  const medicalPathPatterns = [/patient/i, /medical/i, /phi/i, /hipaa/i];
  if (medicalPathPatterns.some((p) => p.test(filePath))) return true;

  // Check content for medical keywords
  const keywords = ['patient', 'diagnosis', 'treatment', 'medical record'];
  const count = keywords.filter((kw) => content.toLowerCase().includes(kw)).length;
  return count >= 3;
}
```

## Audit Logging

### Checksum Chain

The audit logger implements a blockchain-like checksum chain for tamper detection:

```typescript
checksum(event_n) = SHA256(checksum(event_n-1) + event_n_data)
```

**Genesis Checksum:** `0000...0000` (64 zeros)

Each event's checksum includes:
- Previous event's checksum
- Current event data (id, timestamp, type, severity, outcome, actor, etc.)

**Verification:**
```typescript
async verifyChain(): Promise<{ valid: boolean; errors: string[] }> {
  // Recalculate all checksums
  // Compare with stored checksums
  // Return validation result
}
```

### Event Types

All audit events are defined in `src/types/audit.ts`:

```typescript
type AuditEventType =
  | 'credential_scan_started'
  | 'credential_scan_completed'
  | 'credential_violation_detected'
  | 'phi_scan_started'
  | 'phi_scan_completed'
  | 'phi_violation_detected'
  | 'secret_encrypted'
  | 'secret_decrypted'
  | 'secret_rotated'
  | 'secret_rotation_warning'
  // ... more types
```

### Correlation IDs

Related events share a correlation ID for tracking:

```typescript
const correlationId = generateCorrelationId(); // timestamp-random

// All events from same scan
await auditCredentialScan(target, mode, violations, outcome, correlationId);
for (const violation of violations) {
  await auditCredentialViolation(file, pattern, severity, correlationId);
}
```

## Secrets Management

### Keystore Abstraction

The keystore interface allows platform-specific implementations:

```typescript
interface IKeystore {
  setSecret(key: string, value: string): Promise<void>;
  getSecret(key: string): Promise<string | null>;
  deleteSecret(key: string): Promise<void>;
  listSecrets(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
  getType(): string;
}
```

**Platform Detection:**
```typescript
static async create(type?: string): Promise<IKeystore> {
  if (type) {
    return createByType(type);
  }

  // Auto-detect
  switch (process.platform) {
    case 'darwin': return new MacOSKeychain();
    case 'win32': return new WindowsCredentialManager();
    case 'linux': return new LinuxSecretService();
    default: return new FileKeystore(); // Fallback
  }
}
```

### File-Based Encryption

Fallback keystore uses AES-256-GCM with PBKDF2:

```typescript
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

// Encryption
async encrypt(plaintext: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}
```

### Rotation Tracking

Secrets metadata tracks rotation schedules:

```typescript
interface SecretMetadata {
  key: string;
  lastRotated: string;      // ISO 8601
  nextRotation: string;     // ISO 8601
  rotationStatus: 'current' | 'expiring' | 'expired';
}

// Calculate status
calculateRotationStatus(nextRotation: string): RotationStatus {
  const daysUntil = Math.floor((new Date(nextRotation) - new Date()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 7) return 'expiring';
  return 'current';
}
```

## Testing

### Unit Tests

Located in `tests/unit/`:

```bash
# Run unit tests
npm test tests/unit

# Run specific test file
npm test tests/unit/credential-scanner.test.ts

# Watch mode
npm test -- --watch
```

### Integration Tests

Located in `tests/integration/`:

```bash
# Run integration tests
npm test tests/integration

# Run all tests
npm test
```

### Test Structure

```typescript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    // Arrange
    const input = createTestData();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBeDefined();
  });
});
```

### Test Fixtures

Sample data in `tests/fixtures/`:

```typescript
export const FAKE_CREDENTIALS = {
  awsKey: 'AKIAIOSFODNN7EXAMPLE',
  githubToken: 'ghp_1234567890abcdefghijklmnopqrstuv',
  // ... more test data
};

export const FAKE_PHI = {
  ssn: '123-45-6789',
  mrn: 'MRN-ABC123456',
  // ... more test PHI
};
```

## Adding New Features

### Adding a New Credential Pattern

1. **Define pattern** in `src/patterns/credential-patterns.ts`:
```typescript
{
  name: 'Slack API Token',
  pattern: /xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/gi,
  severity: 'high',
  confidence: 0.95,
  description: 'Slack API token'
}
```

2. **Add test** in `tests/unit/credential-patterns.test.ts`:
```typescript
it('should detect Slack API tokens', () => {
  const text = 'SLACK_TOKEN=xoxb-XXXX-XXXX-REDACTED_FOR_SECURITY';
  const violations = scanner.scanText(text, 'test.ts');

  expect(violations.length).toBe(1);
  expect(violations[0].pattern).toBe('Slack API Token');
});
```

3. **Add fixture** in `tests/fixtures/sample-credentials.ts`:
```typescript
export const FAKE_CREDENTIALS = {
  // ... existing
  slackToken: 'xoxb-XXXX-XXXX-REDACTED_FOR_SECURITY'
};
```

### Adding a New MCP Tool

1. **Create tool** in `src/tools/my-new-tool.ts`:
```typescript
export interface MyToolArgs {
  // Define arguments
}

export async function myNewTool(args: MyToolArgs): Promise<MyToolResult> {
  // Implement logic

  // Add audit logging
  await auditLogger.logEvent(...);

  return result;
}

export function formatMyToolResult(result: MyToolResult): string {
  // Format for display
}
```

2. **Register in server** (`src/server.ts`):
```typescript
// Import
import { myNewTool, formatMyToolResult } from './tools/my-new-tool.js';

// Add to ListToolsRequestSchema handler
{
  name: 'my_new_tool',
  description: '...',
  inputSchema: {
    // Define JSON schema
  }
}

// Add to CallToolRequestSchema handler
case 'my_new_tool': {
  const result = await myNewTool(args);
  const formatted = formatMyToolResult(result);
  return { content: [{ type: 'text', text: formatted }] };
}
```

3. **Add tests**:
```typescript
describe('myNewTool', () => {
  it('should work correctly', async () => {
    const result = await myNewTool({ /* args */ });
    expect(result).toBeDefined();
  });
});
```

### Adding Audit Event Types

1. **Define type** in `src/types/audit.ts`:
```typescript
export type AuditEventType =
  // ... existing types
  | 'my_new_event_type'
  | 'my_new_event_completed';
```

2. **Add helper** in `src/audit/audit-helper.ts`:
```typescript
export async function auditMyNewEvent(
  details: any,
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'my_new_event_type',
    'info',
    'success',
    getActor(),
    details,
    { correlationId }
  );
}
```

3. **Use in tool**:
```typescript
import { auditMyNewEvent } from '../audit/audit-helper.js';

// In tool implementation
await auditMyNewEvent({ /* details */ }, correlationId);
```

## Performance Considerations

### Large File Scanning

For directories with many files:

```typescript
// Process files in batches
const BATCH_SIZE = 10;
for (let i = 0; i < files.length; i += BATCH_SIZE) {
  const batch = files.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(file => scanFile(file)));
}
```

### Audit Log Size

Monitor audit log growth:

```bash
# Check metadata
const metadata = await auditLogger.getMetadata();
console.log(`Events: ${metadata.eventCount}`);

# Prune old events (>6 years)
const result = await auditLogger.pruneOldEvents();
console.log(`Pruned: ${result.pruned}, Retained: ${result.retained}`);
```

### Pattern Matching Optimization

- Use specific patterns over generic ones
- Anchor patterns when possible (`^`, `$`)
- Limit backtracking in regex
- Set appropriate confidence thresholds

## Security Considerations

### Credential Handling

- Never log decrypted secrets
- Clear sensitive data from memory after use
- Use constant-time comparison for secrets
- Validate all inputs

### Audit Log Protection

- Store with restrictive permissions (0600)
- Verify chain integrity regularly
- Monitor for tampering events
- Backup audit logs separately

### PHI Protection

- Minimize PHI in logs
- Flag all PHI access events
- Implement access controls
- Follow organizational HIPAA policies

## Deployment

### Production Build

```bash
npm run build
npm test
```

### Distribution

The MCP server can be distributed as:

1. **npm package**: Publish to npm registry
2. **Git repository**: Clone and build from source
3. **Binary**: Package with pkg or similar

### MCP Registration

Users add to their MCP config:

```json
{
  "mcpServers": {
    "security-compliance-mcp": {
      "command": "node",
      "args": ["/path/to/build/server.js"]
    }
  }
}
```

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep functions focused and testable

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Update documentation
6. Submit pull request

### Commit Messages

```
type(scope): description

- feat: New feature
- fix: Bug fix
- docs: Documentation
- test: Tests
- refactor: Code refactoring
```

## Troubleshooting

### Build Issues

```bash
# Clean build
rm -rf build/
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

### Test Failures

```bash
# Run tests in verbose mode
npm test -- --verbose

# Run specific test
npm test -- -t "test name pattern"

# Debug test
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Runtime Issues

- Check MCP server logs
- Verify configuration file
- Test individual tools
- Review audit log for errors

## Resources

- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/)
