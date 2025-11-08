/**
 * Test Calibration System
 *
 * Generate synthetic prediction data and test calibration algorithms
 */
interface SyntheticPrediction {
    issue_id: string;
    predicted_confidence: number;
    predicted_action: 'autonomous' | 'assisted' | 'manual';
    actual_outcome: 'success' | 'rollback' | 'failed';
    resolution_time_minutes: number;
    issue_type: 'broken' | 'missing' | 'improvement';
    severity?: string;
    component?: string;
}
/**
 * Generate realistic synthetic predictions
 * - High confidence predictions should have higher success rates
 * - Simulate overconfidence in some buckets
 * - Include variety of issue types
 */
declare function generateSyntheticPredictions(count: number): SyntheticPrediction[];
declare function testCalibrationSystem(): Promise<void>;
export { testCalibrationSystem, generateSyntheticPredictions };
//# sourceMappingURL=test-calibration.d.ts.map