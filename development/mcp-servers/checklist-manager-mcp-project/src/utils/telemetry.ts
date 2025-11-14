/**
 * Telemetry Integration with workspace-brain MCP
 * Logs all checklist operations for learning and optimization
 */

export interface TelemetryEvent {
  event_type: 'checklist-operation';
  event_data: {
    timestamp: string;
    operation: string;
    checklist_id?: string;
    checklist_type?: string;
    success: boolean;
    duration_ms?: number;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Log checklist operation to telemetry
 * In production, this would call workspace-brain MCP's log_event tool
 */
export async function logOperation(
  operation: string,
  params: {
    checklist_id?: string;
    checklist_type?: string;
    success: boolean;
    duration_ms?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const event: TelemetryEvent = {
    event_type: 'checklist-operation',
    event_data: {
      timestamp: new Date().toISOString(),
      operation,
      ...params,
    },
  };

  // TODO: Integrate with workspace-brain MCP when available
  // For now, log to console in development
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
    console.error('[TELEMETRY]', JSON.stringify(event, null, 2));
  }

  // Future: Call workspace-brain MCP's log_event tool
  // await workspaceBrain.log_event(event);
}

/**
 * Wrap a tool execution with telemetry logging
 */
export async function withTelemetry<T>(
  operation: string,
  params: {
    checklist_id?: string;
    checklist_type?: string;
    metadata?: Record<string, unknown>;
  },
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let success = false;

  try {
    const result = await fn();
    success = true;
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration_ms = Date.now() - startTime;
    await logOperation(operation, {
      ...params,
      success,
      duration_ms,
    });
  }
}
