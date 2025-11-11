/**
 * Telemetry Tools
 * Handle event logging and querying from JSONL files
 */
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
/**
 * Log Event
 * Append event to appropriate JSONL file
 */
export declare function logEvent(args: LogEventArgs, brainPath: string): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
/**
 * Query Events
 * Search events with filters and time range
 */
export declare function queryEvents(args: QueryEventsArgs, brainPath: string): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
/**
 * Get Event Stats
 * Calculate statistics from events
 */
export declare function getEventStats(args: GetEventStatsArgs, brainPath: string): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
export {};
//# sourceMappingURL=telemetry.d.ts.map