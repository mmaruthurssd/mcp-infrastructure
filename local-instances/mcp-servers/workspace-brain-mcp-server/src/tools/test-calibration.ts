/**
 * Test Calibration System
 *
 * Generate synthetic prediction data and test calibration algorithms
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  validateConfidencePrediction,
  getCalibrationReport,
  getConfidenceTrends,
  adjustConfidenceThresholds
} from './calibration.js';

const WORKSPACE_BRAIN_PATH = process.env.WORKSPACE_BRAIN_PATH || join(homedir(), 'workspace-brain');

// ============================================================================
// Synthetic Data Generation
// ============================================================================

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
function generateSyntheticPredictions(count: number): SyntheticPrediction[] {
  const predictions: SyntheticPrediction[] = [];
  const issueTypes: Array<'broken' | 'missing' | 'improvement'> = ['broken', 'missing', 'improvement'];
  const severities = ['low', 'medium', 'high', 'critical'];

  for (let i = 0; i < count; i++) {
    // Generate confidence (bias toward higher values for testing)
    const confidenceRoll = Math.random();
    let predicted_confidence: number;

    if (confidenceRoll < 0.3) {
      // 30% high confidence (0.85-0.99)
      predicted_confidence = 0.85 + Math.random() * 0.14;
    } else if (confidenceRoll < 0.6) {
      // 30% medium confidence (0.70-0.85)
      predicted_confidence = 0.70 + Math.random() * 0.15;
    } else {
      // 40% lower confidence (0.50-0.70)
      predicted_confidence = 0.50 + Math.random() * 0.20;
    }

    // Determine predicted action based on confidence
    let predicted_action: 'autonomous' | 'assisted' | 'manual';
    if (predicted_confidence >= 0.90) {
      predicted_action = 'autonomous';
    } else if (predicted_confidence >= 0.70) {
      predicted_action = 'assisted';
    } else {
      predicted_action = 'manual';
    }

    // Determine actual outcome based on confidence (with some noise)
    // Simulate overconfidence: actual success is slightly lower than predicted
    const overconfidenceBias = 0.10; // 10% overconfidence
    const actualSuccessThreshold = predicted_confidence - overconfidenceBias + (Math.random() * 0.1 - 0.05);

    let actual_outcome: 'success' | 'rollback' | 'failed';
    const outcomeRoll = Math.random();

    if (outcomeRoll < actualSuccessThreshold) {
      actual_outcome = 'success';
    } else if (outcomeRoll < actualSuccessThreshold + 0.05) {
      actual_outcome = 'rollback';
    } else {
      actual_outcome = 'failed';
    }

    // Random issue type and severity
    const issue_type = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    // Resolution time based on outcome
    const resolution_time_minutes =
      actual_outcome === 'success' ? 10 + Math.random() * 30 :
      actual_outcome === 'rollback' ? 40 + Math.random() * 60 :
      80 + Math.random() * 120;

    predictions.push({
      issue_id: `test-issue-${i.toString().padStart(3, '0')}`,
      predicted_confidence: Math.round(predicted_confidence * 100) / 100,
      predicted_action,
      actual_outcome,
      resolution_time_minutes: Math.round(resolution_time_minutes),
      issue_type,
      severity,
      component: `component-${Math.floor(Math.random() * 5)}`,
    });
  }

  return predictions;
}

/**
 * Distribute predictions across time (last 12 weeks)
 */
function addTimestampsToPredictions(predictions: SyntheticPrediction[]): SyntheticPrediction[] {
  const now = new Date();
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

  return predictions.map((pred, index) => {
    // Distribute evenly across 12 weeks
    const offset = (index / predictions.length) * (now.getTime() - twelveWeeksAgo.getTime());
    const timestamp = new Date(twelveWeeksAgo.getTime() + offset);

    return {
      ...pred,
      timestamp: timestamp.toISOString(),
    };
  });
}

// ============================================================================
// Test Execution
// ============================================================================

