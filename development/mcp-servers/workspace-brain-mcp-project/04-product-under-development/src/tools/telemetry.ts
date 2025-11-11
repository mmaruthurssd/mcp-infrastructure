/**
 * Telemetry Tools
 * Handle event logging and querying from JSONL files
 */

import { readFileSync, appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

interface Event {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, any>;
}

interface LogEventArgs {
  event_type: string;
  event_data: {
    timestamp?: string;
    [key: string]: any;
  };
}

interface QueryEventsArgs {
  filters?: {
    event_type?: string;
    workflow_name?: string;
    task_type?: string;
    tools_used?: string[];
    outcome?: string;
  };
  time_range?: {
    start?: string;
    end?: string;
  };
  limit?: number;
  sort?: "asc" | "desc";
}

interface GetEventStatsArgs {
  metric: "count" | "avg_duration" | "tool_usage" | "outcome_distribution";
  filters?: {
    event_type?: string;
    task_type?: string;
    time_range?: {
      start?: string;
      end?: string;
    };
  };
  group_by?: "type" | "day" | "week" | "month";
}

// Ensure directory exists
function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true, mode: 0o700 });
  }
}

// Get telemetry file path based on event type
function getTelemetryFilePath(brainPath: string, eventType: string): string {
  const telemetryDir = join(brainPath, "telemetry");
  ensureDir(telemetryDir);

  // Map event types to files
  if (eventType === "mcp-usage" || eventType === "mcp") {
    return join(telemetryDir, "mcp-usage.jsonl");
  }
  // Default to task-log.jsonl for tasks, workflows, etc.
  return join(telemetryDir, "task-log.jsonl");
}

// Read all events from JSONL files
function readAllEvents(brainPath: string): Event[] {
  const telemetryDir = join(brainPath, "telemetry");
  if (!existsSync(telemetryDir)) {
    return [];
  }

  const events: Event[] = [];
  const files = ["task-log.jsonl", "mcp-usage.jsonl"];

  for (const file of files) {
    const filePath = join(telemetryDir, file);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.trim().split("\n").filter(line => line.length > 0);

      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          events.push(event);
        } catch (error) {
          // Skip malformed lines
          console.error(`Skipping malformed line in ${file}`);
        }
      }
    }
  }

  return events;
}

// Filter events based on criteria
function filterEvents(events: Event[], filters: QueryEventsArgs["filters"], timeRange: QueryEventsArgs["time_range"]): Event[] {
  return events.filter(event => {
    // Event type filter
    if (filters?.event_type && event.type !== filters.event_type) {
      return false;
    }

    // Workflow name filter
    if (filters?.workflow_name && event.data.workflow_name !== filters.workflow_name) {
      return false;
    }

    // Task type filter
    if (filters?.task_type && event.data.task_type !== filters.task_type) {
      return false;
    }

    // Tools used filter (event uses ANY of the specified tools)
    if (filters?.tools_used && filters.tools_used.length > 0) {
      const eventTools = event.data.tools_used || [];
      const hasAnyTool = filters.tools_used.some(tool => eventTools.includes(tool));
      if (!hasAnyTool) {
        return false;
      }
    }

    // Outcome filter
    if (filters?.outcome && event.data.outcome !== filters.outcome) {
      return false;
    }

    // Time range filter
    if (timeRange) {
      const eventTime = new Date(event.timestamp).getTime();

      if (timeRange.start) {
        const startTime = new Date(timeRange.start).getTime();
        if (eventTime < startTime) return false;
      }

      if (timeRange.end) {
        const endTime = new Date(timeRange.end).getTime();
        if (eventTime > endTime) return false;
      }
    }

    return true;
  });
}

/**
 * Log Event
 * Append event to appropriate JSONL file
 */
export async function logEvent(args: LogEventArgs, brainPath: string) {
  const startTime = Date.now();

  try {
    const event: Event = {
      id: randomUUID(),
      type: args.event_type,
      timestamp: args.event_data.timestamp || new Date().toISOString(),
      data: args.event_data
    };

    const filePath = getTelemetryFilePath(brainPath, args.event_type);
    const eventLine = JSON.stringify(event) + "\n";

    appendFileSync(filePath, eventLine, { mode: 0o600 });

    const duration = Date.now() - startTime;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              event_id: event.id,
              logged_at: event.timestamp,
              file_path: filePath,
              write_time_ms: duration
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Failed to log event: ${error.message}`
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

/**
 * Query Events
 * Search events with filters and time range
 */
export async function queryEvents(args: QueryEventsArgs, brainPath: string) {
  const startTime = Date.now();

  try {
    const allEvents = readAllEvents(brainPath);
    let filteredEvents = filterEvents(allEvents, args.filters, args.time_range);

    // Sort by timestamp
    const sortOrder = args.sort || "desc";
    filteredEvents.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    // Apply limit
    const limit = args.limit || 100;
    const limitedEvents = filteredEvents.slice(0, limit);

    const queryTime = Date.now() - startTime;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              events: limitedEvents,
              count: limitedEvents.length,
              total_matching: filteredEvents.length,
              query_time_ms: queryTime
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Failed to query events: ${error.message}`
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

/**
 * Get Event Stats
 * Calculate statistics from events
 */
export async function getEventStats(args: GetEventStatsArgs, brainPath: string) {
  try {
    const allEvents = readAllEvents(brainPath);
    const filteredEvents = filterEvents(allEvents, args.filters as any, args.filters?.time_range);

    let stats: any = {
      success: true,
      metric: args.metric
    };

    switch (args.metric) {
      case "count":
        if (args.group_by) {
          const counts: Record<string, number> = {};
          filteredEvents.forEach(event => {
            const key = getGroupKey(event, args.group_by!);
            counts[key] = (counts[key] || 0) + 1;
          });
          stats.total = filteredEvents.length;
          stats.by_group = counts;
        } else {
          stats.total = filteredEvents.length;
        }
        break;

      case "avg_duration":
        const durations = filteredEvents
          .map(e => e.data.duration_minutes)
          .filter(d => typeof d === "number");

        if (durations.length > 0) {
          stats.average = durations.reduce((a, b) => a + b, 0) / durations.length;
          stats.min = Math.min(...durations);
          stats.max = Math.max(...durations);
          stats.count = durations.length;
        } else {
          stats.average = 0;
          stats.count = 0;
        }
        break;

      case "tool_usage":
        const toolCounts: Record<string, number> = {};
        filteredEvents.forEach(event => {
          const tools = event.data.tools_used || [];
          tools.forEach((tool: string) => {
            toolCounts[tool] = (toolCounts[tool] || 0) + 1;
          });
        });
        stats.tool_counts = toolCounts;
        break;

      case "outcome_distribution":
        const outcomes: Record<string, number> = {};
        filteredEvents.forEach(event => {
          const outcome = event.data.outcome || "unknown";
          outcomes[outcome] = (outcomes[outcome] || 0) + 1;
        });
        stats.outcomes = outcomes;
        break;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Failed to get event stats: ${error.message}`
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

// Helper: Get group key for grouping
function getGroupKey(event: Event, groupBy: string): string {
  const date = new Date(event.timestamp);

  switch (groupBy) {
    case "type":
      return event.type;
    case "day":
      return date.toISOString().split("T")[0];
    case "week":
      const weekNum = getWeekNumber(date);
      return `${date.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
    case "month":
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    default:
      return "unknown";
  }
}

// Helper: Get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNum;
}
