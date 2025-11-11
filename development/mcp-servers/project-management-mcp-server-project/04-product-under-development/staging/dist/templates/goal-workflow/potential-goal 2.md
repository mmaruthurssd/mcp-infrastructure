# {{goalName}}

**Created:** {{createdDate}}
**Last Updated:** {{lastUpdated}}
**Status:** Potential

---

## Quick Summary

**What:** {{goalDescription}}

{{#if context}}
**Context:** {{context}}
{{/if}}

---

## AI Impact/Effort Analysis

**Impact:** {{impactScore}} - {{impactReasoning}}

**Impact Factors:**
- People Affected: ~{{peopleAffected}}
- Problem Severity: {{problemSeverity}}
- Strategic Value: {{strategicValue}}
- Confidence: {{impactConfidence}}

**Effort:** {{effortScore}} - {{effortReasoning}}

**Effort Factors:**
- Time Estimate: {{timeEstimate}}
- Technical Complexity: {{technicalComplexity}}
- Dependencies: {{dependenciesCount}}
- Scope Clarity: {{scopeClarity}}
- Confidence: {{effortConfidence}}

**Suggested Tier:** {{suggestedTier}}

**User Override:** {{#if userOverride}}{{userOverride}}{{else}}(Leave blank, or note if you disagree with AI assessment){{/if}}

{{#if autonomousConfidence}}

### Autonomous Deployment Classification

**Issue Type:** {{issueType}}{{#if baseType}} → {{baseType}}{{/if}}

**Confidence:** {{autonomousConfidencePercent}}%

**Recommended Action:** {{recommendedAction}}
- **autonomous** (≥90%): Can proceed without approval
- **assisted** (70-89%): AI suggests solution for your approval
- **manual** (<70%): Human-led with AI support

**Reasoning:** {{classificationReasoning}}

{{#if autonomousEligible}}
✅ **Eligible for autonomous deployment** - High confidence in resolution approach.
{{else}}
⚠️ **Requires human oversight** - Lower confidence or high-risk type (security, PHI, etc.).
{{/if}}

{{/if}}

---

## Evaluation (Optional - Answer as Needed)

### 1. Problem/Opportunity
**What problem does this solve, or what opportunity does it capture?**

{{#if problem}}
{{problem}}
{{else}}
(Describe the problem or opportunity this goal addresses)
{{/if}}

### 2. Expected Value
**What value will this create? Who benefits and how?**

{{#if expectedValue}}
{{expectedValue}}
{{else}}
(Describe the expected value and beneficiaries)
{{/if}}

### 3. Rough Effort Estimate
**How much time/resources would this take? What's involved?**

{{#if effortDetails}}
{{effortDetails}}
{{else}}
(Provide a rough estimate of time and resources needed)
{{/if}}

### 4. Dependencies & Prerequisites
**What needs to be done first? What blockers exist?**

{{#if dependencies}}
{{dependencies}}
{{else}}
(List any dependencies or prerequisites)
{{/if}}

### 5. Risks & Unknowns
**What could go wrong? What don't we know yet?**

{{#if risks}}
{{risks}}
{{else}}
(Identify potential risks and unknowns)
{{/if}}

### 6. Alternatives Considered
**What other approaches could solve this? Why this approach?**

{{#if alternatives}}
{{alternatives}}
{{else}}
(Describe alternative approaches considered)
{{/if}}

### 7. Decision Criteria
**What would make this a clear "yes" to pursue?**

{{#if decisionCriteria}}
{{decisionCriteria}}
{{else}}
(Define what criteria would make this worth pursuing)
{{/if}}

---

## AI Suggestions

{{#if suggestions}}
{{#each suggestions}}
- {{this}}
{{/each}}
{{else}}
(AI-generated suggestions for refinement will appear here)
{{/if}}

---

## Next Steps

{{#if nextSteps}}
{{#each nextSteps}}
{{@index}}. {{this}}
{{/each}}
{{else}}
(AI-generated next steps will appear here)
{{/if}}

---

## Notes

{{#if notes}}
{{notes}}
{{else}}
(Add any additional notes, thoughts, or context here)
{{/if}}
