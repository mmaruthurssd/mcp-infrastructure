/**
 * Data Store
 *
 * Time-series storage for performance metrics
 */
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
export class DataStore {
    config;
    constructor(config) {
        this.config = {
            dataDir: config?.dataDir || '.performance-data',
            retentionPolicy: {
                raw: config?.retentionPolicy?.raw || 1,
                hourly: config?.retentionPolicy?.hourly || 30,
                daily: config?.retentionPolicy?.daily || 365,
            },
        };
    }
    /**
     * Write metric to JSONL file
     * Organizes by date/mcpServer/toolName for efficient querying
     */
    async writeMetric(metric) {
        const date = new Date(metric.timestamp);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        // Path: .performance-data/metrics/YYYY-MM-DD/mcpServer/toolName.jsonl
        const filePath = join(this.config.dataDir, 'metrics', dateStr, metric.mcpServer, `${metric.toolName}.jsonl`);
        // Ensure directory exists
        await fs.mkdir(dirname(filePath), { recursive: true });
        // Append metric as single JSON line
        const line = JSON.stringify(metric) + '\n';
        await fs.appendFile(filePath, line, 'utf-8');
    }
    /**
     * Read metrics from time range
     */
    async readMetrics(startTime, endTime, mcpServer, toolName) {
        const metrics = [];
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        // Generate list of dates to scan
        const dates = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
        }
        // Read metrics for each date
        for (const dateStr of dates) {
            const datePath = join(this.config.dataDir, 'metrics', dateStr);
            try {
                await fs.access(datePath);
            }
            catch {
                // Date directory doesn't exist, skip
                continue;
            }
            // If mcpServer specified, only read that server
            const servers = mcpServer ? [mcpServer] : await fs.readdir(datePath);
            for (const server of servers) {
                const serverPath = join(datePath, server);
                try {
                    const stat = await fs.stat(serverPath);
                    if (!stat.isDirectory())
                        continue;
                }
                catch {
                    continue;
                }
                // If toolName specified, only read that tool
                const tools = toolName ? [`${toolName}.jsonl`] : await fs.readdir(serverPath);
                for (const tool of tools) {
                    if (!tool.endsWith('.jsonl'))
                        continue;
                    const filePath = join(serverPath, tool);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const lines = content.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        try {
                            const metric = JSON.parse(line);
                            const metricTime = new Date(metric.timestamp);
                            // Filter by time range
                            if (metricTime >= startDate && metricTime <= endDate) {
                                metrics.push(metric);
                            }
                        }
                        catch {
                            // Skip invalid JSON lines
                            continue;
                        }
                    }
                }
            }
        }
        return metrics;
    }
    /**
     * Clean up old data based on retention policy
     */
    async cleanup() {
        const metricsPath = join(this.config.dataDir, 'metrics');
        try {
            await fs.access(metricsPath);
        }
        catch {
            // Metrics directory doesn't exist
            return;
        }
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - this.config.retentionPolicy.raw * 24 * 60 * 60 * 1000);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
        const dates = await fs.readdir(metricsPath);
        for (const dateStr of dates) {
            if (dateStr < cutoffDateStr) {
                const datePath = join(metricsPath, dateStr);
                await fs.rm(datePath, { recursive: true, force: true });
            }
        }
    }
}
//# sourceMappingURL=data-store.js.map