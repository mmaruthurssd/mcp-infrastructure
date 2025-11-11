# Performance Monitor MCP - Architecture Design

**Version:** 1.0.0
**Status:** 🟡 In Development
**Created:** 2025-10-31

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Layer (Claude Code)                    │
│  Calls: track_performance, get_metrics, detect_anomalies, etc.     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Performance Monitor MCP Server                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     API Layer (Tools)                        │  │
│  │  track_performance | get_metrics | detect_anomalies         │  │
│  │  set_alert_threshold | get_active_alerts | acknowledge_alert│  │
│  │  generate_report | get_dashboard                            │  │
│  └────────────┬────────────────────────────┬────────────────────┘  │
│               │                            │                        │
│  ┌────────────▼────────────┐  ┌───────────▼────────────────────┐  │
│  │   Business Logic Layer  │  │    Background Jobs Layer      │  │
│  │  - MetricsCollector     │  │  - AnomalyDetectionJob (5min) │  │
│  │  - AnomalyDetector      │  │  - DataCleanupJob (daily)     │  │
│  │  - AlertManager         │  │  - AggregationJob (hourly)    │  │
│  │  - Reporter             │  │                                │  │
│  └────────────┬────────────┘  └────────────────────────────────┘  │
│               │                                                     │
│  ┌────────────▼────────────────────────────────────────────────┐  │
│  │                    Data Access Layer                        │  │
│  │  - DataStore (CRUD operations)                              │  │
│  │  - QueryEngine (filtering, aggregation)                     │  │
│  │  - IndexManager (fast lookups)                              │  │
│  └────────────┬────────────────────────────────────────────────┘  │
└───────────────┼──────────────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Storage Layer (File System)                   │
│                                                                      │
│  .performance-data/                                                 │
│  ├── metrics/                    # Raw metrics (JSONL)              │
│  │   ├── 2025-10-31/                                               │
│  │   │   ├── project-management-mcp/                               │
│  │   │   │   ├── create_potential_goal.jsonl                       │
│  │   │   │   └── evaluate_goal.jsonl                               │
│  │   │   └── deployment-release-mcp/                               │
│  │   └── 2025-11-01/                                               │
│  ├── aggregates/                 # Pre-aggregated data (JSON)       │
│  │   ├── hourly/                                                    │
│  │   │   └── 2025-10-31-13.json                                    │
│  │   └── daily/                                                     │
│  │       └── 2025-10-31.json                                       │
│  ├── anomalies/                  # Detected anomalies (JSONL)       │
│  │   └── 2025-10-31.jsonl                                          │
│  ├── alerts/                     # Active alerts (JSON)             │
│  │   └── active-alerts.json                                        │
│  └── config/                     # Configuration                    │
│      └── thresholds.json                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      MetricsCollector                            │
│  Responsibilities:                                               │
│  - Validate incoming metrics                                     │
│  - Add timestamps                                                │
│  - Batch writes (100 metrics or 1 second)                        │
│  - Async storage (non-blocking)                                  │
│                                                                  │
│  Methods:                                                        │
│  + trackMetric(metric: PerformanceMetric): Promise<MetricResult>│
│  + flush(): Promise<void>                                        │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DataStore                                 │
│  Responsibilities:                                               │
│  - CRUD operations for metrics, anomalies, alerts                │
│  - Efficient JSONL writes (append-only)                          │
│  - Atomic operations (write to temp, then rename)                │
│  - Index management (by date, MCP, tool)                         │
│                                                                  │
│  Methods:                                                        │
│  + writeMetrics(metrics: PerformanceMetric[]): Promise<void>    │
│  + readMetrics(filter: MetricFilter): Promise<Metric[]>         │
│  + writeAnomaly(anomaly: Anomaly): Promise<void>                │
│  + readAnomalies(filter: AnomalyFilter): Promise<Anomaly[]>     │
│  + writeAlert(alert: Alert): Promise<void>                      │
│  + readAlerts(filter: AlertFilter): Promise<Alert[]>            │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AnomalyDetector                             │
│  Responsibilities:                                               │
│  - Statistical analysis (z-score, moving avg, percentile)        │
│  - Anomaly classification (response_time, error_rate, resource)  │
│  - Severity scoring (info, warning, critical)                    │
│  - Recommendation generation                                     │
│                                                                  │
│  Methods:                                                        │
│  + detectAnomalies(params: DetectionParams): Promise<Anomaly[]> │
│  - calculateZScore(values: number[]): number                     │
│  - calculateMovingAverage(values: number[]): number              │
│  - calculatePercentile(values: number[], p: number): number      │
│  - generateRecommendations(anomaly: Anomaly): string[]           │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                       AlertManager                               │
│  Responsibilities:                                               │
│  - Threshold evaluation                                          │
│  - Alert lifecycle management (create, acknowledge, resolve)     │
│  - Rate limiting (5 per MCP per hour)                            │
│  - De-duplication (1-hour window)                                │
│  - Notification triggering (communications-mcp)                  │
│                                                                  │
│  Methods:                                                        │
│  + evaluateThresholds(metric: Metric): Promise<Alert[]>         │
│  + createAlert(alert: Alert): Promise<AlertResult>              │
│  + acknowledgeAlert(alertId: string, by: string): Promise<void> │
│  + resolveAlert(alertId: string): Promise<void>                 │
│  + getActiveAlerts(filter: AlertFilter): Promise<Alert[]>       │
│  - shouldSuppressAlert(alert: Alert): boolean                    │
│  - triggerNotification(alert: Alert): Promise<void>              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Reporter                                 │
│  Responsibilities:                                               │
│  - Performance report generation                                 │
│  - Dashboard data aggregation                                    │
│  - Trend analysis                                                │
│  - Recommendation synthesis                                      │
│  - Multiple format support (markdown, JSON, HTML)                │
│                                                                  │
│  Methods:                                                        │
│  + generateReport(params: ReportParams): Promise<Report>        │
│  + getDashboard(): Promise<Dashboard>                           │
│  - calculateHealthScore(metrics: Metric[]): number               │
│  - analyzeTrends(metrics: Metric[]): TrendAnalysis              │
│  - synthesizeRecommendations(metrics, anomalies): string[]       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 1. Metric Collection Flow

