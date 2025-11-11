---
type: specification
tags: [mcp-specification, workspace-brain, intelligence-layer, file-storage]
---

# Workspace Brain MCP Server - Specification v1.0

**Status:** Phase 1 (File-based storage)
**Created:** 2025-10-31
**Version:** 1.0.0

## Overview

The Workspace Brain MCP provides external storage and intelligence capabilities for workspace data. It keeps the git repository lean by storing heavy data (telemetry, analytics, cache) outside the workspace at `~/workspace-brain/`.

### Design Philosophy

- **Separation of concerns:** Code (in git) vs. Data (external brain)
- **Performance:** Fast local file operations in Phase 1
- **Scalability:** Designed for future SQLite migration (Phase 2)
- **Safety:** All operations create directories if missing, handle errors gracefully

## Storage Architecture

### External Brain Location
```
~/workspace-brain/
├── telemetry/
│   ├── task-log.jsonl          # Append-only task events
│   ├── mcp-usage.jsonl         # MCP call logs
│   └── archives/               # Compressed old logs
├── analytics/
│   ├── weekly-summaries/       # Generated reports (markdown)
│   ├── patterns/               # Detected patterns (JSON)
│   └── dashboards/             # Dashboard data (JSON)
├── learning/
│   ├── issue-patterns.json     # Accumulated patterns
│   ├── solution-library.json   # Solutions database
│   └── preventive-checks.json  # Proactive checks
├── cache/
│   ├── project-indexes/        # File indexes (regenerable)
│   ├── computed-metrics/       # Expensive calculations
│   └── mcp-responses/          # Cached MCP results
└── backups/
    └── manual-exports/         # On-demand exports
```

### Phase 1: File-Based Storage

**Format:** JSONL (JSON Lines) for append-only logs
**Reasoning:**
- Simple to implement
- Human-readable for debugging
- Supports streaming/appending
- No database dependencies
- Fast enough for Phase 1 volumes (<10k events/month)

**Performance Targets:**
- Write (append): <5ms per event
- Read (full scan): <100ms for 10k events
- Query (filtered): <200ms for complex filters

---

## Tools Specification (15 Total)

### Category 1: Telemetry Tools

#### 1. `log_event`
**Purpose:** Log a telemetry event to external brain

**Parameters:**
```typescript
{
  event_type: string;              // "task", "mcp-usage", "workflow", etc.
  event_data: {
    timestamp?: string;            // ISO 8601 (auto-generated if omitted)
    workflow_name?: string;
    task_type?: string;
    duration_minutes?: number;
    tools_used?: string[];
    complexity?: number;           // 1-10
    outcome?: "completed" | "failed" | "blocked";
    metadata?: Record<string, any>;
  };
}
```

**Returns:**
```typescript
{
  success: boolean;
  event_id: string;                // Generated UUID
  logged_at: string;               // ISO 8601
  file_path: string;               // Where event was logged
}
```

**File Format (JSONL):**
```json
{"id":"uuid","type":"task","timestamp":"2025-10-31T10:00:00Z","data":{...}}
{"id":"uuid","type":"mcp-usage","timestamp":"2025-10-31T10:01:00Z","data":{...}}
```

**Error Handling:**
- Create telemetry directory if missing
- Handle file write errors gracefully
- Return error message if logging fails

---

#### 2. `query_events`
**Purpose:** Query events with filters and time range

**Parameters:**
```typescript
{
  filters?: {
    event_type?: string;           // Filter by type
    workflow_name?: string;
    task_type?: string;
    tools_used?: string[];         // Events using ANY of these tools
    outcome?: string;
  };
  time_range?: {
    start?: string;                // ISO 8601
    end?: string;                  // ISO 8601
  };
  limit?: number;                  // Max results (default: 100)
  sort?: "asc" | "desc";           // By timestamp (default: desc)
}
```

**Returns:**
```typescript
{
  success: boolean;
  events: Array<{
    id: string;
    type: string;
    timestamp: string;
    data: Record<string, any>;
  }>;
  count: number;
  query_time_ms: number;
}
```

