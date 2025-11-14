# Component Documentation Templates

This file contains templates for auto-generating documentation entries for detected system components.

---

## Template 1: SYSTEM-COMPONENTS.md Entry

**Usage:** Use this template when documenting a component in `SYSTEM-COMPONENTS.md`

```markdown
### {componentName}

**Type:** {componentType}
**Location:** `{location}`
**Status:** {status}
**Criticality:** {criticality}

**Purpose:**
{purpose}

**Key Features:**
{features}

**Dependencies:**
{dependencies}

**Configuration:**
{configuration}

**Monitoring:**
{monitoring}

**Last Updated:** {lastUpdated}

---
```

**Placeholder Definitions:**
- `{componentName}`: Human-readable component name (e.g., "GCS Backup Workflow")
- `{componentType}`: Component type (automation | infrastructure | integration | protection | monitoring)
- `{location}`: Relative path to component (e.g., ".github/workflows/backup-to-gcs.yml")
- `{status}`: Current status (Active | Inactive | Deprecated | Planning)
- `{criticality}`: Criticality level (Critical | Important | Normal)
- `{purpose}`: Brief description of what this component does
- `{features}`: Bulleted list of key features or capabilities
- `{dependencies}`: List of dependencies (other components, services, credentials)
- `{configuration}`: Configuration requirements or environment variables
- `{monitoring}`: How to monitor or verify this component is working
- `{lastUpdated}`: ISO date of last update (YYYY-MM-DD)

**Example:**
```markdown
### GCS Backup Workflow

**Type:** automation
**Location:** `.github/workflows/backup-to-gcs.yml`
**Status:** Active
**Criticality:** Critical

**Purpose:**
Automated daily backup of workspace to Google Cloud Storage with 6-layer backup strategy.

**Key Features:**
- Scheduled daily backups at 2 AM UTC
- Incremental backup support
- PHI scanning before backup
- Automatic retention policy (7 daily, 4 weekly, 12 monthly)

**Dependencies:**
- Google Cloud Storage bucket: `workspace-backups-prod`
- Service account: `backup-service@project.iam.gserviceaccount.com`
- GitHub Actions environment variables

**Configuration:**
- `GCS_BUCKET`: Google Cloud Storage bucket name
- `GCS_CREDENTIALS`: Service account JSON key (GitHub secret)
- `BACKUP_RETENTION_DAYS`: Retention policy in days

**Monitoring:**
- GitHub Actions workflow status
- GCS bucket size monitoring
- Daily backup success notifications

**Last Updated:** 2025-11-14

---
```

---

## Template 2: WORKSPACE_ARCHITECTURE.md Section

**Usage:** Use this template for architectural/infrastructure components in `WORKSPACE_ARCHITECTURE.md`

```markdown
## {componentName}

**Category:** {architectureCategory}
**Type:** {componentType}
**Criticality:** {criticality}

### Overview

{architectureOverview}

### Architecture

{architectureDiagram}

**Components:**
{architectureComponents}

### Data Flow

{dataFlow}

### Integration Points

{integrationPoints}

### Security Considerations

{securityConsiderations}

### Failure Modes

{failureModes}

### Recovery Procedures

{recoveryProcedures}

---
```

**Placeholder Definitions:**
- `{componentName}`: Component name
- `{architectureCategory}`: Architecture category (Infrastructure | Security | Integration | Data Protection | Monitoring)
- `{componentType}`: Component type (infrastructure | protection | monitoring)
- `{criticality}`: Criticality level
- `{architectureOverview}`: High-level architectural description
- `{architectureDiagram}`: ASCII diagram or link to diagram
- `{architectureComponents}`: List of architectural components and their roles
- `{dataFlow}`: How data flows through the component
- `{integrationPoints}`: How this integrates with other systems
- `{securityConsiderations}`: Security and compliance considerations
- `{failureModes}`: Potential failure modes and their impact
- `{recoveryProcedures}`: How to recover from failures

**Example:**
```markdown
## 6-Layer Backup System

**Category:** Data Protection
**Type:** protection
**Criticality:** Critical

### Overview

Multi-layered backup strategy ensuring data durability and PHI compliance with automated daily backups, versioning, and disaster recovery capabilities.

### Architecture

```
┌─────────────────────┐
│  Local Workspace   │
└──────────┬──────────┘
           │ (daily 2 AM)
           ▼