```
┌─────────────┐
│  MCP Tool   │
│  Execution  │
└──────┬──────┘
       │
       │ (1) track_performance(mcpServer, toolName, duration, success, ...)
       ↓
┌────────────────────┐
│ MetricsCollector   │
│ - Validate input   │
│ - Add timestamp    │
│ - Add to batch     │
└──────┬─────────────┘
       │
       │ (2) Batch write (every 1s or 100 metrics)
       ↓
┌────────────────────┐
│    DataStore       │
│ - Append to JSONL  │
│ - Update index     │
└──────┬─────────────┘
       │
       │ (3) Stored successfully
       ↓
┌────────────────────┐
│  Return success    │
│  to caller         │
└────────────────────┘
```

### 2. Anomaly Detection Flow

```
┌─────────────────────┐
│ Background Job      │
│ (every 5 minutes)   │
└──────┬──────────────┘
       │
       │ (1) Query recent metrics (last 6 hours)
       ↓
┌────────────────────┐
│    DataStore       │
│ - Read metrics     │
│ - Filter by time   │
└──────┬─────────────┘
       │
       │ (2) Metrics data
       ↓
┌────────────────────┐
│ AnomalyDetector    │
│ - Z-score analysis │
│ - Threshold check  │
│ - Classify anomaly │
└──────┬─────────────┘
       │
       │ (3) Anomalies detected
       ↓
┌────────────────────┐
│    DataStore       │
│ - Store anomalies  │
└──────┬─────────────┘
       │
       │ (4) Trigger alerts if severity >= warning
       ↓
┌────────────────────┐
│   AlertManager     │
│ - Create alerts    │
│ - Send notifications│
└────────────────────┘
```

### 3. Alert Flow

