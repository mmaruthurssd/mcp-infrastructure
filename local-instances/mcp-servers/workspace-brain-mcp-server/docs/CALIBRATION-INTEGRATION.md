# Confidence Calibration Integration Guide

## Overview

The confidence calibration system validates whether predicted confidence scores accurately match actual outcomes, enabling continuous improvement of autonomous decision-making.

## Architecture

```
Autonomous Framework
  ├── issue-classifier.ts (predicts confidence)
  │   └── calculateConfidence() → 0.92
  │
  ├── autonomous-resolver.ts (executes resolution)
  │   └── resolveIssue() → success/rollback/failed
  │
  └── [INTEGRATION POINT]
      └── workspace-brain-mcp.validate_confidence_prediction()
          └── Stores prediction + outcome for calibration

Workspace Brain MCP
  └── calibration/
      ├── predictions/
      │   └── [issue-id].json (individual predictions)
      ├── calibration-reports/
      │   ├── weekly/
      │   └── monthly/
      └── threshold-history.json (threshold adjustments over time)
```

## Integration Points

### 1. After Autonomous Resolution

**File:** `autonomous-resolver.ts` or similar

**When:** After every autonomous resolution attempt (success, rollback, or failure)

**Implementation:**

```typescript
import { workspaceBrainMCP } from './mcp-clients';

async function resolveIssueAutonomously(issue: Issue): Promise<Resolution> {
  const startTime = Date.now();

  // 1. Classify issue and get confidence
  const classified = await classifier.classifyIssue(issue);
  const predicted_confidence = classified.confidence;
  const predicted_action = classified.recommendedAction;

  // 2. Execute resolution
  let actual_outcome: 'success' | 'rollback' | 'failed';
  try {
    const resolution = await executeResolution(issue, classified);

    // Validate deployment
    const validationResult = await validateDeployment(resolution);

    if (validationResult.success) {
      actual_outcome = 'success';
    } else {
      // Rollback on validation failure
      await rollbackDeployment(resolution);
      actual_outcome = 'rollback';
    }
  } catch (error) {
    actual_outcome = 'failed';
  }

  // 3. Calculate resolution time
  const resolution_time_minutes = (Date.now() - startTime) / 60000;

  // 4. [INTEGRATION] Validate confidence prediction
  await workspaceBrainMCP.validate_confidence_prediction({
    issue_id: issue.id,
    predicted_confidence,
    predicted_action,
    actual_outcome,
    resolution_time_minutes,
    issue_type: issue.type,
    severity: issue.severity,
    component: issue.affectedComponent
  });

  // 5. Return resolution result
  return {
    issue_id: issue.id,
    outcome: actual_outcome,
    confidence: predicted_confidence,
    time_minutes: resolution_time_minutes
  };
}
```

### 2. Calibration Multipliers in issue-classifier.ts

**File:** `issue-classifier.ts`

**Enhancement:** Apply calibration multipliers to confidence scores

**Implementation:**

```typescript
import { workspaceBrainMCP } from './mcp-clients';

export class IssueClassifier {
  private calibrationMultipliers: Map<number, number> | null = null;

  constructor(workspacePath: string, storageManager: StorageManager) {
    this.workspacePath = workspacePath;
    this.storageManager = storageManager;

    // Load calibration multipliers on startup
    this.loadCalibrationMultipliers();
  }

  /**
   * Load calibration multipliers from workspace-brain
   */
  private async loadCalibrationMultipliers(): Promise<void> {
    try {
      const report = await workspaceBrainMCP.get_calibration_report({
        time_range: 'month'
      });

      // Extract calibration data and create multiplier map
      // This applies isotonic regression to adjust confidence scores
      this.calibrationMultipliers = this.buildCalibrationMap(report);
    } catch (error) {
      console.log('No calibration data available yet, using default confidence');
      this.calibrationMultipliers = null;
    }
  }

  /**
   * Build calibration map from report data
   */
  private buildCalibrationMap(report: any): Map<number, number> {
    const map = new Map<number, number>();

    report.by_bucket.forEach((bucket: any) => {
      const predicted = bucket.predicted_confidence_avg;
      const actual = bucket.actual_success_rate;

      // Store mapping: predicted → actual
      map.set(
        Math.round(predicted * 10) / 10,
        actual
      );
    });

    return map;
  }

  /**
   * Apply calibration to confidence score
   */
  private applyCalibratedConfidence(rawConfidence: number): number {
    if (!this.calibrationMultipliers) {
      return rawConfidence; // No calibration data yet
    }

    const bucket = Math.floor(rawConfidence * 10) / 10;

    if (this.calibrationMultipliers.has(bucket)) {
      const calibrated = this.calibrationMultipliers.get(bucket)!;
      console.log(`  Calibration: ${rawConfidence.toFixed(2)} → ${calibrated.toFixed(2)}`);
      return calibrated;
    }

    return rawConfidence; // No calibration for this bucket
  }

  /**
   * Calculate confidence with calibration
   */
  private async calculateConfidence(issue: Issue): Promise<number> {
    // Calculate base confidence (existing logic)
    const baseConfidence = await this.calculateBaseConfidence(issue);

    // Apply calibration
    const calibratedConfidence = this.applyCalibratedConfidence(baseConfidence);

    return Math.max(0, Math.min(1, calibratedConfidence));
  }
}
```

