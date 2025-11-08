/**
 * Calibration Tools
 *
 * Validates confidence predictions against actual outcomes and provides
 * calibration feedback to improve autonomous decision-making accuracy.
 *
 * Implements isotonic regression for confidence calibration across issue types.
 */
export interface ConfidencePrediction {
    issue_id: string;
    predicted_confidence: number;
    predicted_action: 'autonomous' | 'assisted' | 'manual';
    actual_outcome: 'success' | 'rollback' | 'failed';
    resolution_time_minutes: number;
    issue_type: 'broken' | 'missing' | 'improvement';
    timestamp: string;
    baseType?: string;
    severity?: string;
    component?: string;
}
export interface CalibrationData {
    prediction: ConfidencePrediction;
    calibration_error: number;
    success: boolean;
    bucket: string;
}
export interface ConfidenceBucket {
    range: string;
    min: number;
    max: number;
    predictions_count: number;
    actual_success_rate: number;
    predicted_confidence_avg: number;
    calibration_error: number;
    recommendation: string;
}
export interface CalibrationReport {
    period: string;
    time_range: {
        start: string;
        end: string;
    };
    total_predictions: number;
    overall_accuracy: number;
    by_bucket: ConfidenceBucket[];
    by_issue_type: {
        [key: string]: {
            predictions: number;
            accuracy: number;
            avg_confidence: number;
            calibration_error: number;
        };
    };
    recommendations: string[];
    calibration_quality: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}
export interface ConfidenceTrend {
    week: string;
    predicted_avg: number;
    actual_success_rate: number;
    calibration_error: number;
    predictions_count: number;
}
export interface ThresholdAdjustment {
    current_thresholds: {
        autonomous: number;
        assisted: number;
    };
    recommended_thresholds: {
        autonomous: number;
        assisted: number;
    };
    justification: string[];
    expected_improvement: string;
    adjustment_needed: boolean;
}
export declare function validateConfidencePrediction(args: {
    issue_id: string;
    predicted_confidence: number;
    predicted_action: 'autonomous' | 'assisted' | 'manual';
    actual_outcome: 'success' | 'rollback' | 'failed';
    resolution_time_minutes: number;
    issue_type: 'broken' | 'missing' | 'improvement';
    baseType?: string;
    severity?: string;
    component?: string;
}, workspaceBrainPath: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
export declare function getCalibrationReport(args: {
    time_range?: 'week' | 'month' | 'all';
    issue_type_filter?: 'broken' | 'missing' | 'improvement';
}, workspaceBrainPath: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
export declare function getConfidenceTrends(args: {
    weeks_back?: number;
    issue_type_filter?: 'broken' | 'missing' | 'improvement';
}, workspaceBrainPath: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
export declare function adjustConfidenceThresholds(args: {
    target_success_rate?: number;
    min_sample_size?: number;
}, workspaceBrainPath: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
//# sourceMappingURL=calibration.d.ts.map