```
┌─────────────────────┐
│  Threshold Check    │
│  (real-time)        │
└──────┬──────────────┘
       │
       │ (1) Metric exceeds threshold
       ↓
┌────────────────────┐
│   AlertManager     │
│ - Check rate limit │
│ - Check duplicate  │
│ - Create alert     │
└──────┬─────────────┘
       │
       │ (2) Alert created
       ↓
┌────────────────────┐
│    DataStore       │
│ - Store alert      │
│ - Mark as active   │
└──────┬─────────────┘
       │
       │ (3) Send notification
       ↓
┌────────────────────┐
│ Communications MCP │
│ - Google Chat msg  │
│ - Email (critical) │
└────────────────────┘
       │
       │ (4) User acknowledges alert
       ↓
┌────────────────────┐
│   AlertManager     │
│ - Update status    │
│ - Stop notifications│
└──────┬─────────────┘
       │
       │ (5) Condition clears after 24h
       ↓
┌────────────────────┐
│   AlertManager     │
│ - Auto-resolve     │
│ - Archive alert    │
└────────────────────┘
```

### 4. Report Generation Flow

```
┌─────────────────────┐
│ User requests report│
│ (generate_report)   │
└──────┬──────────────┘
       │
       │ (1) Query metrics (date range)
       ↓
┌────────────────────┐
│    DataStore       │
│ - Read metrics     │
│ - Read anomalies   │
│ - Read alerts      │
└──────┬─────────────┘
       │
       │ (2) Aggregate data
       ↓
┌────────────────────┐
│     Reporter       │
│ - Calculate stats  │
│ - Analyze trends   │
│ - Generate recs    │
│ - Format output    │
└──────┬─────────────┘
       │
       │ (3) Return formatted report
       ↓
┌────────────────────┐
│   Return report    │
│   to user          │
└────────────────────┘
```

---

## Storage Design

### File System Structure

```
.performance-data/
├── metrics/
│   ├── 2025-10-31/
│   │   ├── project-management-mcp/
│   │   │   ├── create_potential_goal.jsonl
│   │   │   ├── evaluate_goal.jsonl
│   │   │   └── ...
│   │   ├── deployment-release-mcp/
│   │   │   ├── deploy_application.jsonl
│   │   │   └── ...
│   │   └── [other-mcps]/
│   └── [other-dates]/
├── aggregates/
│   ├── hourly/
│   │   ├── 2025-10-31-00.json
│   │   ├── 2025-10-31-01.json
│   │   └── ...
│   └── daily/
│       ├── 2025-10-31.json
│       └── ...
├── anomalies/
│   ├── 2025-10-31.jsonl
│   └── ...
├── alerts/
│   ├── active-alerts.json
│   └── history/
│       └── 2025-10-31.jsonl
├── config/
│   ├── thresholds.json
│   └── settings.json
└── index/
    ├── metrics-index.json
    └── anomalies-index.json
```

### Data Format Examples

#### Metric (JSONL - Append Only)
```json
{"timestamp":"2025-10-31T13:00:00.123Z","mcpServer":"project-management-mcp","toolName":"create_potential_goal","duration":150,"success":true,"error":null,"resource":{"cpu":15.5,"memory":128,"diskIO":1024}}
{"timestamp":"2025-10-31T13:00:05.456Z","mcpServer":"project-management-mcp","toolName":"create_potential_goal","duration":200,"success":true,"error":null,"resource":{"cpu":18.2,"memory":132,"diskIO":2048}}
```

#### Hourly Aggregate (JSON)
```json
{
  "timestamp": "2025-10-31T13:00:00Z",
  "mcpServer": "project-management-mcp",
  "toolName": "create_potential_goal",
  "metrics": {
    "count": 120,
    "avg": 175.5,
    "p50": 160,
    "p95": 250,
    "p99": 300,
    "max": 350,
    "min": 100,
    "errorRate": 0.5
  },
  "resource": {
    "avgCpu": 16.3,
    "avgMemory": 130,
    "avgDiskIO": 1500
  }
}
```

