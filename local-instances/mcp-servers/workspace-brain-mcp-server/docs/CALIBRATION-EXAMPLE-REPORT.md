# Example Calibration Report

**Generated:** 2025-11-07
**Period:** Last 100 predictions
**Data Source:** Synthetic test data

---

## Executive Summary

- **Total Predictions:** 100
- **Overall Accuracy:** 74.0%
- **Calibration Quality:** Good
- **Trend:** Stable (first week of data)
- **Action Required:** Adjust assisted threshold from 0.70 → 0.85

---

## Confidence Bucket Analysis

### High Confidence (0.90-1.00) - AUTONOMOUS THRESHOLD

| Metric | Value |
|--------|-------|
| **Predictions** | 19 |
| **Actual Success Rate** | 84.0% |
| **Predicted Confidence (Avg)** | 94.0% |
| **Calibration Error** | +10.0% ⚠️ |

**Status:** Slightly overconfident
**Recommendation:** Apply 0.90x multiplier OR increase threshold to 0.95
**Risk:** With 84% success rate, 16% of autonomous actions may fail

---

### Medium-High Confidence (0.80-0.89)

| Metric | Value |
|--------|-------|
| **Predictions** | 25 |
| **Actual Success Rate** | 84.0% |
| **Predicted Confidence (Avg)** | 84.0% |
| **Calibration Error** | 0.0% ✓ |

**Status:** Well calibrated
**Recommendation:** No adjustment needed
**Note:** This bucket shows excellent calibration

---

### Medium Confidence (0.70-0.79) - ASSISTED THRESHOLD

| Metric | Value |
|--------|-------|
| **Predictions** | 13 |
| **Actual Success Rate** | 62.0% |
| **Predicted Confidence (Avg)** | 75.0% |
| **Calibration Error** | +14.0% ⚠️ |

**Status:** Moderately overconfident
**Recommendation:** Apply 0.86x multiplier
**Risk:** Assisted actions in this range may have lower success than predicted

---

### Low-Medium Confidence (0.60-0.69)

| Metric | Value |
|--------|-------|
| **Predictions** | 24 |
| **Actual Success Rate** | 71.0% |
| **Predicted Confidence (Avg)** | 65.0% |
| **Calibration Error** | -6.0% |

**Status:** Slightly underconfident
**Recommendation:** Can be more aggressive, consider 1.05x multiplier
**Opportunity:** May be able to elevate some of these to assisted tier

---

### Low Confidence (0.50-0.59)

| Metric | Value |
|--------|-------|
| **Predictions** | 19 |
| **Actual Success Rate** | 63.0% |
| **Predicted Confidence (Avg)** | 55.0% |
| **Calibration Error** | -8.0% |

**Status:** Underconfident
**Recommendation:** System is conservative in this range (acceptable)
**Note:** Manual review appropriate for these cases

---

## Issue Type Analysis

### Broken (Fixes)

| Metric | Value |
|--------|-------|
| **Predictions** | 32 |
| **Accuracy** | 75.0% |
| **Avg Confidence** | 0.72 |
| **Calibration Error** | +35.0% ⚠️⚠️ |

**Status:** POORLY CALIBRATED
**Recommendation:** Reduce confidence for "broken" type issues by 25-35%
**Root Cause:** Overestimating ability to fix issues autonomously

---

### Missing (New Features)

| Metric | Value |
|--------|-------|
| **Predictions** | 34 |
| **Accuracy** | 70.6% |
| **Avg Confidence** | 0.68 |
| **Calibration Error** | +33.0% ⚠️⚠️ |

**Status:** POORLY CALIBRATED
**Recommendation:** Cap "missing" type confidence at 0.85 (already in place, but may need 0.75)
**Note:** New features inherently harder to predict success

---

### Improvement (Enhancements)

| Metric | Value |
|--------|-------|
| **Predictions** | 34 |
| **Accuracy** | 76.5% |
| **Avg Confidence** | 0.70 |
| **Calibration Error** | +38.0% ⚠️⚠️ |

**Status:** POORLY CALIBRATED
**Recommendation:** Apply 0.65x multiplier to improvement type confidence
**Analysis:** Improvements show highest overconfidence

---

## Threshold Recommendations

### Current Thresholds

```typescript
const AUTONOMOUS_THRESHOLD = 0.90;  // Auto-deploy without review
const ASSISTED_THRESHOLD = 0.70;     // AI suggests, human approves
```

### Recommended Thresholds

```typescript
const AUTONOMOUS_THRESHOLD = 0.90;  // No change (but monitor closely)
const ASSISTED_THRESHOLD = 0.85;     // ↑ Increase from 0.70
```

### Justification

1. **Autonomous (0.90):**
   - Current: 19 predictions, 84% success rate
   - Target: 95% success rate
   - **Keep at 0.90** but apply calibration multipliers
   - With calibration, effective threshold becomes ~0.95

2. **Assisted (0.70 → 0.85):**
   - Analysis shows 10 predictions at 0.85+ have 90% success
   - Current 0.70 threshold too permissive
   - **Increase to 0.85** to improve quality of assisted suggestions

### Expected Impact

