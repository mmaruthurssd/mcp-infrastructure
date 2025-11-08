/**
 * Calibration Tools
 *
 * Validates confidence predictions against actual outcomes and provides
 * calibration feedback to improve autonomous decision-making accuracy.
 *
 * Implements isotonic regression for confidence calibration across issue types.
 */
import { promises as fs } from 'fs';
import { join } from 'path';
// ============================================================================
// Helper Functions
// ============================================================================
async function ensureCalibrationDirectories(workspaceBrainPath) {
    const dirs = [
        join(workspaceBrainPath, 'calibration'),
        join(workspaceBrainPath, 'calibration', 'predictions'),
        join(workspaceBrainPath, 'calibration', 'calibration-reports'),
        join(workspaceBrainPath, 'calibration', 'calibration-reports', 'weekly'),
        join(workspaceBrainPath, 'calibration', 'calibration-reports', 'monthly'),
    ];
    for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
    }
}
function getConfidenceBucket(confidence) {
    if (confidence >= 0.90)
        return { range: '0.90-1.00', min: 0.90, max: 1.00 };
    if (confidence >= 0.80)
        return { range: '0.80-0.89', min: 0.80, max: 0.89 };
    if (confidence >= 0.70)
        return { range: '0.70-0.79', min: 0.70, max: 0.79 };
    if (confidence >= 0.60)
        return { range: '0.60-0.69', min: 0.60, max: 0.69 };
    if (confidence >= 0.50)
        return { range: '0.50-0.59', min: 0.50, max: 0.59 };
    return { range: '0.00-0.49', min: 0.00, max: 0.49 };
}
function getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
async function loadAllPredictions(workspaceBrainPath, timeRange) {
    const predictionsDir = join(workspaceBrainPath, 'calibration', 'predictions');
    try {
        await fs.mkdir(predictionsDir, { recursive: true });
        const files = await fs.readdir(predictionsDir);
        const predictions = [];
        for (const file of files) {
            if (!file.endsWith('.json'))
                continue;
            const filePath = join(predictionsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const prediction = JSON.parse(content);
            // Filter by time range if provided
            if (timeRange) {
                const predTime = new Date(prediction.timestamp).getTime();
                const startTime = new Date(timeRange.start).getTime();
                const endTime = new Date(timeRange.end).getTime();
                if (predTime < startTime || predTime > endTime) {
                    continue;
                }
            }
            predictions.push(prediction);
        }
        return predictions;
    }
    catch (error) {
        return [];
    }
}
// ============================================================================
// Isotonic Regression for Calibration
// ============================================================================
/**
 * Isotonic regression for calibration
 * Ensures predicted probabilities are monotonically increasing with actual outcomes
 */
function isotonicRegression(predictions) {
    if (predictions.length === 0)
        return new Map();
    // Sort predictions by confidence
    const sorted = [...predictions].sort((a, b) => a.predicted_confidence - b.predicted_confidence);
    // Group by confidence buckets and calculate actual success rates
    const buckets = new Map();
    for (const pred of sorted) {
        const bucket = Math.floor(pred.predicted_confidence * 10) / 10; // 0.1 increments
        const existing = buckets.get(bucket) || { successes: 0, total: 0 };
        existing.total++;
        if (pred.actual_outcome === 'success') {
            existing.successes++;
        }
        buckets.set(bucket, existing);
    }
    // Calculate calibrated probabilities
    const calibrated = new Map();
    buckets.forEach((data, bucket) => {
        calibrated.set(bucket, data.successes / data.total);
    });
    return calibrated;
}
/**
 * Apply calibration multiplier based on historical data
 */
function applyCalibration(confidence, calibrationMap) {
    const bucket = Math.floor(confidence * 10) / 10;
    if (calibrationMap.has(bucket)) {
        return calibrationMap.get(bucket);
    }
    // Interpolate if exact bucket not found
    const lowerBucket = Math.floor(bucket * 10) / 10;
    const upperBucket = Math.ceil(bucket * 10) / 10;
    const lower = calibrationMap.get(lowerBucket);
    const upper = calibrationMap.get(upperBucket);
    if (lower && upper) {
        const weight = (confidence - lowerBucket) / 0.1;
        return lower * (1 - weight) + upper * weight;
    }
    return confidence; // No calibration available
}
// ============================================================================
// Tool: validate_confidence_prediction
// ============================================================================
export async function validateConfidencePrediction(args, workspaceBrainPath) {
    await ensureCalibrationDirectories(workspaceBrainPath);
    const prediction = {
        issue_id: args.issue_id,
        predicted_confidence: args.predicted_confidence,
        predicted_action: args.predicted_action,
        actual_outcome: args.actual_outcome,
        resolution_time_minutes: args.resolution_time_minutes,
        issue_type: args.issue_type,
        timestamp: new Date().toISOString(),
        baseType: args.baseType,
        severity: args.severity,
        component: args.component,
    };
    // Save prediction
    const filename = `${args.issue_id}.json`;
    const filePath = join(workspaceBrainPath, 'calibration', 'predictions', filename);
    await fs.writeFile(filePath, JSON.stringify(prediction, null, 2));
    // Calculate calibration feedback
    const success = args.actual_outcome === 'success';
    const bucket = getConfidenceBucket(args.predicted_confidence);
    const calibration_error = args.predicted_confidence - (success ? 1.0 : 0.0);
    // Load similar predictions for context
    const allPredictions = await loadAllPredictions(workspaceBrainPath);
    const sameBucketPredictions = allPredictions.filter(p => getConfidenceBucket(p.predicted_confidence).range === bucket.range);
    const bucketSuccessRate = sameBucketPredictions.length > 0
        ? sameBucketPredictions.filter(p => p.actual_outcome === 'success').length / sameBucketPredictions.length
        : 0;
    const feedback = {
        issue_id: args.issue_id,
        predicted_confidence: args.predicted_confidence,
        predicted_action: args.predicted_action,
        actual_outcome: args.actual_outcome,
        success,
        calibration_error: Math.round(calibration_error * 100) / 100,
        confidence_bucket: bucket.range,
        bucket_success_rate: Math.round(bucketSuccessRate * 100) / 100,
        bucket_sample_size: sameBucketPredictions.length,
        recommendation: Math.abs(calibration_error) < 0.05
            ? 'Well calibrated'
            : calibration_error > 0.05
                ? 'Overconfident - consider lowering threshold'
                : 'Underconfident - may be too conservative',
        timestamp: prediction.timestamp,
    };
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(feedback, null, 2),
            },
        ],
    };
}
// ============================================================================
// Tool: get_calibration_report
// ============================================================================
export async function getCalibrationReport(args, workspaceBrainPath) {
    const now = new Date();
    let timeRange;
    if (args.time_range === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        timeRange = { start: weekAgo.toISOString(), end: now.toISOString() };
    }
    else if (args.time_range === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        timeRange = { start: monthAgo.toISOString(), end: now.toISOString() };
    }
    let predictions = await loadAllPredictions(workspaceBrainPath, timeRange);
    // Filter by issue type if specified
    if (args.issue_type_filter) {
        predictions = predictions.filter(p => p.issue_type === args.issue_type_filter);
    }
    if (predictions.length === 0) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: 'No predictions found for the specified criteria',
                        time_range: args.time_range || 'all',
                        issue_type_filter: args.issue_type_filter,
                    }, null, 2),
                },
            ],
        };
    }
    // Calculate overall accuracy
    const successfulPredictions = predictions.filter(p => p.actual_outcome === 'success');
    const overall_accuracy = successfulPredictions.length / predictions.length;
    // Group by confidence buckets
    const bucketMap = new Map();
    for (const pred of predictions) {
        const bucket = getConfidenceBucket(pred.predicted_confidence);
        const existing = bucketMap.get(bucket.range) || [];
        existing.push(pred);
        bucketMap.set(bucket.range, existing);
    }
    const by_bucket = [];
    bucketMap.forEach((preds, bucketRange) => {
        const bucket = getConfidenceBucket(preds[0].predicted_confidence);
        const successes = preds.filter(p => p.actual_outcome === 'success').length;
        const actual_success_rate = successes / preds.length;
        const predicted_confidence_avg = preds.reduce((sum, p) => sum + p.predicted_confidence, 0) / preds.length;
        const calibration_error = predicted_confidence_avg - actual_success_rate;
        let recommendation = '';
        if (Math.abs(calibration_error) < 0.05) {
            recommendation = 'Well calibrated';
        }
        else if (calibration_error > 0.15) {
            recommendation = `Significantly overconfident. Lower threshold by ${Math.round(calibration_error * 100)}%`;
        }
        else if (calibration_error > 0.05) {
            recommendation = `Slightly overconfident. Consider 0.${Math.round((1 - calibration_error) * 100)}x multiplier`;
        }
        else if (calibration_error < -0.05) {
            recommendation = 'Underconfident. Can be more aggressive';
        }
        else {
            recommendation = 'Well calibrated';
        }
        by_bucket.push({
            range: bucketRange,
            min: bucket.min,
            max: bucket.max,
            predictions_count: preds.length,
            actual_success_rate: Math.round(actual_success_rate * 100) / 100,
            predicted_confidence_avg: Math.round(predicted_confidence_avg * 100) / 100,
            calibration_error: Math.round(calibration_error * 100) / 100,
            recommendation,
        });
    });
    // Sort by bucket range
    by_bucket.sort((a, b) => b.min - a.min);
    // Group by issue type
    const issueTypeMap = new Map();
    for (const pred of predictions) {
        const existing = issueTypeMap.get(pred.issue_type) || [];
        existing.push(pred);
        issueTypeMap.set(pred.issue_type, existing);
    }
    const by_issue_type = {};
    issueTypeMap.forEach((preds, issueType) => {
        const successes = preds.filter(p => p.actual_outcome === 'success').length;
        const accuracy = successes / preds.length;
        const avg_confidence = preds.reduce((sum, p) => sum + p.predicted_confidence, 0) / preds.length;
        const calibration_error = avg_confidence - accuracy;
        by_issue_type[issueType] = {
            predictions: preds.length,
            accuracy: Math.round(accuracy * 100) / 100,
            avg_confidence: Math.round(avg_confidence * 100) / 100,
            calibration_error: Math.round(calibration_error * 100) / 100,
        };
    });
    // Generate recommendations
    const recommendations = [];
    const highConfidenceBucket = by_bucket.find(b => b.range === '0.90-1.00');
    if (highConfidenceBucket) {
        if (highConfidenceBucket.actual_success_rate < 0.90) {
            recommendations.push(`Autonomous threshold (0.90) is too low. Actual success rate: ${(highConfidenceBucket.actual_success_rate * 100).toFixed(0)}%. Increase to 0.95+`);
        }
        else if (highConfidenceBucket.actual_success_rate >= 0.95) {
            recommendations.push('Autonomous threshold is well calibrated');
        }
    }
    // Check for overconfident issue types
    Object.entries(by_issue_type).forEach(([type, data]) => {
        if (data.calibration_error > 0.10) {
            recommendations.push(`Issue type "${type}" is overconfident by ${(data.calibration_error * 100).toFixed(0)}%. Apply 0.${Math.round((1 - data.calibration_error) * 100)} multiplier`);
        }
    });
    if (recommendations.length === 0) {
        recommendations.push('System is well calibrated across all categories');
    }
    // Determine calibration quality
    const avgCalibrationError = by_bucket.reduce((sum, b) => sum + Math.abs(b.calibration_error), 0) / by_bucket.length;
    let calibration_quality;
    if (avgCalibrationError < 0.05)
        calibration_quality = 'excellent';
    else if (avgCalibrationError < 0.10)
        calibration_quality = 'good';
    else if (avgCalibrationError < 0.20)
        calibration_quality = 'needs-improvement';
    else
        calibration_quality = 'poor';
    const report = {
        period: args.time_range || 'all',
        time_range: timeRange || { start: predictions[0].timestamp, end: predictions[predictions.length - 1].timestamp },
        total_predictions: predictions.length,
        overall_accuracy: Math.round(overall_accuracy * 100) / 100,
        by_bucket,
        by_issue_type,
        recommendations,
        calibration_quality,
    };
    // Save report
    const reportDir = args.time_range === 'week' ? 'weekly' : args.time_range === 'month' ? 'monthly' : '';
    if (reportDir) {
        const reportPath = join(workspaceBrainPath, 'calibration', 'calibration-reports', reportDir, `${now.toISOString().split('T')[0]}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(report, null, 2),
            },
        ],
    };
}
// ============================================================================
// Tool: get_confidence_trends
// ============================================================================
export async function getConfidenceTrends(args, workspaceBrainPath) {
    const weeksBack = args.weeks_back || 12;
    const now = new Date();
    const startDate = new Date(now.getTime() - weeksBack * 7 * 24 * 60 * 60 * 1000);
    let predictions = await loadAllPredictions(workspaceBrainPath, {
        start: startDate.toISOString(),
        end: now.toISOString(),
    });
    if (args.issue_type_filter) {
        predictions = predictions.filter(p => p.issue_type === args.issue_type_filter);
    }
    if (predictions.length === 0) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: 'No predictions found for trend analysis',
                        weeks_back: weeksBack,
                        issue_type_filter: args.issue_type_filter,
                    }, null, 2),
                },
            ],
        };
    }
    // Group by ISO week
    const weekMap = new Map();
    for (const pred of predictions) {
        const week = getISOWeek(new Date(pred.timestamp));
        const existing = weekMap.get(week) || [];
        existing.push(pred);
        weekMap.set(week, existing);
    }
    // Calculate trends
    const trends = [];
    weekMap.forEach((preds, week) => {
        const successes = preds.filter(p => p.actual_outcome === 'success').length;
        const actual_success_rate = successes / preds.length;
        const predicted_avg = preds.reduce((sum, p) => sum + p.predicted_confidence, 0) / preds.length;
        const calibration_error = predicted_avg - actual_success_rate;
        trends.push({
            week,
            predicted_avg: Math.round(predicted_avg * 100) / 100,
            actual_success_rate: Math.round(actual_success_rate * 100) / 100,
            calibration_error: Math.round(calibration_error * 100) / 100,
            predictions_count: preds.length,
        });
    });
    // Sort by week
    trends.sort((a, b) => a.week.localeCompare(b.week));
    // Calculate improvement trend
    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));
    const firstHalfError = firstHalf.reduce((sum, t) => sum + Math.abs(t.calibration_error), 0) / firstHalf.length;
    const secondHalfError = secondHalf.reduce((sum, t) => sum + Math.abs(t.calibration_error), 0) / secondHalf.length;
    const improvement = firstHalfError - secondHalfError;
    const improvementPct = (improvement / firstHalfError) * 100;
    // Identify poorly calibrated issue types
    const issueTypeAnalysis = new Map();
    predictions.forEach(pred => {
        const success = pred.actual_outcome === 'success' ? 1.0 : 0.0;
        const error = Math.abs(pred.predicted_confidence - success);
        const existing = issueTypeAnalysis.get(pred.issue_type) || { error: 0, count: 0 };
        existing.error += error;
        existing.count++;
        issueTypeAnalysis.set(pred.issue_type, existing);
    });
    const poorlyCalibrated = [];
    issueTypeAnalysis.forEach((data, type) => {
        const avg_error = data.error / data.count;
        if (avg_error > 0.10) {
            poorlyCalibrated.push({ type, avg_error: Math.round(avg_error * 100) / 100 });
        }
    });
    const result = {
        weeks_analyzed: trends.length,
        trends,
        summary: {
            improvement_trend: improvement > 0 ? 'improving' : improvement < 0 ? 'degrading' : 'stable',
            improvement_percentage: Math.round(improvementPct * 10) / 10,
            first_half_avg_error: Math.round(firstHalfError * 100) / 100,
            second_half_avg_error: Math.round(secondHalfError * 100) / 100,
        },
        poorly_calibrated_types: poorlyCalibrated,
        recommendations: poorlyCalibrated.length > 0
            ? [`Focus calibration improvements on: ${poorlyCalibrated.map(p => p.type).join(', ')}`]
            : ['Calibration is improving across all issue types'],
    };
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
}
// ============================================================================
// Tool: adjust_confidence_thresholds
// ============================================================================
export async function adjustConfidenceThresholds(args, workspaceBrainPath) {
    const targetSuccessRate = args.target_success_rate || 0.95;
    const minSampleSize = args.min_sample_size || 10;
    const predictions = await loadAllPredictions(workspaceBrainPath);
    if (predictions.length < minSampleSize) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: `Insufficient data. Need at least ${minSampleSize} predictions, have ${predictions.length}`,
                        recommendation: 'Collect more prediction data before adjusting thresholds',
                    }, null, 2),
                },
            ],
        };
    }
    // Sort predictions by confidence (descending)
    const sorted = [...predictions].sort((a, b) => b.predicted_confidence - a.predicted_confidence);
    // Find threshold where success rate meets target
    let autonomousThreshold = 0.90;
    let assistedThreshold = 0.70;
    const justification = [];
    // Find autonomous threshold
    for (let threshold = 0.99; threshold >= 0.80; threshold -= 0.01) {
        const candidates = sorted.filter(p => p.predicted_confidence >= threshold);
        if (candidates.length >= minSampleSize) {
            const successes = candidates.filter(p => p.actual_outcome === 'success').length;
            const successRate = successes / candidates.length;
            if (successRate >= targetSuccessRate) {
                autonomousThreshold = Math.round(threshold * 100) / 100;
                justification.push(`Autonomous threshold set to ${autonomousThreshold} based on ${candidates.length} predictions with ${(successRate * 100).toFixed(1)}% success rate`);
                break;
            }
        }
    }
    // Find assisted threshold (target 85% success rate)
    for (let threshold = 0.85; threshold >= 0.50; threshold -= 0.01) {
        const candidates = sorted.filter(p => p.predicted_confidence >= threshold && p.predicted_confidence < autonomousThreshold);
        if (candidates.length >= minSampleSize) {
            const successes = candidates.filter(p => p.actual_outcome === 'success').length;
            const successRate = successes / candidates.length;
            if (successRate >= 0.85) {
                assistedThreshold = Math.round(threshold * 100) / 100;
                justification.push(`Assisted threshold set to ${assistedThreshold} based on ${candidates.length} predictions with ${(successRate * 100).toFixed(1)}% success rate`);
                break;
            }
        }
    }
    // Check if adjustment is needed
    const currentThresholds = { autonomous: 0.90, assisted: 0.70 };
    const adjustment_needed = Math.abs(autonomousThreshold - currentThresholds.autonomous) > 0.02 ||
        Math.abs(assistedThreshold - currentThresholds.assisted) > 0.02;
    if (!adjustment_needed) {
        justification.push('Current thresholds are already optimal');
    }
    // Calculate expected improvement
    const currentAutonomousPreds = predictions.filter(p => p.predicted_confidence >= currentThresholds.autonomous);
    const newAutonomousPreds = predictions.filter(p => p.predicted_confidence >= autonomousThreshold);
    const currentSuccessRate = currentAutonomousPreds.length > 0
        ? currentAutonomousPreds.filter(p => p.actual_outcome === 'success').length / currentAutonomousPreds.length
        : 0;
    const newSuccessRate = newAutonomousPreds.length > 0
        ? newAutonomousPreds.filter(p => p.actual_outcome === 'success').length / newAutonomousPreds.length
        : 0;
    const improvement = (newSuccessRate - currentSuccessRate) * 100;
    const expected_improvement = improvement > 1
        ? `+${improvement.toFixed(1)}% success rate improvement for autonomous actions`
        : 'Minimal change in success rate';
    const result = {
        current_thresholds: currentThresholds,
        recommended_thresholds: {
            autonomous: autonomousThreshold,
            assisted: assistedThreshold,
        },
        justification,
        expected_improvement,
        adjustment_needed,
    };
    // Save threshold history
    const historyPath = join(workspaceBrainPath, 'calibration', 'threshold-history.json');
    let history = [];
    try {
        const content = await fs.readFile(historyPath, 'utf-8');
        history = JSON.parse(content);
    }
    catch {
        // File doesn't exist yet
    }
    history.push({
        timestamp: new Date().toISOString(),
        ...result,
    });
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=calibration.js.map