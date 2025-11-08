# Confidence Calibration System

## Overview

The Confidence Calibration System validates whether predicted confidence scores from the Autonomous Deployment Framework accurately reflect actual success rates. This enables continuous improvement and trustworthy autonomous operations.

## Problem Statement

**Challenge:** When the issue classifier predicts 90% confidence, does that mean 90% actual success rate?

**Without Calibration:**
- Classifier predicts: 92% confidence → "autonomous"
- Actual outcome: 78% success rate
- **Result:** System is overconfident, 22% failure rate for autonomous actions ⚠️

**With Calibration:**
- Classifier predicts: 92% confidence
- Calibration adjusts: 92% × 0.85 = 78% (based on historical data)
- New action: "assisted" (requires approval)
- **Result:** Accurate confidence, safe autonomous operations ✓

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Autonomous Framework                        │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ Issue        │      │ Autonomous   │                    │
│  │ Classifier   │─────▶│ Resolver     │                    │
│  │              │      │              │                    │
│  │ Predicts:    │      │ Executes:    │                    │
│  │ - Confidence │      │ - Fix        │                    │
│  │ - Action     │      │ - Deploy     │                    │
│  └──────┬───────┘      │ - Validate   │                    │
│         │              └──────┬───────┘                    │
│         │                     │                             │
│         │                     │ Outcome:                    │
│         │                     │ success/rollback/failed     │
│         │                     │                             │
└─────────┼─────────────────────┼─────────────────────────────┘
          │                     │
          │   Prediction        │   Validation
          ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Workspace Brain MCP - Calibration               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ validate_confidence_prediction()                     │   │