#### Anomaly (JSONL)
```json
{"timestamp":"2025-10-31T13:05:00Z","mcpServer":"deployment-release-mcp","toolName":"deploy_application","anomalyType":"response_time_spike","severity":"warning","details":{"currentValue":5000,"expectedRange":"100-500","deviation":"10x","confidence":0.95,"method":"z-score"},"recommendations":["Check server resource usage","Review recent deployments","Verify database connection pool"]}
```

#### Active Alerts (JSON - Overwrite)
```json
{
  "lastUpdated": "2025-10-31T13:10:00Z",
  "alerts": [
    {
      "alertId": "alert-20251031-001",
      "timestamp": "2025-10-31T13:05:00Z",
      "mcpServer": "security-compliance-mcp",
      "toolName": "scan_for_credentials",
      "severity": "critical",
      "condition": "error_rate > 5%",
      "currentValue": 7.5,
      "threshold": 5,
      "status": "active",
      "acknowledgedBy": null,
      "notes": null
    }
  ]
}
```

---

## Index Design

### Metrics Index
**Purpose:** Fast lookups by date, MCP, tool

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-10-31T13:00:00Z",
  "index": {
    "2025-10-31": {
      "project-management-mcp": {
        "tools": ["create_potential_goal", "evaluate_goal", "..."],
        "files": [
          "metrics/2025-10-31/project-management-mcp/create_potential_goal.jsonl",
          "..."
        ],
        "count": 1200,
        "firstTimestamp": "2025-10-31T00:00:00Z",
        "lastTimestamp": "2025-10-31T23:59:59Z"
      },
      "deployment-release-mcp": { "..." }
    }
  }
}
```

**Query Strategy:**
1. **By date:** Look up date key in index
2. **By MCP:** Look up MCP key under date
3. **By tool:** Look up tool in tools array
4. **By time range:** Scan multiple dates

---

## Background Jobs

### 1. Anomaly Detection Job
**Frequency:** Every 5 minutes
**Duration:** <500ms
**Purpose:** Detect anomalies in recent metrics

```typescript
async function anomalyDetectionJob() {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 6 * 60 * 60 * 1000); // 6 hours ago

  const metrics = await dataStore.readMetrics({
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString()
  });

  const anomalies = await anomalyDetector.detectAnomalies({
    lookbackWindow: "6h",
    sensitivity: "medium"
  });

  for (const anomaly of anomalies) {
    await dataStore.writeAnomaly(anomaly);

    if (anomaly.severity === "warning" || anomaly.severity === "critical") {
      await alertManager.createAlert({
        mcpServer: anomaly.mcpServer,
        toolName: anomaly.toolName,
        severity: anomaly.severity,
        condition: `${anomaly.anomalyType} detected`,
        currentValue: anomaly.details.currentValue,
        threshold: parseFloat(anomaly.details.expectedRange.split("-")[1])
      });
    }
  }
}
```

### 2. Data Cleanup Job
**Frequency:** Daily at midnight
**Duration:** <5 seconds
**Purpose:** Remove old data beyond retention period

```typescript
async function dataCleanupJob() {
  const now = new Date();

  // Delete real-time metrics older than 24 hours
  const realTimeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  await dataStore.deleteMetricsBefore(realTimeThreshold);

  // Delete hourly aggregates older than 30 days
  const hourlyThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  await dataStore.deleteAggregatesBefore(hourlyThreshold, "hourly");

  // Delete daily aggregates older than 1 year
  const dailyThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  await dataStore.deleteAggregatesBefore(dailyThreshold, "daily");

  // Delete anomalies older than 90 days
  const anomalyThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  await dataStore.deleteAnomaliesBefore(anomalyThreshold);

  // Archive resolved alerts older than 30 days
  const alertThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  await dataStore.archiveAlertsBefore(alertThreshold);
}
```

### 3. Aggregation Job
**Frequency:** Every hour at :00
**Duration:** <10 seconds
**Purpose:** Create hourly and daily aggregates

```typescript
async function aggregationJob() {
  const now = new Date();
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

  // Create hourly aggregate for last hour
  const hourlyMetrics = await dataStore.readMetrics({
    startTime: lastHour.toISOString(),
    endTime: now.toISOString()
  });

  const hourlyAggregate = calculateAggregates(hourlyMetrics);
  await dataStore.writeAggregate(hourlyAggregate, "hourly");

  // If midnight, create daily aggregate for yesterday
  if (now.getHours() === 0) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dailyMetrics = await dataStore.readMetrics({
      startTime: yesterday.toISOString(),
      endTime: now.toISOString()
    });

    const dailyAggregate = calculateAggregates(dailyMetrics);
    await dataStore.writeAggregate(dailyAggregate, "daily");
  }
}
```

---

## Performance Optimizations

### 1. Batch Writes
- **Strategy:** Batch up to 100 metrics or 1 second (whichever comes first)
- **Benefit:** Reduce file I/O operations
- **Implementation:** In-memory buffer with timer

### 2. Index Caching
- **Strategy:** Cache metrics index in memory
- **Benefit:** Fast lookups without file reads
- **Implementation:** Load index on startup, update on writes

### 3. Pre-Aggregation
- **Strategy:** Create hourly/daily aggregates
- **Benefit:** Fast queries for large time ranges
- **Implementation:** Background job runs hourly

### 4. Query Optimization
- **Strategy:** Use pre-aggregated data for queries >24 hours
- **Benefit:** <100ms query time even for large ranges
- **Implementation:** Query planner selects data source

### 5. Async Operations
- **Strategy:** All storage operations async
- **Benefit:** Non-blocking API calls
- **Implementation:** Promise-based API

---

## Error Handling

### File System Errors
```typescript
try {
  await dataStore.writeMetrics(metrics);
} catch (error) {
  if (error.code === "ENOSPC") {
    // Disk full - trigger cleanup
    await dataCleanupJob();
    await dataStore.writeMetrics(metrics);
  } else if (error.code === "EACCES") {
    // Permission denied
    console.error("Permission denied writing metrics");
    // Degrade gracefully - continue without persisting
  } else {
    // Unknown error
    console.error("Error writing metrics:", error);
  }
}
```

### Data Corruption
```typescript
try {
  const metrics = await dataStore.readMetrics(filter);
} catch (error) {
  if (error instanceof SyntaxError) {
    // Malformed JSON - log and skip
    console.error("Malformed JSON in metrics file:", error);
    return [];
  } else {
    throw error;
  }
}
```

### Missing Data
```typescript
const metrics = await dataStore.readMetrics({
  startTime: "2025-10-31T00:00:00Z",
  endTime: "2025-10-31T23:59:59Z"
});