async function testCalibrationSystem() {
  console.log('='.repeat(80));
  console.log('CALIBRATION SYSTEM TEST');
  console.log('='.repeat(80));
  console.log();

  // 1. Generate synthetic data
  console.log('Step 1: Generating 100 synthetic predictions...');
  const predictions = generateSyntheticPredictions(100);
  const timestampedPredictions = addTimestampsToPredictions(predictions);

  console.log(`  Generated ${timestampedPredictions.length} predictions`);
  console.log(`  Confidence range: ${Math.min(...predictions.map(p => p.predicted_confidence)).toFixed(2)} - ${Math.max(...predictions.map(p => p.predicted_confidence)).toFixed(2)}`);
  console.log();

  // 2. Validate and store each prediction
  console.log('Step 2: Storing predictions...');
  for (const pred of timestampedPredictions) {
    await validateConfidencePrediction(
      {
        issue_id: pred.issue_id,
        predicted_confidence: pred.predicted_confidence,
        predicted_action: pred.predicted_action,
        actual_outcome: pred.actual_outcome,
        resolution_time_minutes: pred.resolution_time_minutes,
        issue_type: pred.issue_type,
        severity: pred.severity,
        component: pred.component,
      },
      WORKSPACE_BRAIN_PATH
    );
  }
  console.log('  All predictions stored');
  console.log();

  // 3. Generate calibration report
  console.log('Step 3: Generating calibration report...');
  const reportResult = await getCalibrationReport(
    { time_range: 'all' },
    WORKSPACE_BRAIN_PATH
  );
  const report = JSON.parse(reportResult.content[0].text);
  console.log('  Calibration Report:');
  console.log(`    Total predictions: ${report.total_predictions}`);
  console.log(`    Overall accuracy: ${(report.overall_accuracy * 100).toFixed(1)}%`);
  console.log(`    Calibration quality: ${report.calibration_quality}`);
  console.log();
  console.log('  Confidence Buckets:');
  report.by_bucket.forEach((bucket: any) => {
    console.log(`    ${bucket.range}: ${bucket.predictions_count} predictions, ${(bucket.actual_success_rate * 100).toFixed(1)}% success`);
    console.log(`      Predicted: ${(bucket.predicted_confidence_avg * 100).toFixed(1)}%, Calibration Error: ${(bucket.calibration_error * 100).toFixed(1)}%`);
    console.log(`      ${bucket.recommendation}`);
  });
  console.log();

  // 4. Get confidence trends
  console.log('Step 4: Analyzing confidence trends...');
  const trendsResult = await getConfidenceTrends(
    { weeks_back: 12 },
    WORKSPACE_BRAIN_PATH
  );
  const trends = JSON.parse(trendsResult.content[0].text);
  console.log(`  Analyzed ${trends.weeks_analyzed} weeks`);
  console.log(`  Calibration trend: ${trends.summary.improvement_trend}`);
  console.log(`  Improvement: ${trends.summary.improvement_percentage}%`);
  if (trends.poorly_calibrated_types.length > 0) {
    console.log('  Poorly calibrated types:');
    trends.poorly_calibrated_types.forEach((type: any) => {
      console.log(`    ${type.type}: ${(type.avg_error * 100).toFixed(1)}% avg error`);
    });
  }
  console.log();

  // 5. Adjust thresholds
  console.log('Step 5: Recommending threshold adjustments...');
  const thresholdResult = await adjustConfidenceThresholds(
    { target_success_rate: 0.95, min_sample_size: 10 },
    WORKSPACE_BRAIN_PATH
  );
  const thresholds = JSON.parse(thresholdResult.content[0].text);
  console.log('  Current thresholds:');
  console.log(`    Autonomous: ${thresholds.current_thresholds.autonomous}`);
  console.log(`    Assisted: ${thresholds.current_thresholds.assisted}`);
  console.log();
  console.log('  Recommended thresholds:');
  console.log(`    Autonomous: ${thresholds.recommended_thresholds.autonomous}`);
  console.log(`    Assisted: ${thresholds.recommended_thresholds.assisted}`);
  console.log();
  console.log('  Justification:');
  thresholds.justification.forEach((reason: string) => {
    console.log(`    - ${reason}`);
  });
  console.log();
  console.log(`  Expected improvement: ${thresholds.expected_improvement}`);
  console.log(`  Adjustment needed: ${thresholds.adjustment_needed ? 'YES' : 'NO'}`);
  console.log();

  // 6. Summary
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log();
  console.log('Calibration system successfully tested with 100 synthetic predictions.');
  console.log();
  console.log('Key Findings:');
  console.log(`  - Overall accuracy: ${(report.overall_accuracy * 100).toFixed(1)}%`);
  console.log(`  - Calibration quality: ${report.calibration_quality}`);
  console.log(`  - System shows ${trends.summary.improvement_trend} calibration trend`);
  console.log(`  - Threshold adjustment ${thresholds.adjustment_needed ? 'recommended' : 'not needed'}`);
  console.log();
  console.log('Recommendations:');
  report.recommendations.forEach((rec: string) => {
    console.log(`  - ${rec}`);
  });
  console.log();
  console.log('Files created:');
  console.log(`  - ${WORKSPACE_BRAIN_PATH}/calibration/predictions/*.json (100 files)`);
  console.log(`  - ${WORKSPACE_BRAIN_PATH}/calibration/threshold-history.json`);
  console.log();
}

// ============================================================================
// Run Test
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  testCalibrationSystem()
    .then(() => {
      console.log('Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testCalibrationSystem, generateSyntheticPredictions };