- **Autonomous actions:** 15% reduction in volume, but 95%+ success rate
- **Assisted actions:** Better quality suggestions, reduced false positives
- **Manual actions:** Slight increase in volume, but appropriate for complexity

---

## Calibration Multipliers

Apply these multipliers to raw confidence scores:

```typescript
const CALIBRATION_MULTIPLIERS = {
  // By confidence bucket
  '0.90-1.00': 0.90,  // 10% reduction for overconfidence
  '0.80-0.89': 1.00,  // No adjustment (well calibrated)
  '0.70-0.79': 0.86,  // 14% reduction
  '0.60-0.69': 1.05,  // 5% increase (underconfident)
  '0.50-0.59': 1.08,  // 8% increase (underconfident)

  // By issue type (applied after bucket multiplier)
  'broken': 0.75,      // 25% reduction
  'missing': 0.70,     // 30% reduction
  'improvement': 0.65  // 35% reduction
};
```

### Application Example

```typescript
// Original confidence calculation
const rawConfidence = 0.92; // "improvement" type
const bucketMultiplier = 0.90; // 0.90-1.00 bucket
const typeMultiplier = 0.65; // improvement type

// Apply calibration
const calibrated = rawConfidence * bucketMultiplier * typeMultiplier;
// 0.92 * 0.90 * 0.65 = 0.54

// Result: Changes from "autonomous" (0.92) to "manual" (0.54)
```

---

## Trend Analysis

### Weekly Calibration Trends

Since this is week 1, trend data is limited. After 4+ weeks, this section will show:

- Calibration error over time (should decrease)
- Success rate trends by confidence bucket
- Issue type calibration improvements
- Threshold adjustment history

### Early Observations

1. **Sample Size:** 100 predictions is good for initial calibration
2. **Distribution:** Good mix across confidence buckets and issue types
3. **Overconfidence Pattern:** Consistent across all issue types (systemic)
4. **Next Steps:** Continue collecting data, re-evaluate in 2 weeks

---

## Action Items

### Immediate (This Week)

- [ ] Update `issue-classifier.ts` with calibration multipliers
- [ ] Increase assisted threshold to 0.85
- [ ] Test calibrated confidence on 10 new issues
- [ ] Monitor autonomous success rate (target: 95%+)

### Short-term (2-4 Weeks)

- [ ] Collect 100 more predictions with calibration applied
- [ ] Re-run calibration report (expect improvement)
- [ ] Fine-tune multipliers based on new data
- [ ] Document learnings in calibration integration guide

### Long-term (Monthly)

- [ ] Monthly calibration review meeting
- [ ] Trend analysis (compare month-over-month)
- [ ] Adjust thresholds if needed (max ±0.05 per month)
- [ ] Archive old calibration data (keep last 6 months)

---

## Risk Assessment

### Low Risk ✓

- 0.80-0.89 bucket: Well calibrated, no changes needed
- Underconfident buckets: Conservative is safe

### Medium Risk ⚠️

- 0.90-1.00 bucket: 10% overconfidence
- 0.70-0.79 bucket: 14% overconfidence
- **Mitigation:** Apply multipliers, monitor closely

### High Risk ⚠️⚠️

- All issue types show 30-38% overconfidence
- "Improvement" type: 38% calibration error
- **Mitigation:** Type-specific multipliers, mandatory human review for improvements

---

## Calibration Quality Score

**Overall Grade: B (Good)**

| Category | Score | Weight |
|----------|-------|--------|
| Confidence Bucket Accuracy | 7/10 | 40% |
| Issue Type Accuracy | 5/10 | 30% |
| Threshold Appropriateness | 8/10 | 20% |
| Sample Size | 9/10 | 10% |
| **Total** | **6.9/10** | **100%** |

### Score Interpretation

- **8-10 (Excellent):** System ready for autonomous deployment
- **6-8 (Good):** Apply calibration, monitor closely
- **4-6 (Needs Improvement):** Conservative thresholds, frequent reviews
- **0-4 (Poor):** Manual-only mode, fundamental issues

---

## Appendix: Raw Data Sample

### Example Predictions

```json
[
  {
    "issue_id": "test-issue-042",
    "predicted_confidence": 0.94,
    "predicted_action": "autonomous",
    "actual_outcome": "success",
    "issue_type": "broken",
    "resolution_time_minutes": 15
  },
  {
    "issue_id": "test-issue-087",
    "predicted_confidence": 0.92,
    "predicted_action": "autonomous",
    "actual_outcome": "failed",
    "issue_type": "improvement",
    "resolution_time_minutes": 142
  }
]
```

### Bucket Distribution Chart

```
0.90-1.00  ████████████████ (19 predictions, 84% success)
0.80-0.89  ██████████████████████ (25 predictions, 84% success)
0.70-0.79  ███████████ (13 predictions, 62% success)
0.60-0.69  ████████████████████ (24 predictions, 71% success)
0.50-0.59  ████████████████ (19 predictions, 63% success)
```

---

## Next Review

**Date:** December 7, 2025 (1 month)
**Expected Data:** 200+ predictions
**Goals:**
- Calibration quality score > 8.0
- Autonomous success rate > 95%
- All issue types well-calibrated (error < 10%)