if (metrics.length === 0) {
  // No data for this period - return empty results
  return {
    metrics: [],
    summary: { totalCalls: 0, avgResponseTime: 0, errorRate: 0 }
  };
}
```

---

## Security Considerations

### File Permissions
```bash
# Set restrictive permissions on data directory
chmod 700 .performance-data/
chmod 600 .performance-data/**/*.json
chmod 600 .performance-data/**/*.jsonl
```

### Input Validation
```typescript
function validateMetric(metric: any): metric is PerformanceMetric {
  if (typeof metric.mcpServer !== "string") return false;
  if (typeof metric.toolName !== "string") return false;
  if (typeof metric.duration !== "number" || metric.duration < 0) return false;
  if (typeof metric.success !== "boolean") return false;
  return true;
}
```

### Rate Limiting
```typescript
const rateLimits = new Map<string, number>();

function checkRateLimit(mcpServer: string): boolean {
  const key = `alerts:${mcpServer}`;
  const count = rateLimits.get(key) || 0;

  if (count >= 5) {
    return false; // Rate limit exceeded
  }

  rateLimits.set(key, count + 1);
  setTimeout(() => rateLimits.delete(key), 60 * 60 * 1000); // Reset after 1 hour
  return true;
}
```

---

**Document Status:** 🟢 Active
**Version:** 1.0.0
**Owner:** Workspace Team
**Last Updated:** 2025-10-31