### 3. Monthly Calibration Job

**File:** `scripts/monthly-calibration.ts`

**Purpose:** Automated monthly calibration analysis and threshold adjustment

**Implementation:**

```typescript
import { workspaceBrainMCP } from './mcp-clients';
import { promises as fs } from 'fs';
import { join } from 'path';

async function monthlyCalibrationJob() {
  console.log('='.repeat(80));
  console.log('MONTHLY CALIBRATION ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  // 1. Generate calibration report
  console.log('Generating monthly calibration report...');
  const report = await workspaceBrainMCP.get_calibration_report({
    time_range: 'month'
  });

  console.log(`Total predictions: ${report.total_predictions}`);
  console.log(`Overall accuracy: ${(report.overall_accuracy * 100).toFixed(1)}%`);
  console.log(`Calibration quality: ${report.calibration_quality}`);
  console.log();

  // 2. Get confidence trends
  console.log('Analyzing confidence trends...');
  const trends = await workspaceBrainMCP.get_confidence_trends({
    weeks_back: 4 // Last month
  });

  console.log(`Calibration trend: ${trends.summary.improvement_trend}`);
  console.log();

  // 3. Adjust thresholds if needed
  console.log('Checking threshold adjustments...');
  const thresholds = await workspaceBrainMCP.adjust_confidence_thresholds({
    target_success_rate: 0.95,
    min_sample_size: 10
  });

  if (thresholds.adjustment_needed) {
    console.log('⚠️  THRESHOLD ADJUSTMENT RECOMMENDED');
    console.log(`  Current autonomous threshold: ${thresholds.current_thresholds.autonomous}`);
    console.log(`  Recommended: ${thresholds.recommended_thresholds.autonomous}`);
    console.log();
    console.log('Justification:');
    thresholds.justification.forEach((reason: string) => {
      console.log(`  - ${reason}`);
    });
    console.log();

    // TODO: Update issue-classifier.ts thresholds (manual review required)
    console.log('ACTION REQUIRED: Update AUTONOMOUS_THRESHOLD in issue-classifier.ts');
  } else {
    console.log('✓ Current thresholds are optimal');
  }
  console.log();

  // 4. Save report
  const reportPath = join(
    process.cwd(),
    'calibration-reports',
    `monthly-${new Date().toISOString().split('T')[0]}.md`
  );

  await fs.mkdir(join(process.cwd(), 'calibration-reports'), { recursive: true });

  const markdown = `# Monthly Calibration Report
**Date:** ${new Date().toISOString().split('T')[0]}

## Summary
- **Total Predictions:** ${report.total_predictions}
- **Overall Accuracy:** ${(report.overall_accuracy * 100).toFixed(1)}%
- **Calibration Quality:** ${report.calibration_quality}
- **Trend:** ${trends.summary.improvement_trend}

## Confidence Buckets
${report.by_bucket.map((bucket: any) => `
### ${bucket.range}
- Predictions: ${bucket.predictions_count}
- Actual Success Rate: ${(bucket.actual_success_rate * 100).toFixed(1)}%
- Predicted Avg: ${(bucket.predicted_confidence_avg * 100).toFixed(1)}%
- Calibration Error: ${(bucket.calibration_error * 100).toFixed(1)}%
- **Recommendation:** ${bucket.recommendation}
`).join('\n')}

## Recommendations
${report.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## Threshold Adjustments
${thresholds.adjustment_needed ? `
**ACTION REQUIRED**

Current Thresholds:
- Autonomous: ${thresholds.current_thresholds.autonomous}
- Assisted: ${thresholds.current_thresholds.assisted}

Recommended Thresholds:
- Autonomous: ${thresholds.recommended_thresholds.autonomous}
- Assisted: ${thresholds.recommended_thresholds.assisted}

Justification:
${thresholds.justification.map((j: string) => `- ${j}`).join('\n')}

Expected Improvement: ${thresholds.expected_improvement}
` : 'No adjustment needed. Current thresholds are optimal.'}
`;

  await fs.writeFile(reportPath, markdown);
  console.log(`Report saved to: ${reportPath}`);
}

// Schedule with cron or run manually
if (import.meta.url === `file://${process.argv[1]}`) {
  monthlyCalibrationJob()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Calibration job failed:', error);
      process.exit(1);
    });
}

export { monthlyCalibrationJob };
```

**Cron schedule:**
```bash
# Run on the 1st of every month at 2 AM
0 2 1 * * node dist/scripts/monthly-calibration.js
```

## Calibration Math

### Confidence Buckets

Predictions are grouped into confidence buckets:
- `0.90-1.00`: Autonomous threshold
- `0.80-0.89`: High assisted
- `0.70-0.79`: Assisted threshold
- `0.60-0.69`: Low assisted
- `0.50-0.59`: Manual with guidance
- `0.00-0.49`: Manual only

### Calibration Error

For each bucket:
```
Calibration Error = Predicted Confidence Avg - Actual Success Rate