**Implementation:**
- Read JSONL files line by line
- Apply filters in memory
- Sort and limit results
- Track query performance

---

#### 3. `get_event_stats`
**Purpose:** Get statistics for specific metric

**Parameters:**
```typescript
{
  metric: "count" | "avg_duration" | "tool_usage" | "outcome_distribution";
  filters?: {                      // Same as query_events
    event_type?: string;
    task_type?: string;
    time_range?: {...};
  };
  group_by?: "type" | "day" | "week" | "month";
}
```

**Returns:**
```typescript
{
  success: boolean;
  metric: string;
  stats: {
    // For "count":
    total?: number;
    by_group?: Record<string, number>;

    // For "avg_duration":
    average?: number;
    min?: number;
    max?: number;

    // For "tool_usage":
    tool_counts?: Record<string, number>;

    // For "outcome_distribution":
    outcomes?: Record<string, number>;
  };
}
```

---

### Category 2: Analytics Tools

#### 4. `generate_weekly_summary`
**Purpose:** Create weekly analytics report

**Parameters:**
```typescript
{
  week_start?: string;             // ISO 8601 date (default: last Monday)
  include_sections?: string[];     // ["summary", "patterns", "opportunities"]
  output_format?: "markdown" | "json";
}
```

**Returns:**
```typescript
{
  success: boolean;
  summary: string;                 // Markdown or JSON
  file_path: string;               // Where summary was saved
  stats: {
    total_tasks: number;
    total_time_hours: number;
    most_common_task: string;
    automation_opportunities: number;
  };
}
```

**Output File:** `~/workspace-brain/analytics/weekly-summaries/YYYY-WXX.md`

---

#### 5. `get_automation_opportunities`
**Purpose:** Find high-value automation targets

**Parameters:**
```typescript
{
  time_range?: {
    start?: string;
    end?: string;
  };
  min_frequency?: number;          // Minimum occurrences (default: 3)
  min_duration?: number;           // Minimum avg duration (default: 15 min)
  sort_by?: "frequency" | "time_savings" | "score";
}
```

**Returns:**
```typescript
{
  success: boolean;
  opportunities: Array<{
    pattern: string;
    type: "skill" | "orchestrator" | "template";
    priority: "high" | "medium" | "low";
    frequency: number;
    avg_duration_minutes: number;
    estimated_savings_hours: number;
    automation_score: number;
    suggestion: string;
    implementation: {
      effort: "low" | "medium" | "high";
      approach: string;
      steps: string[];
    };
  }>;
  total_potential_savings_hours: number;
}
```

**Scoring Algorithm:**
```
score = frequency * avg_duration * (1 - complexity/10)
```

---

#### 6. `get_tool_usage_stats`
**Purpose:** Tool usage statistics

**Parameters:**
```typescript
{
  time_range?: {...};
  group_by?: "tool" | "day" | "week";
  include_combinations?: boolean;   // Include tool pairs (default: false)
}
```

**Returns:**
```typescript
{
  success: boolean;
  tool_stats: Array<{
    tool_name: string;
    usage_count: number;
    avg_duration_minutes?: number;
    most_common_context?: string;
  }>;
  combinations?: Array<{
    tools: string[];
    frequency: number;
  }>;
}
```

---

### Category 3: Learning Tools

#### 7. `record_pattern`
**Purpose:** Record discovered pattern for learning

**Parameters:**
```typescript
{
  pattern: {
    name: string;
    category: string;              // "workflow", "bug-fix", "feature", etc.
    description: string;
    frequency?: number;
    tools_involved?: string[];
    steps?: string[];
    notes?: string;
  };
}
```

**Returns:**
```typescript
{
  success: boolean;
  pattern_id: string;
  stored_at: string;               // File path
}
```

**Storage:** `~/workspace-brain/learning/issue-patterns.json`

---

#### 8. `get_similar_patterns`
**Purpose:** Find similar patterns by query