┌─────────────────────┐
│  GCS Backup Layer   │
│  - Daily backups    │
│  - Incremental      │
│  - PHI scanning     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Retention Policy   │
│  - 7 daily          │
│  - 4 weekly         │
│  - 12 monthly       │
└─────────────────────┘
```

**Components:**
- GitHub Actions workflow (.github/workflows/backup-to-gcs.yml)
- GCS bucket (workspace-backups-prod)
- Backup validation service
- PHI scanner integration

### Data Flow

1. GitHub Actions triggers at 2 AM UTC daily
2. Workspace files are collected and PHI scanned
3. Incremental backup created (only changed files)
4. Backup uploaded to GCS with encryption
5. Retention policy applied to remove old backups
6. Validation check confirms backup integrity
7. Notification sent on success/failure

### Integration Points

- **Google Cloud Storage:** Primary backup storage
- **PHI Scanner:** Pre-backup compliance check
- **GitHub Actions:** Automation orchestration
- **Notification Service:** Slack/email alerts

### Security Considerations

- All backups encrypted at rest (AES-256)
- Service account with minimal IAM permissions
- PHI scanning before backup to prevent exposure
- Access logs maintained for compliance
- HIPAA-compliant storage configuration

### Failure Modes

- **GCS API Unavailable:** Retry with exponential backoff, alert after 3 failures
- **PHI Detected:** Backup blocked, alert sent to security team
- **Storage Quota Exceeded:** Alert sent, manual intervention required
- **Service Account Revoked:** Immediate failure, critical alert

### Recovery Procedures

1. Verify GCS bucket accessibility
2. List available backups: `gsutil ls gs://workspace-backups-prod/`
3. Download specific backup: `gsutil cp -r gs://workspace-backups-prod/YYYY-MM-DD ./restore/`
4. Validate backup integrity
5. Restore to workspace location
6. Verify restored files

---
```

---

## Template 3: START_HERE.md Bullet Point

**Usage:** Use this template for critical components in `START_HERE.md`

```markdown
- **{componentName}** ({componentType}): {oneLinerDescription} → [{location}]({location})
```

**Placeholder Definitions:**
- `{componentName}`: Component name
- `{componentType}`: Component type
- `{oneLinerDescription}`: Single sentence describing purpose
- `{location}`: Relative path to component

**Examples:**
```markdown
- **GCS Backup Workflow** (automation): Automated daily backups to Google Cloud Storage with PHI compliance → [.github/workflows/backup-to-gcs.yml](.github/workflows/backup-to-gcs.yml)

- **Service Account Authentication** (infrastructure): OAuth2 service account for Google Workspace API access → [google-workspace-oauth-setup/service-account.json](google-workspace-oauth-setup/service-account.json)

- **Pre-Commit Security Hook** (protection): Validates no credentials or PHI before commits → [scripts/pre-commit-hook.sh](scripts/pre-commit-hook.sh)

- **Workspace Health Monitor** (monitoring): Real-time MCP performance and autonomous deployment tracking → [scripts/workspace-health-check.sh](scripts/workspace-health-check.sh)
```

---

## Template 4: WORKFLOW_PLAYBOOK.md Entry (Automation Components)

**Usage:** Use this template for automation components in `WORKFLOW_PLAYBOOK.md`

```markdown
### {componentName}

**Type:** {componentType}
**Trigger:** {trigger}
**Frequency:** {frequency}
**Location:** `{location}`

**Purpose:**
{purpose}

**How to Use:**

{usageInstructions}

**Configuration:**

{configurationSteps}

**Monitoring:**

{monitoringInstructions}

**Troubleshooting:**

{troubleshootingGuide}

---
```

**Placeholder Definitions:**
- `{componentName}`: Workflow name
- `{componentType}`: Type (should be "automation")
- `{trigger}`: What triggers this workflow (schedule | manual | event)
- `{frequency}`: How often it runs (daily | weekly | on-demand)
- `{location}`: Path to workflow file
- `{purpose}`: What this workflow does
- `{usageInstructions}`: Step-by-step usage instructions
- `{configurationSteps}`: How to configure or customize
- `{monitoringInstructions}`: How to monitor execution
- `{troubleshootingGuide}`: Common issues and solutions

**Example:**
```markdown
### GCS Backup Workflow

**Type:** automation
**Trigger:** schedule
**Frequency:** daily at 2 AM UTC
**Location:** `.github/workflows/backup-to-gcs.yml`

**Purpose:**
Automatically backs up the entire workspace to Google Cloud Storage with PHI compliance scanning and versioned retention.

**How to Use:**

**Automatic Execution:**
The workflow runs automatically daily at 2 AM UTC. No manual intervention required.

**Manual Execution:**
1. Go to GitHub Actions tab
2. Select "GCS Backup Workflow"
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow" button

**Configuration:**

**Initial Setup:**
1. Create GCS bucket: `gsutil mb gs://workspace-backups-prod`
2. Create service account with Storage Admin role
3. Download service account JSON key
4. Add to GitHub Secrets as `GCS_CREDENTIALS`
5. Update `.github/workflows/backup-to-gcs.yml` with bucket name

**Customization:**
- Edit `schedule` cron expression for different timing
- Adjust retention policy in workflow configuration
- Enable/disable PHI scanning with `ENABLE_PHI_SCAN` variable

**Monitoring:**

**GitHub Actions:**
- Check workflow status at: https://github.com/{org}/{repo}/actions
- Green checkmark = success, Red X = failure

**GCS Bucket:**
- Verify backups: `gsutil ls gs://workspace-backups-prod/`
- Check latest backup: `gsutil ls -l gs://workspace-backups-prod/ | tail -1`