Example:
  Bucket: 0.90-1.00
  Predictions: 25
  Predicted Avg: 0.95
  Actual Success Rate: 0.78 (19 successes / 25 predictions)
  Calibration Error: +0.17 (OVERCONFIDENT)
```

**Interpretation:**
- Positive error = Overconfident (predicted higher than actual)
- Negative error = Underconfident (predicted lower than actual)
- Error < 0.05 = Well calibrated

### Threshold Adjustment Algorithm

```typescript
// Find autonomous threshold where success rate ≥ 0.95
for (threshold = 0.99; threshold >= 0.80; threshold -= 0.01) {
  const candidates = predictions.filter(p => p.confidence >= threshold);

  if (candidates.length >= MIN_SAMPLE_SIZE) {
    const successRate = successes / candidates.length;

    if (successRate >= 0.95) {
      autonomousThreshold = threshold;
      break;
    }
  }
}
```

## Testing

### Run Calibration Test

```bash
cd local-instances/mcp-servers/workspace-brain-mcp-server
npm run build
node dist/tools/test-calibration.js
```

**Expected Output:**
```
================================================================================
CALIBRATION SYSTEM TEST
================================================================================

Step 1: Generating 100 synthetic predictions...
  Generated 100 predictions
  Confidence range: 0.51 - 0.99

Step 2: Storing predictions...
  All predictions stored

Step 3: Generating calibration report...
  Calibration Report:
    Total predictions: 100
    Overall accuracy: 73.0%
    Calibration quality: needs-improvement

  Confidence Buckets:
    0.90-1.00: 28 predictions, 76.5% success
      Predicted: 94.2%, Calibration Error: +17.7%
      Significantly overconfident. Lower threshold by 18%
    ...

Step 4: Analyzing confidence trends...
  Analyzed 12 weeks
  Calibration trend: improving
  Improvement: 12.5%

Step 5: Recommending threshold adjustments...
  Current thresholds:
    Autonomous: 0.90
    Assisted: 0.70

  Recommended thresholds:
    Autonomous: 0.96
    Assisted: 0.72

  Expected improvement: +18.5% success rate improvement for autonomous actions
```

## Monitoring

### Weekly Check

```bash
# Get weekly calibration report
curl -X POST http://localhost:3000/tools/get_calibration_report \
  -H "Content-Type: application/json" \
  -d '{"time_range": "week"}'
```

### Dashboard

```bash
# Create calibration dashboard (future feature)
# Shows real-time calibration status, trends, alerts
```

## Alerts

The system should alert when:
- Calibration error > 0.15 in high-confidence bucket (0.90-1.00)
- Overall accuracy drops below 80%
- Degrading calibration trend detected
- Threshold adjustment recommended

## Best Practices

1. **Always validate predictions**: Call `validate_confidence_prediction()` after EVERY autonomous resolution
2. **Monthly reviews**: Run monthly calibration job and review reports
3. **Gradual threshold changes**: Don't adjust thresholds by more than 0.05 at a time
4. **Minimum sample size**: Need at least 10 predictions per bucket for reliable calibration
5. **Issue type separation**: Monitor calibration separately for broken/missing/improvement types
6. **Reload calibration**: Restart issue-classifier after threshold adjustments to load new calibration data

## Troubleshooting

### "Insufficient data" error
- Need at least 10 predictions before generating calibration reports
- Run test data generator: `npm run test:calibration`

### Calibration not improving
- Check if predictions are being validated (look in `calibration/predictions/`)
- Verify threshold adjustments are being applied to issue-classifier
- Review issue type distribution (some types may need type-specific calibration)

### High calibration error
- Normal for first few weeks (cold start problem)
- Should improve as more data accumulates
- If persistent after 50+ predictions, review confidence calculation logic

## Example Workflow

1. **Week 1**: Deploy autonomous framework, start validating predictions
2. **Week 2-4**: Accumulate 30+ predictions
3. **Week 4**: First calibration report shows 15% overconfidence in 0.90-1.00 bucket
4. **Week 5**: Adjust autonomous threshold from 0.90 → 0.95
5. **Week 6-8**: Continue validating with new threshold
6. **Week 8**: Calibration report shows 5% overconfidence (improved!)
7. **Week 9**: Apply 0.95x calibration multiplier to confidence scores
8. **Week 12**: System is well-calibrated, 95%+ success rate for autonomous actions

## Files Created

```
~/workspace-brain/calibration/
├── predictions/
│   ├── issue-001.json
│   ├── issue-002.json
│   └── ... (one per prediction)
├── calibration-reports/
│   ├── weekly/
│   │   └── 2025-01-07.json
│   └── monthly/
│       └── 2025-01-01.json
└── threshold-history.json
```

## API Reference

See [calibration.ts](../src/tools/calibration.ts) for detailed API documentation.