│  │  - Stores: prediction + outcome                      │   │
│  │  - Calculates: calibration error                     │   │
│  │  - Returns: feedback                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Calibration Data                                     │   │
│  │  - predictions/*.json (individual records)           │   │
│  │  - threshold-history.json (adjustment log)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Analysis Tools                                       │   │
│  │  - get_calibration_report() → bucket analysis        │   │
│  │  - get_confidence_trends() → time series            │   │
│  │  - adjust_confidence_thresholds() → recommendations │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ Calibration Multipliers
                           ▼
                  ┌─────────────────┐
                  │ Issue Classifier│
                  │ (reload)        │
                  │ Applies:        │
                  │ - Multipliers   │
                  │ - New thresholds│
                  └─────────────────┘
```

## Key Concepts

### 1. Confidence Buckets

Predictions are grouped into ranges:

| Bucket | Range | Typical Action | Target Success Rate |
|--------|-------|----------------|---------------------|
| **High** | 0.90-1.00 | Autonomous | 95%+ |
| **Medium-High** | 0.80-0.89 | Assisted (optional) | 85%+ |
| **Medium** | 0.70-0.79 | Assisted (required) | 75%+ |
| **Low-Medium** | 0.60-0.69 | Manual with AI help | 65%+ |
| **Low** | 0.50-0.59 | Manual | No target |
| **Very Low** | 0.00-0.49 | Manual only | No target |

### 2. Calibration Error

**Formula:** `Calibration Error = Predicted Confidence - Actual Success Rate`

**Interpretation:**
- **Positive error:** Overconfident (predicted > actual)
  - Example: Predict 92%, actual 78% → +14% error ⚠️
  - Risk: System deploys autonomously when it shouldn't

- **Negative error:** Underconfident (predicted < actual)
  - Example: Predict 65%, actual 71% → -6% error
  - Impact: System requires human review when it could be autonomous

- **Well calibrated:** Error < 5%
  - Example: Predict 84%, actual 84% → 0% error ✓

### 3. Isotonic Regression

Calibration algorithm that ensures monotonic improvement:

```
Input:  Raw confidence scores + actual outcomes
Output: Calibrated confidence scores

Process:
1. Group predictions by confidence bucket
2. Calculate actual success rate per bucket
3. Map predicted → actual using isotonic regression
4. Apply mapping to future predictions

Example:
  Bucket: 0.90-1.00
  Predicted: 0.95 (avg)
  Actual: 0.78 (19/25 successes)
  Multiplier: 0.78 / 0.95 = 0.82

  Future prediction: 0.92
  Calibrated: 0.92 × 0.82 = 0.75
  Action changes: autonomous → assisted ✓
```

### 4. Threshold Adjustment

Dynamically adjust thresholds based on historical success rates:

```typescript
// Goal: Find threshold where success rate ≥ 95%
function findOptimalThreshold(predictions, targetSuccessRate = 0.95) {
  // Sort predictions by confidence (descending)
  const sorted = predictions.sort((a, b) => b.confidence - a.confidence);

  // Try different thresholds
  for (let threshold = 0.99; threshold >= 0.80; threshold -= 0.01) {
    const candidates = sorted.filter(p => p.confidence >= threshold);

    if (candidates.length >= 10) { // Min sample size
      const successRate = candidates.filter(p => p.outcome === 'success').length / candidates.length;

      if (successRate >= targetSuccessRate) {
        return threshold; // Found optimal threshold
      }
    }
  }

  return 0.90; // Default
}
```

## Tools

### 1. validate_confidence_prediction

**Purpose:** Store prediction and calculate calibration feedback

**When to use:** After EVERY autonomous resolution attempt

**Parameters:**
```typescript
{
  issue_id: string;                    // Unique identifier
  predicted_confidence: number;        // 0-1 score from classifier
  predicted_action: 'autonomous' | 'assisted' | 'manual';
  actual_outcome: 'success' | 'rollback' | 'failed';
  resolution_time_minutes: number;     // How long it took
  issue_type: 'broken' | 'missing' | 'improvement';
  severity?: string;                   // Optional: low/medium/high/critical
  component?: string;                  // Optional: affected component
}
```

**Returns:**
```json
{
  "issue_id": "prod-042",
  "predicted_confidence": 0.92,
  "actual_outcome": "success",
  "success": true,
  "calibration_error": -0.08,
  "confidence_bucket": "0.90-1.00",
  "bucket_success_rate": 0.84,
  "bucket_sample_size": 19,
  "recommendation": "Well calibrated",
  "timestamp": "2025-11-07T10:30:00Z"
}
```

### 2. get_calibration_report

**Purpose:** Generate comprehensive calibration analysis

**When to use:** Weekly/monthly reviews, after collecting 20+ predictions

**Parameters:**
```typescript
{
  time_range?: 'week' | 'month' | 'all';  // Default: 'all'
  issue_type_filter?: 'broken' | 'missing' | 'improvement';
}
```

**Returns:** See [CALIBRATION-EXAMPLE-REPORT.md](CALIBRATION-EXAMPLE-REPORT.md)

Key sections:
- Overall accuracy
- Confidence bucket analysis
- Issue type analysis
- Recommendations
- Calibration quality score

### 3. get_confidence_trends

**Purpose:** Show calibration improvement over time

**When to use:** Monthly reviews, detect degradation

**Parameters:**
```typescript
{
  weeks_back?: number;  // Default: 12
  issue_type_filter?: 'broken' | 'missing' | 'improvement';
}
```

**Returns:**
```json
{
  "weeks_analyzed": 12,
  "trends": [
    {
      "week": "2025-W01",
      "predicted_avg": 0.85,
      "actual_success_rate": 0.78,
      "calibration_error": 0.07,
      "predictions_count": 8
    },
    ...
  ],
  "summary": {
    "improvement_trend": "improving",
    "improvement_percentage": 12.5,
    "first_half_avg_error": 0.15,
    "second_half_avg_error": 0.08
  },
  "poorly_calibrated_types": [
    { "type": "improvement", "avg_error": 0.38 }
  ]
}
```

### 4. adjust_confidence_thresholds

**Purpose:** Recommend threshold adjustments based on data

**When to use:** Monthly, after collecting 50+ predictions

**Parameters:**
```typescript
{
  target_success_rate?: number;  // Default: 0.95 (95%)
  min_sample_size?: number;       // Default: 10
}
```

**Returns:**
```json
{
  "current_thresholds": {
    "autonomous": 0.90,
    "assisted": 0.70
  },
  "recommended_thresholds": {
    "autonomous": 0.95,
    "assisted": 0.85
  },
  "justification": [
    "Autonomous threshold set to 0.95 based on 25 predictions with 96.0% success rate",
    "Assisted threshold set to 0.85 based on 10 predictions with 90.0% success rate"
  ],
  "expected_improvement": "+18.5% success rate improvement for autonomous actions",
  "adjustment_needed": true
}
```

## Quick Start

### 1. Installation

The calibration system is built into workspace-brain MCP (v1.3+):

```bash
cd local-instances/mcp-servers/workspace-brain-mcp-server
npm install
npm run build
```

### 2. Test with Synthetic Data

```bash
npm run test:calibration
# or
node build/tools/test-calibration.js
```

Expected output: 100 predictions, calibration report, threshold recommendations

### 3. Integration

See [CALIBRATION-INTEGRATION.md](CALIBRATION-INTEGRATION.md) for detailed integration guide.

**Minimal Integration:**

```typescript
// After autonomous resolution
await workspaceBrainMCP.validate_confidence_prediction({
  issue_id: issue.id,
  predicted_confidence: classified.confidence,
  predicted_action: classified.recommendedAction,
  actual_outcome: resolution.outcome, // 'success' | 'rollback' | 'failed'
  resolution_time_minutes: resolution.duration,
  issue_type: issue.type
});
```

### 4. Monthly Review

```bash
# Generate report
node -e "
  import('./build/tools/calibration.js').then(async ({ getCalibrationReport }) => {
    const result = await getCalibrationReport({ time_range: 'month' }, process.env.WORKSPACE_BRAIN_PATH);
    console.log(result.content[0].text);
  });
"

# Adjust thresholds
node -e "
  import('./build/tools/calibration.js').then(async ({ adjustConfidenceThresholds }) => {
    const result = await adjustConfidenceThresholds({ target_success_rate: 0.95 }, process.env.WORKSPACE_BRAIN_PATH);
    console.log(result.content[0].text);
  });
"
```

## Best Practices

### 1. Data Collection

✓ **DO:**
- Validate EVERY autonomous resolution (success and failure)
- Include optional fields (severity, component) for better analysis
- Collect at least 10 predictions per bucket before calibration
- Distribute predictions across different issue types

✗ **DON'T:**
- Skip validation for successful resolutions
- Only validate failures
- Adjust thresholds with < 20 total predictions
- Make large threshold changes (> 0.05 at once)

### 2. Threshold Adjustments

✓ **DO:**
- Review monthly calibration reports
- Make gradual adjustments (±0.02-0.05)
- Test new thresholds on 10 issues before full rollout
- Document justification for changes
- Keep threshold history

✗ **DON'T:**
- Adjust based on < 50 predictions
- Change thresholds more than once per month
- Skip human review of threshold changes
- Make >0.10 adjustments in one step

### 3. Calibration Quality

✓ **DO:**
- Aim for < 5% calibration error in high-confidence bucket
- Separate calibration by issue type if needed
- Monitor trends (should improve over time)
- Accept underconfidence (safer than overconfidence)

✗ **DON'T:**
- Ignore persistent overconfidence (> 15% error)
- Apply same multipliers to all issue types
- Expect perfect calibration immediately
- Trust calibration with < 10 samples per bucket

### 4. Monitoring

✓ **DO:**
- Weekly spot checks (get_calibration_report)
- Monthly deep reviews (trends + adjustments)
- Quarterly retrospectives
- Track autonomous success rate daily

✗ **DON'T:**
- Wait for failures to review calibration
- Ignore degrading trends
- Skip monthly reviews
- Assume calibration is permanent

## Troubleshooting

### "Insufficient data" Error

**Symptom:** Tools return "Need at least 10 predictions"

**Solution:**
1. Check prediction count: `ls ~/workspace-brain/calibration/predictions/ | wc -l`
2. If < 10, run test data: `npm run test:calibration`
3. Or wait for real predictions to accumulate

### High Calibration Error (> 15%)

**Symptom:** Report shows large positive calibration error

**Causes:**
1. **Cold start:** Normal for first 2-4 weeks
2. **Issue type mismatch:** Different types need different multipliers
3. **Threshold too low:** Autonomous threshold should be 0.90+

**Solutions:**
1. Collect more data (50+ predictions)
2. Apply type-specific multipliers
3. Increase autonomous threshold by 0.05
4. Review confidence calculation logic

### Degrading Calibration Trend

**Symptom:** `improvement_trend: "degrading"` in trends report

**Causes:**
1. Confidence calculation changed without recalibration
2. New issue types not seen in training data
3. System complexity increased (harder to predict)

**Solutions:**
1. Reset calibration if major changes made
2. Add new issue type examples
3. Lower thresholds temporarily
4. Increase human review frequency

### Threshold Adjustment Not Helping

**Symptom:** Adjusted threshold, but success rate didn't improve

**Causes:**
1. Sample size too small (statistical noise)
2. Calibration multipliers not applied
3. Issue classifier cache not refreshed

**Solutions:**
1. Wait for 20+ predictions with new threshold
2. Verify multipliers are being applied in code
3. Restart issue classifier to reload calibration

## Files and Directories

```
~/workspace-brain/calibration/
├── predictions/
│   ├── prod-001.json          # Individual prediction records
│   ├── prod-002.json
│   └── ...
├── calibration-reports/
│   ├── weekly/
│   │   ├── 2025-01-07.json    # Weekly reports
│   │   └── ...
│   └── monthly/
│       ├── 2025-01-01.json    # Monthly reports
│       └── ...
└── threshold-history.json      # All threshold adjustments
```

### Prediction File Format

```json
{
  "issue_id": "prod-042",
  "predicted_confidence": 0.92,
  "predicted_action": "autonomous",
  "actual_outcome": "success",
  "resolution_time_minutes": 15,
  "issue_type": "broken",
  "timestamp": "2025-11-07T10:30:00Z",
  "severity": "medium",
  "component": "patient-search"
}
```

## Metrics and KPIs

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Autonomous Success Rate** | > 95% | Successes / Total autonomous actions |
| **Calibration Error (0.90-1.00)** | < 5% | \|Predicted - Actual\| |
| **Calibration Quality** | Excellent/Good | System score (0-10) |
| **Trend** | Improving/Stable | Week-over-week error reduction |

### Warning Indicators

| Indicator | Threshold | Action |
|-----------|-----------|--------|
| Autonomous success rate | < 85% | Increase threshold by 0.05 |
| Calibration error (high bucket) | > 15% | Apply 0.85x multiplier |
| Degrading trend | 2+ weeks | Reset calibration, review |
| Sample size | < 10 per bucket | Collect more data |

## FAQ

**Q: How many predictions do I need before calibration is useful?**
A: Minimum 10 per confidence bucket (50-100 total). More is better.

**Q: How often should I adjust thresholds?**
A: Maximum once per month, ideally once per quarter after initial calibration.

**Q: What if calibration never improves?**
A: Review confidence calculation logic. May need fundamental changes to scoring algorithm.

**Q: Can I calibrate separately for different issue types?**
A: Yes! Apply type-specific multipliers. See integration guide.

**Q: What's a good calibration error?**
A: < 5% is excellent, < 10% is good, < 15% is acceptable, > 15% needs attention.

**Q: Should I be underconfident or overconfident?**
A: Slightly underconfident is safer. Better to require human review than auto-deploy failures.

## References

- [Calibration Integration Guide](CALIBRATION-INTEGRATION.md) - How to integrate with autonomous framework
- [Example Calibration Report](CALIBRATION-EXAMPLE-REPORT.md) - Sample report with annotations
- [Issue Classifier](../../development/frameworks/autonomous-deployment/core/issue-classifier.ts) - Confidence calculation
- [Workspace Brain MCP](../README.md) - Parent MCP server

## Version History

- **v1.0 (Nov 2025):** Initial calibration system
  - 4 core tools
  - Isotonic regression
  - Monthly threshold adjustment
  - Synthetic test data

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review example report for expected behavior
3. Examine test data generation for edge cases
4. Consult autonomous framework documentation
