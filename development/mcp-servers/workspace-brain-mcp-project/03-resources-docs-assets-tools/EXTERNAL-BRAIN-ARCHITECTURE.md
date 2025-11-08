---
type: guide
tags: [workspace-brain-mcp, architecture, external-brain, telemetry, persistence]
---

# External Brain Architecture Guide

**Purpose:** Technical architecture documentation for workspace-brain MCP's external persistence layer.

**Version:** 1.0.0 (Phase 1)
**Last Updated:** 2025-10-31

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Directory Structure](#directory-structure)
4. [Data Flow](#data-flow)
5. [Storage Architecture](#storage-architecture)
6. [MCP Integration Points](#mcp-integration-points)
7. [Performance Characteristics](#performance-characteristics)
8. [Security and Privacy](#security-and-privacy)

---

## Overview

### What is the External Brain?

The **External Brain** is a persistent, workspace-independent data store located at `~/workspace-brain/` that provides:

- **Cross-session memory** - Survives Claude Code restarts
- **Cross-workspace intelligence** - Learns from all workspace activity
- **Workspace-independent storage** - Not tied to any single project
- **Centralized analytics** - Aggregates data from multiple workflows
- **Long-term learning** - Builds knowledge base over weeks/months

### Why External Storage?

**Problem:** Claude Code conversations are ephemeral. Without external persistence:
- ❌ No memory across sessions
- ❌ Repeated troubleshooting of same issues
- ❌ Loss of performance metrics and patterns
- ❌ Manual tracking of automation opportunities
- ❌ No cumulative learning from past work

**Solution:** External Brain provides:
- ✅ Persistent telemetry across all sessions
- ✅ Cumulative pattern learning
- ✅ Historical analytics and trends
- ✅ Automated opportunity detection
- ✅ Cross-workspace intelligence sharing

---

## Architecture Principles

### 1. Separation of Concerns

```
┌─────────────────────────────────────────────────────┐
│ Workspace (Project-Specific)                        │
│ - Source code                                       │
│ - Project docs                                      │
│ - Temp workflows                                    │
│ - Git history                                       │
└─────────────────────────────────────────────────────┘
                      ↕
         Cross-Session Data Exchange
                      ↕
┌─────────────────────────────────────────────────────┐
│ External Brain (Global/Persistent)                  │
│ - Telemetry logs                                    │
│ - Learned patterns                                  │
│ - Analytics reports                                 │
│ - Performance cache                                 │
└─────────────────────────────────────────────────────┘
```

**Workspace** = Project-specific, version-controlled, transient
**External Brain** = Global, persistent, accumulates over time

### 2. JSONL for Telemetry, JSON for Configuration

**JSONL (JSON Lines)** for append-only telemetry:
- Fast appends (no file rewrite)
- Easy streaming and parsing
- Efficient for large datasets
- Simple backup/archival

**JSON** for structured configuration and cache:
- Human-readable
- Easy editing
- Schema validation
- Atomic updates

### 3. Category-Based Organization

Data organized by purpose, not chronology:

```
~/workspace-brain/
├── telemetry/      # Time-series event logs
├── analytics/      # Computed insights
├── learning/       # Patterns and knowledge
├── cache/          # Performance optimization
└── backups/        # Data exports and archival
```

### 4. Minimal Write Latency

- Async file writes where possible
- Buffered writes for batch operations
- No blocking on non-critical operations
- Target: <5ms for single event logging

---

## Directory Structure

### Complete Layout

```
~/workspace-brain/
├── .config/
│   └── config.json                    # External brain configuration
├── README.md                          # Quick reference for humans
│
├── telemetry/                         # Time-series event logs
│   ├── task-log.jsonl                 # Task completion events
│   ├── mcp-usage-log.jsonl            # MCP tool invocations
│   ├── workflow-log.jsonl             # Workflow state changes
│   └── archives/                      # Old telemetry (>90 days)
│       └── task-log-2025-Q3.jsonl.gz
│
├── analytics/                         # Computed insights
│   ├── weekly-summaries/              # Auto-generated weekly reports
│   │   ├── 2025-W43.json
│   │   └── 2025-W43.md
│   ├── patterns/                      # Detected patterns
│   │   ├── automation-opportunities.json
│   │   └── tool-usage-patterns.json
│   └── dashboards/                    # Dashboard data (Phase 2+)
│       └── real-time-metrics.json
│
├── learning/                          # Knowledge base
│   ├── issue-patterns.json            # Recorded patterns for reuse
│   ├── preventive-checks.json         # Checks to run proactively
│   └── decision-history.json          # Architecture decisions (Phase 2)
│
├── cache/                             # Performance optimization
│   ├── project-indexes/               # Project file catalogs
│   │   └── *.json
│   ├── mcp-responses/                 # Expensive MCP call results
│   │   └── *.json
│   └── computed-metrics/              # Pre-calculated analytics
│       └── *.json
│
└── backups/                           # Data exports and archival
    ├── manual-exports/                # User-triggered exports
    │   └── telemetry-export-*.json
    └── auto-archives/                 # Automatic compression (Phase 2)
        └── *.tar.gz
```

### Storage Quotas (Future)

Phase 2+ will implement storage management:
- Telemetry: 100MB max (auto-archive old data)
- Analytics: 50MB max
- Learning: 20MB max
- Cache: 200MB max (LRU eviction)
- Backups: 500MB max

---

## Data Flow

### 1. Telemetry Ingestion

```
┌──────────────────────────────────────────────────────────────┐
│ Claude Code Session                                          │
│                                                              │
│  User Request → Task Execution → workspace-brain.log_event() │
└──────────────────────────────────────────────────────────────┘
                            ↓
                 ┌──────────────────────┐
                 │ workspace-brain MCP  │
                 │ handleLogEvent()     │
                 └──────────────────────┘
                            ↓
                ┌───────────────────────────┐
                │ Write to JSONL file       │
                │ ~/workspace-brain/        │
                │   telemetry/task-log.jsonl│
                └───────────────────────────┘
                            ↓
                   [Persisted to disk]
```

**Event Schema:**
```json
{
  "id": "uuid-v4",
  "type": "task|mcp-usage|workflow",
  "timestamp": "ISO-8601",
  "data": {
    "workflow_name": "string",
    "task_type": "string",
    "duration_minutes": "number",
    "tools_used": ["array"],
    "complexity": "number",
    "outcome": "completed|failed|blocked",
    "metadata": {}
  }
}
```

### 2. Analytics Generation

```
┌────────────────────────────────────────────────────┐
│ Trigger: User request OR Scheduled job             │
│ workspace-brain.generate_weekly_summary()          │
└────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Read telemetry JSONL files    │
        │ Filter by date range           │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Compute aggregations           │
        │ - Total tasks                  │
        │ - Tool usage frequency         │
        │ - Average duration             │
        │ - Outcome distribution         │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Detect patterns                │
        │ - Repeated tasks               │
        │ - Tool combinations            │
        │ - Automation opportunities     │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Write analytics output         │
        │ ~/workspace-brain/analytics/   │
        │   weekly-summaries/2025-W43.json│
        └───────────────────────────────┘
```

### 3. Learning System

```
┌────────────────────────────────────────────────────┐
│ Troubleshooting Session                            │
│ - Multiple diagnostic commands run                 │
│ - Issue resolved                                   │
│ - Claude runs Post-Resolution Checklist            │
└────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ workspace-brain.record_pattern()│
        │ {                              │
        │   name: "issue name",          │
        │   steps: ["fix steps"],        │
        │   tools: ["tools used"]        │
        │ }                              │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Store in learning/             │
        │   issue-patterns.json          │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Future session:                │
        │ get_similar_patterns()         │
        │ → Returns learned solution     │
        └───────────────────────────────┘
```

### 4. Cache System

```
┌────────────────────────────────────────────────────┐
│ Expensive operation (e.g., project indexing)       │
└────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Check cache:                   │
        │ workspace-brain.cache_get()    │
        └───────────────────────────────┘
              ↓                    ↓
         Cache Hit          Cache Miss
              ↓                    ↓
        Return cached      Execute operation
        value (fast)             ↓
                          Store result:
                          cache_set(key, value, ttl)
                                 ↓
                          Return fresh value
```

---

## Storage Architecture

### File Format Standards

#### JSONL for Telemetry
```jsonl
{"id":"uuid","type":"task","timestamp":"2025-10-31T10:00:00Z","data":{...}}
{"id":"uuid","type":"task","timestamp":"2025-10-31T10:05:00Z","data":{...}}
```

**Benefits:**
- Append-only (fast writes)
- No file locking needed
- Easy to stream
- Simple line-by-line parsing

#### JSON for Configuration
```json
{
  "pattern_id": "uuid",
  "name": "Pattern Name",
  "category": "workflow",
  "recorded_at": "2025-10-31T10:00:00Z",
  "data": {...}
}
```

**Benefits:**
- Human-readable
- Easy editing
- Schema validation
- Atomic updates

### Indexing Strategy

**Phase 1:** No indexes (small datasets, <1MB)
**Phase 2:** Add indexes for:
- Timestamp-based queries (binary search on sorted JSONL)
- Tool usage lookups (in-memory hash map)
- Pattern similarity (TF-IDF vectors)

### Archival Strategy

**Trigger:** Data older than 90 days
**Process:**
1. Move JSONL files to `telemetry/archives/`
2. Compress with gzip (10:1 compression typical)
3. Update indexes
4. Optional: Upload to cloud storage

**Retention:**
- Active telemetry: 90 days
- Archives: 1 year (compressed)
- Analytics summaries: Indefinite (small size)
- Learning patterns: Indefinite

---

## MCP Integration Points

### 1. learning-optimizer MCP Integration

**Status:** Planned (not yet implemented)

```
┌────────────────────────────────────────────────────┐
│ learning-optimizer.track_issue()                   │
│ (Domain-specific issue tracking)                   │
└────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ workspace-brain.record_pattern()│
        │ (Generic pattern storage)      │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ External brain stores pattern │
        │ learning/issue-patterns.json   │
        └───────────────────────────────┘
```

**Integration Pattern:**
- learning-optimizer provides domain-specific logic (duplicate detection, categorization)
- workspace-brain provides persistence layer
- Both MCPs can query shared pattern database

### 2. project-management MCP Integration

**Status:** Planned

```
┌────────────────────────────────────────────────────┐
│ project-management.wrap_up_project()               │
└────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Extract metrics:               │
        │ - Total time spent             │
        │ - Tasks completed              │
        │ - Tools used                   │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ workspace-brain.log_event()    │
        │ type: "workflow"               │
        └───────────────────────────────┘
```

**Integration Pattern:**
- project-management tracks workflow state
- workspace-brain logs completion events
- Analytics aggregates across all projects

### 3. task-executor MCP Integration

**Status:** Active

```
┌────────────────────────────────────────────────────┐
│ task-executor.complete_task()                      │
└────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ workspace-brain.log_event()    │
        │ type: "task"                   │
        │ data: {                        │
        │   workflow: "name",            │
        │   duration: minutes            │
        │ }                              │
        └───────────────────────────────┘
```

**Integration Pattern:**
- Manual logging (user must explicitly call log_event)
- Future: Automatic logging via task-executor hooks

### 4. parallelization MCP Integration

**Status:** Planned

```
┌────────────────────────────────────────────────────┐
│ parallelization.execute_parallel_workflow()        │
└────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Log each agent's performance:  │
        │ - Execution time               │
        │ - Conflict rate                │
        │ - Success rate                 │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │ workspace-brain.log_event()    │
        │ type: "parallel-execution"     │
        └───────────────────────────────┘
```

**Use Case:** Track parallel execution efficiency over time

---

## Performance Characteristics

### Write Performance (Phase 1)

| Operation | Target | Actual (Smoke Test) |
|-----------|--------|---------------------|
| log_event | <5ms | 2ms ✅ |
| record_pattern | <10ms | Not measured |
| cache_set | <5ms | Not measured |
| export_data | <100ms | Not measured |

### Read Performance (Phase 1)

| Operation | Target | Actual (Smoke Test) |
|-----------|--------|---------------------|
| query_events | <10ms | 0ms ✅ |
| get_event_stats | <20ms | Not measured |
| get_similar_patterns | <50ms | Not measured |
| cache_get | <5ms | **Bug: returns null** ⚠️ |

### Scalability Targets

| Metric | Phase 1 (Now) | Phase 2 (Next) | Phase 3 (Future) |
|--------|---------------|----------------|------------------|
| Total events | 10,000 | 100,000 | 1,000,000 |
| Storage size | 10MB | 100MB | 1GB |
| Query latency | <50ms | <100ms | <200ms |
| Write latency | <10ms | <10ms | <10ms |

---

## Security and Privacy

### PHI Protection

**Workspace-brain does NOT store PHI** by design:

❌ **Never logged:**
- Patient names, MRNs, DOBs
- PHI from Google Sheets
- Sensitive healthcare data

✅ **Safe to log:**
- Workflow names (e.g., "patient-search-feature")
- Task types (e.g., "backend-implementation")
- Tool names (e.g., "project-management MCP")
- Duration metrics
- Generic error patterns

**Enforcement:**
- Pre-commit hooks scan for PHI in workspace
- External brain is gitignored (never committed)
- User responsibility to not include PHI in metadata

### Access Control

**File Permissions:**
```bash
~/workspace-brain/
└── drwxr-xr-x (755) - User read/write, others read
```

**Future (Phase 2+):**
- Encrypt sensitive cache data at rest
- API key encryption for MCP credentials
- Audit log for all external brain writes

### Backup Strategy

**Phase 1:** Manual exports via `export_data()`
**Phase 2:** Automatic daily backups to:
- Local: `~/workspace-brain/backups/auto-archives/`
- Cloud: Optional S3/Dropbox integration

---

## Next Steps

### Phase 1.1 (Immediate)
- Fix cache_get and cache_invalidate bugs
- Add integration tests for all 15 tools
- Configure learning-optimizer domains

### Phase 2 (Short-term)
- Implement automatic archival with compression
- Add learning-optimizer integration hooks
- Create telemetry dashboard
- Add project-management workflow logging

### Phase 3 (Long-term)
- Cross-MCP performance analytics
- Machine learning for pattern detection
- Predictive automation recommendations
- Real-time dashboard with WebSocket

---

## References

- **Smoke Test Results:** `temp/workflows/workspace-brain-smoke-tests/SMOKE-TEST-RESULTS.md`
- **MCP Source Code:** `mcp-server-development/workspace-brain-mcp-project/04-product-under-development/src/index.ts`
- **External Brain Location:** `~/workspace-brain/`
- **Configuration:** `~/.claude.json` (user scope)
