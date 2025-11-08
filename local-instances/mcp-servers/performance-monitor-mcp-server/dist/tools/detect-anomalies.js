/**
 * Detect Anomalies Tool
 *
 * Detect performance anomalies using statistical methods
 */
import { DataStore } from '../lib/data-store.js';
import { AnomalyDetector } from '../lib/anomaly-detector.js';
const dataStore = new DataStore();
const detector = new AnomalyDetector();
export async function detectAnomalies(args) {
    try {
        // Parse parameters
        const mcpServer = args.mcpServer;
        const toolName = args.toolName;
        const lookbackWindow = args.lookbackWindow || '24h';
        const sensitivity = args.sensitivity || 'medium';
        const method = args.method || 'z-score';
        // Calculate time range based on lookback window
        const endTime = new Date();
        const startTime = new Date();
        switch (lookbackWindow) {
            case '1h':
                startTime.setHours(startTime.getHours() - 1);
                break;
            case '6h':
                startTime.setHours(startTime.getHours() - 6);
                break;
            case '24h':
                startTime.setHours(startTime.getHours() - 24);
                break;
        }
        // Read metrics
        const metrics = await dataStore.readMetrics(startTime.toISOString(), endTime.toISOString(), mcpServer, toolName);
        // Detect anomalies using selected method
        let anomalies;
        switch (method) {
            case 'z-score':
                anomalies = detector.detectZScore(metrics, sensitivity);
                break;
            case 'moving-avg':
                anomalies = detector.detectMovingAverage(metrics, sensitivity);
                break;
            case 'percentile':
                anomalies = detector.detectPercentile(metrics, sensitivity);
                break;
            default:
                throw new Error(`Unknown detection method: ${method}`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        data: {
                            lookbackWindow,
                            method,
                            sensitivity,
                            metricsAnalyzed: metrics.length,
                            anomalies,
                            count: anomalies.length,
                            criticalCount: anomalies.filter(a => a.severity === 'critical').length,
                            warningCount: anomalies.filter(a => a.severity === 'warning').length,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: errorMessage,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=detect-anomalies.js.map