**Notifications:**
- Slack notifications sent to #backups channel
- Email alerts for failures

**Troubleshooting:**

**Workflow Fails with "Permission Denied":**
- Verify service account has Storage Admin role
- Check `GCS_CREDENTIALS` secret is valid
- Ensure GCS API is enabled

**Backup Size Exceeds Quota:**
- Review retention policy
- Clean up old backups manually
- Increase GCS quota in Google Cloud Console

**PHI Scanner Blocks Backup:**
- Review detected PHI in workflow logs
- Remove or encrypt sensitive data
- Update PHI scanning exclusions if false positive

---
```

---

## Template 5: Component Comparison Table

**Usage:** Use this template when documenting multiple similar components in any documentation file

```markdown
## {categoryName} Components

| Component | Type | Status | Criticality | Purpose | Location |
|-----------|------|--------|-------------|---------|----------|
{tableRows}

**Legend:**
- **Status:** ✅ Active | ⏸️ Inactive | 🚧 Planning | ⚠️ Deprecated
- **Criticality:** 🔴 Critical | 🟡 Important | 🟢 Normal
```

**Placeholder Definitions:**
- `{categoryName}`: Category name (e.g., "Backup & Recovery", "Monitoring")
- `{tableRows}`: One row per component in format: `| ComponentName | Type | Status | Criticality | Purpose | Location |`

**Example:**
```markdown
## Backup & Recovery Components

| Component | Type | Status | Criticality | Purpose | Location |
|-----------|------|--------|-------------|---------|----------|
| GCS Backup Workflow | automation | ✅ Active | 🔴 Critical | Daily workspace backup to GCS | `.github/workflows/backup-to-gcs.yml` |
| Local Snapshot Script | automation | ✅ Active | 🟡 Important | Hourly local snapshots | `scripts/snapshot-local.sh` |
| Restore Utility | infrastructure | ✅ Active | 🔴 Critical | Backup restoration tool | `scripts/restore-from-backup.sh` |
| PHI Scanner | protection | ✅ Active | 🔴 Critical | Pre-backup PHI detection | `security/phi-scanner.sh` |

**Legend:**
- **Status:** ✅ Active | ⏸️ Inactive | 🚧 Planning | ⚠️ Deprecated
- **Criticality:** 🔴 Critical | 🟡 Important | 🟢 Normal
```

---

## Template Generation Guidelines

When auto-generating documentation from detected components:

1. **Extract Information:**
   - Parse component files (README.md, config files, scripts)
   - Extract metadata from YAML frontmatter or comments
   - Analyze file content for purpose and features

2. **Classify Component:**
   - Determine component type using detection patterns
   - Calculate criticality using criticalityRules
   - Assess architectural significance

3. **Select Template:**
   - Critical components: Templates 1, 2, 3
   - Important components: Templates 1, 2
   - Normal components: Template 1
   - Automation components: Templates 1, 4
   - Related components: Template 5

4. **Fill Placeholders:**
   - Replace all `{placeholder}` values with actual data
   - Use empty string or "Not configured" for missing data
   - Ensure markdown formatting is valid

5. **Validation:**
   - Verify no unfilled placeholders remain
   - Check markdown syntax is valid
   - Ensure links are relative and correct
   - Validate against documentation requirements

---

## Advanced Template Features

### Conditional Sections

Use conditional logic to include/exclude sections based on component properties:

```markdown
{#if criticality === 'critical'}
### Critical Component Checklist
- [ ] Documented in START_HERE.md
- [ ] Documented in WORKSPACE_ARCHITECTURE.md
- [ ] Monitoring enabled
- [ ] Backup configured
- [ ] Recovery procedure tested
{/if}
```

### Auto-Generated Timestamps

Always include auto-generated timestamps in documentation:

```markdown
**Last Updated:** {currentDate}
**Auto-Generated:** {generationTimestamp}
**Detection Confidence:** {confidenceScore}
```

### Status Badges

Use consistent status indicators:

```markdown
**Status:** {statusBadge}
```

Where `{statusBadge}` maps to:
- `Active` → ✅ Active
- `Inactive` → ⏸️ Inactive
- `Planning` → 🚧 Planning
- `Deprecated` → ⚠️ Deprecated

### Criticality Indicators

Use consistent criticality indicators:

```markdown
**Criticality:** {criticalityBadge}
```

Where `{criticalityBadge}` maps to:
- `Critical` → 🔴 Critical
- `Important` → 🟡 Important
- `Normal` → 🟢 Normal

---

## Template Metadata

**Version:** 1.0.0
**Phase:** 5
**Feature:** component-detection
**Created:** 2025-11-14
**Last Updated:** 2025-11-14

**Template Count:** 5 main templates + advanced features
**Supported Locations:**
- SYSTEM-COMPONENTS.md (Template 1, 5)
- WORKSPACE_ARCHITECTURE.md (Template 2, 5)
- START_HERE.md (Template 3)
- WORKFLOW_PLAYBOOK.md (Template 4, 5)

**Placeholder Standard:** `{camelCase}` with curly braces