**Parameters:**
```typescript
{
  query: string;                   // Pattern name or description
  category?: string;
  limit?: number;                  // Default: 5
  similarity_threshold?: number;   // 0-1 (default: 0.6)
}
```

**Returns:**
```typescript
{
  success: boolean;
  patterns: Array<{
    pattern_id: string;
    name: string;
    category: string;
    description: string;
    similarity_score: number;
    tools_involved: string[];
  }>;
}
```

**Similarity Algorithm:** Simple keyword matching in Phase 1

---

#### 9. `get_preventive_checks`
**Purpose:** Get preventive checks recommendations

**Parameters:**
```typescript
{
  context?: string;                // "pre-commit", "deployment", etc.
  category?: string;
}
```

**Returns:**
```typescript
{
  success: boolean;
  checks: Array<{
    check_id: string;
    name: string;
    description: string;
    when_to_run: string;
    automated: boolean;
  }>;
}
```

---

### Category 4: Cache Tools

#### 10. `cache_set`
**Purpose:** Store cached value with TTL

**Parameters:**
```typescript
{
  key: string;
  value: any;                      // JSON-serializable
  ttl_seconds?: number;            // Default: 3600 (1 hour)
  category?: string;               // "project-index", "metrics", etc.
}
```

**Returns:**
```typescript
{
  success: boolean;
  key: string;
  expires_at: string;              // ISO 8601
  file_path: string;
}
```

**Storage Format:**
```json
{
  "key": "project-index-main",
  "value": {...},
  "cached_at": "2025-10-31T10:00:00Z",
  "expires_at": "2025-10-31T11:00:00Z"
}
```

---

#### 11. `cache_get`
**Purpose:** Retrieve cached value

**Parameters:**
```typescript
{
  key: string;
}
```

**Returns:**
```typescript
{
  success: boolean;
  value: any | null;               // null if expired or not found
  cached_at?: string;
  expires_at?: string;
  expired: boolean;
}
```

**Behavior:**
- Return null if key doesn't exist
- Return null if TTL expired
- Delete expired cache files automatically

---

#### 12. `cache_invalidate`
**Purpose:** Invalidate cache by pattern

**Parameters:**
```typescript
{
  pattern: string;                 // Glob pattern or exact key
  category?: string;
}
```

**Returns:**
```typescript
{
  success: boolean;
  invalidated_count: number;
  keys_removed: string[];
}
```

---

### Category 5: Maintenance Tools

#### 13. `archive_old_data`
**Purpose:** Archive data older than specified date

**Parameters:**
```typescript
{
  before_date: string;             // ISO 8601
  data_type?: "telemetry" | "analytics" | "all";
  compress?: boolean;              // Default: true (gzip)
}
```

**Returns:**
```typescript
{
  success: boolean;
  archived_count: number;
  compressed_size_mb: number;
  archive_path: string;
}
```

**Implementation:**
- Move old JSONL entries to archives/
- Compress with gzip
- Update active logs (remove archived entries)

---

#### 14. `export_data`
**Purpose:** Export data in specified format

**Parameters:**
```typescript
{
  data_type: "telemetry" | "analytics" | "learning" | "all";
  format: "json" | "csv" | "jsonl";
  filters?: {...};                 // Same as query_events
  output_path?: string;            // Default: backups/manual-exports/
}
```

**Returns:**
```typescript
{
  success: boolean;
  export_path: string;
  record_count: number;
  file_size_mb: number;
}
```

---

#### 15. `get_storage_stats`
**Purpose:** Get storage usage statistics

**Parameters:**
```typescript
{
  include_breakdown?: boolean;     // Breakdown by category (default: true)
}
```

**Returns:**
```typescript
{
  success: boolean;
  total_size_mb: number;
  breakdown: {
    telemetry_mb: number;
    analytics_mb: number;
    learning_mb: number;
    cache_mb: number;
    backups_mb: number;
  };
  file_counts: {
    telemetry: number;
    analytics: number;
    cache: number;
  };
  oldest_event: string;            // ISO 8601
  newest_event: string;
}
```

---

## Error Handling Strategy

### File Operations
- **Missing directories:** Create automatically with proper permissions
- **File not found:** Return empty results, don't error
- **Write failures:** Log error, return success: false with message
- **Permission errors:** Return clear error message with path

### Data Validation
- **Invalid JSON:** Skip malformed lines, log warning
- **Missing required fields:** Use defaults where possible
- **Type mismatches:** Coerce when safe, error otherwise

### Performance
- **Large files:** Implement streaming for files >10MB
- **Slow queries:** Add timeout (default: 30 seconds)
- **Memory limits:** Process in chunks if needed

---

## Integration Patterns

### With Performance Monitor MCP
```typescript
// Performance Monitor logs metrics to workspace-brain
workspace_brain.log_event({
  event_type: "mcp-usage",
  event_data: {
    mcp_server: "performance-monitor",
    tool_name: "track_performance",
    duration_minutes: 0.05
  }
});
```

### With Task Executor MCP
```typescript
// Task Executor logs workflow completion
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "bug-fix-123",
    task_count: 8,
    duration_minutes: 110,
    outcome: "completed"
  }
});
```

### With Learning Optimizer MCP
```typescript
// Learning Optimizer records patterns
workspace_brain.record_pattern({
  pattern: {
    name: "auth-bug-fix-pattern",
    category: "bug-fix",
    tools_involved: ["grep", "edit", "bash"],
    frequency: 8
  }
});
```

---

## Security & Privacy

### Data Sanitization
- **Never log:** File contents, credentials, PHI, user data
- **Always log:** Metadata only (task types, tool names, durations)

### File Permissions
```bash
~/workspace-brain/     # 700 (owner only)
*.jsonl               # 600 (owner read/write)
*.json                # 600 (owner read/write)
```

### Access Control
- Only accessible through MCP tools (no direct file access recommended)
- MCP runs in user context (inherits user permissions)

---

## Testing Strategy

### Unit Tests
- Each tool function tested independently
- Mock file system operations
- Test error handling paths

### Integration Tests
- Full read/write cycles
- Query performance benchmarks
- Archive and export workflows

### Smoke Tests
1. Log 10 sample events
2. Query events with filters
3. Generate weekly summary
4. Set and get cache values
5. Check storage stats

---

## Future Enhancements (Phase 2)

### SQLite Migration
- Migrate from JSONL to SQLite database
- Add indexes for fast queries
- Support complex aggregations
- Enable full-text search

### Advanced Analytics
- Pattern detection algorithms (clustering, sequence mining)
- Anomaly detection
- Predictive insights
- Time series analysis

### Visualization
- Dashboard data generation
- Chart/graph data exports
- Real-time metrics streaming

---

## Configuration

### Environment Variables
```bash
WORKSPACE_BRAIN_PATH=~/workspace-brain  # Override default location
WORKSPACE_BRAIN_CACHE_TTL=3600         # Default cache TTL
WORKSPACE_BRAIN_LOG_LEVEL=info         # info | debug | error
```

### MCP Configuration
```json
{
  "mcpServers": {
    "workspace-brain-mcp": {
      "command": "node",
      "args": [
        "/Users/.../workspace-brain-mcp-project/04-product-under-development/build/index.js"
      ],
      "env": {
        "WORKSPACE_BRAIN_PATH": "~/workspace-brain"
      }
    }
  }
}
```

---

## Success Criteria

### Functionality
- ✅ All 15 tools operational
- ✅ No data loss during operations
- ✅ Graceful error handling

### Performance
- ✅ log_event: <5ms per call
- ✅ query_events: <200ms for 10k events
- ✅ generate_weekly_summary: <2 seconds

### Quality
- ✅ Zero TypeScript errors
- ✅ 80%+ test coverage
- ✅ Clear error messages
- ✅ Complete documentation

---

**Document Version:** 1.0
**Last Updated:** 2025-10-31
**Next Review:** After Phase 1 deployment
