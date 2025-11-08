/**
 * Cost Tracking and ROI Tools
 * Track API costs, time saved, and ROI for autonomous workflows
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
// Pricing Constants (Claude Sonnet 4.5)
const PRICING = {
    INPUT_TOKEN_COST: 0.015 / 1000, // $0.015 per 1K input tokens
    OUTPUT_TOKEN_COST: 0.075 / 1000, // $0.075 per 1K output tokens
    HUMAN_HOURLY_RATE: 50, // $50/hour for time saved
};
/**
 * Calculate API cost from token usage
 */
function calculateAPICost(inputTokens, outputTokens) {
    return (inputTokens * PRICING.INPUT_TOKEN_COST) + (outputTokens * PRICING.OUTPUT_TOKEN_COST);
}
/**
 * Calculate human cost saved
 */
function calculateHumanCostSaved(timeHours) {
    return timeHours * PRICING.HUMAN_HOURLY_RATE;
}
/**
 * Calculate ROI metrics
 */
function calculateROI(apiCost, humanCostSaved) {
    const netROI = humanCostSaved - apiCost;
    const roiRatio = apiCost > 0 ? humanCostSaved / apiCost : 0;
    return { netROI, roiRatio };
}
/**
 * Get date range for time_range parameter
 */
function getDateRange(timeRange) {
    const end = new Date();
    const start = new Date();
    switch (timeRange) {
        case "week":
            start.setDate(end.getDate() - 7);
            break;
        case "month":
            start.setMonth(end.getMonth() - 1);
            break;
        case "quarter":
            start.setMonth(end.getMonth() - 3);
            break;
        case "all":
            start.setFullYear(2000); // Far past
            break;
    }
    return { start, end };
}
/**
 * Load workflow cost records from storage
 */
function loadWorkflowCosts(workspacePath, filters) {
    const costDir = join(workspacePath, "cost-tracking", "workflows");
    if (!existsSync(costDir)) {
        return [];
    }
    const files = readdirSync(costDir);
    const costs = [];
    for (const file of files) {
        if (!file.endsWith(".json"))
            continue;
        try {
            const filePath = join(costDir, file);
            const content = readFileSync(filePath, "utf-8");
            const cost = JSON.parse(content);
            // Apply filters
            if (filters?.workflowName && !cost.workflow_name.includes(filters.workflowName)) {
                continue;
            }
            const costDate = new Date(cost.timestamp);
            if (filters?.startDate && costDate < filters.startDate)
                continue;
            if (filters?.endDate && costDate > filters.endDate)
                continue;
            costs.push(cost);
        }
        catch (error) {
            console.error(`Error loading cost file ${file}:`, error);
        }
    }
    return costs;
}
/**
 * Save monthly summary
 */
function saveMonthlySum(workspacePath, yearMonth, summary) {
    const summaryDir = join(workspacePath, "cost-tracking", "monthly-summaries");
    mkdirSync(summaryDir, { recursive: true });
    const summaryPath = join(summaryDir, `${yearMonth}.json`);
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
}
/**
 * Track workflow cost
 */
export async function trackWorkflowCost(args, workspacePath) {
    try {
        const costDir = join(workspacePath, "cost-tracking", "workflows");
        mkdirSync(costDir, { recursive: true });
        // Calculate costs
        const apiCost = calculateAPICost(args.api_tokens_used.input, args.api_tokens_used.output);
        const humanCostSaved = calculateHumanCostSaved(args.time_saved_hours);
        const { netROI, roiRatio } = calculateROI(apiCost, humanCostSaved);
        // Create workflow cost record
        const workflowCost = {
            id: randomUUID(),
            workflow_name: args.workflow_name,
            timestamp: new Date().toISOString(),
            api_tokens: args.api_tokens_used,
            time_saved_hours: args.time_saved_hours,
            outcome: args.outcome,
            api_cost: apiCost,
            human_cost_saved: humanCostSaved,
            net_roi: netROI,
            roi_ratio: roiRatio,
            metadata: args.metadata,
        };
        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `${args.workflow_name.replace(/\s+/g, "-")}-${timestamp}.json`;
        const filePath = join(costDir, filename);
        writeFileSync(filePath, JSON.stringify(workflowCost, null, 2));
        // Update monthly summary
        const yearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        const existingCosts = loadWorkflowCosts(workspacePath, {
            startDate: new Date(yearMonth + "-01"),
            endDate: new Date(),
        });
        const monthlySummary = {
            year_month: yearMonth,
            total_workflows: existingCosts.length,
            total_api_cost: existingCosts.reduce((sum, c) => sum + c.api_cost, 0),
            total_time_saved: existingCosts.reduce((sum, c) => sum + c.time_saved_hours, 0),
            total_human_cost_saved: existingCosts.reduce((sum, c) => sum + c.human_cost_saved, 0),
            total_net_roi: existingCosts.reduce((sum, c) => sum + c.net_roi, 0),
            avg_roi_ratio: existingCosts.reduce((sum, c) => sum + c.roi_ratio, 0) / existingCosts.length,
            updated_at: new Date().toISOString(),
        };
        saveMonthlySum(workspacePath, yearMonth, monthlySummary);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        workflow_cost: workflowCost,
                        summary: {
                            api_cost: `$${apiCost.toFixed(4)}`,
                            human_cost_saved: `$${humanCostSaved.toFixed(2)}`,
                            net_roi: `$${netROI.toFixed(2)}`,
                            roi_ratio: `${roiRatio.toFixed(2)}x`,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        throw new Error(`Failed to track workflow cost: ${error.message}`);
    }
}
/**
 * Get ROI report
 */
export async function getROIReport(args, workspacePath) {
    try {
        const { start, end } = getDateRange(args.time_range);
        const costs = loadWorkflowCosts(workspacePath, {
            startDate: start,
            endDate: end,
            workflowName: args.workflow_filter,
        });
        if (costs.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "No workflow cost data found for the specified time range.",
                    },
                ],
            };
        }
        // Calculate totals
        const totalAPICost = costs.reduce((sum, c) => sum + c.api_cost, 0);
        const totalTimeSaved = costs.reduce((sum, c) => sum + c.time_saved_hours, 0);
        const totalHumanCostSaved = costs.reduce((sum, c) => sum + c.human_cost_saved, 0);
        const totalNetROI = costs.reduce((sum, c) => sum + c.net_roi, 0);
        const avgROIRatio = costs.reduce((sum, c) => sum + c.roi_ratio, 0) / costs.length;
        // Breakdown by outcome
        const completed = costs.filter((c) => c.outcome === "completed");
        const failed = costs.filter((c) => c.outcome === "failed");
        const blocked = costs.filter((c) => c.outcome === "blocked");
        // Generate markdown report
        const report = `# ROI Report (${args.time_range})

## Summary
- **Total Workflows**: ${costs.length}
- **Total API Cost**: $${totalAPICost.toFixed(2)}
- **Total Time Saved**: ${totalTimeSaved.toFixed(1)} hours
- **Total Human Cost Saved**: $${totalHumanCostSaved.toFixed(2)}
- **Net ROI**: $${totalNetROI.toFixed(2)}
- **Average ROI Ratio**: ${avgROIRatio.toFixed(2)}x

## Breakdown by Outcome

| Outcome | Count | API Cost | Time Saved | Net ROI |
|---------|-------|----------|------------|---------|
| Completed | ${completed.length} | $${completed.reduce((s, c) => s + c.api_cost, 0).toFixed(2)} | ${completed.reduce((s, c) => s + c.time_saved_hours, 0).toFixed(1)}h | $${completed.reduce((s, c) => s + c.net_roi, 0).toFixed(2)} |
| Failed | ${failed.length} | $${failed.reduce((s, c) => s + c.api_cost, 0).toFixed(2)} | ${failed.reduce((s, c) => s + c.time_saved_hours, 0).toFixed(1)}h | $${failed.reduce((s, c) => s + c.net_roi, 0).toFixed(2)} |
| Blocked | ${blocked.length} | $${blocked.reduce((s, c) => s + c.api_cost, 0).toFixed(2)} | ${blocked.reduce((s, c) => s + c.time_saved_hours, 0).toFixed(1)}h | $${blocked.reduce((s, c) => s + c.net_roi, 0).toFixed(2)} |

## Top 10 Workflows by Net ROI

| Workflow | API Cost | Time Saved | Net ROI | ROI Ratio |
|----------|----------|------------|---------|-----------|
${costs
            .sort((a, b) => b.net_roi - a.net_roi)
            .slice(0, 10)
            .map((c) => `| ${c.workflow_name} | $${c.api_cost.toFixed(4)} | ${c.time_saved_hours.toFixed(1)}h | $${c.net_roi.toFixed(2)} | ${c.roi_ratio.toFixed(2)}x |`)
            .join("\n")}

## Conclusion
${totalNetROI > 0
            ? `Autonomous workflows are delivering positive ROI of $${totalNetROI.toFixed(2)} over ${args.time_range}.`
            : `Workflows are currently not cost-effective. Consider optimizing or reducing automation.`}
`;
        return {
            content: [
                {
                    type: "text",
                    text: report,
                },
            ],
        };
    }
    catch (error) {
        throw new Error(`Failed to generate ROI report: ${error.message}`);
    }
}
/**
 * Get cost breakdown
 */
export async function getCostBreakdown(args, workspacePath) {
    try {
        const { start, end } = getDateRange(args.time_range);
        const costs = loadWorkflowCosts(workspacePath, { startDate: start, endDate: end });
        if (costs.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "No workflow cost data found for the specified time range.",
                    },
                ],
            };
        }
        // Group by workflow name
        const byWorkflow = new Map();
        costs.forEach((c) => {
            if (!byWorkflow.has(c.workflow_name)) {
                byWorkflow.set(c.workflow_name, []);
            }
            byWorkflow.get(c.workflow_name).push(c);
        });
        // Calculate workflow statistics
        const workflowStats = Array.from(byWorkflow.entries()).map(([name, wfCosts]) => {
            const totalCost = wfCosts.reduce((s, c) => s + c.api_cost, 0);
            const totalROI = wfCosts.reduce((s, c) => s + c.net_roi, 0);
            const avgROIRatio = wfCosts.reduce((s, c) => s + c.roi_ratio, 0) / wfCosts.length;
            const successRate = wfCosts.filter((c) => c.outcome === "completed").length / wfCosts.length;
            return {
                name,
                count: wfCosts.length,
                total_cost: totalCost,
                total_roi: totalROI,
                avg_roi_ratio: avgROIRatio,
                success_rate: successRate,
            };
        });
        // Sort by different criteria
        const mostExpensive = [...workflowStats].sort((a, b) => b.total_cost - a.total_cost).slice(0, 5);
        const highestROI = [...workflowStats].sort((a, b) => b.total_roi - a.total_roi).slice(0, 5);
        const lowestROI = [...workflowStats].sort((a, b) => a.total_roi - b.total_roi).slice(0, 5);
        // Breakdown by outcome
        const successfulCosts = costs.filter((c) => c.outcome === "completed");
        const failedCosts = costs.filter((c) => c.outcome === "failed");
        const blockedCosts = costs.filter((c) => c.outcome === "blocked");
        const report = `# Cost Breakdown Analysis (${args.time_range})

## Most Expensive Workflows

| Workflow | Executions | Total API Cost | Avg Cost/Run | Success Rate |
|----------|-----------|----------------|--------------|--------------|
${mostExpensive
            .map((w) => `| ${w.name} | ${w.count} | $${w.total_cost.toFixed(2)} | $${(w.total_cost / w.count).toFixed(4)} | ${(w.success_rate * 100).toFixed(0)}% |`)
            .join("\n")}

## Highest ROI Workflows

| Workflow | Executions | Net ROI | Avg ROI Ratio | Recommendation |
|----------|-----------|---------|---------------|----------------|
${highestROI
            .map((w) => `| ${w.name} | ${w.count} | $${w.total_roi.toFixed(2)} | ${w.avg_roi_ratio.toFixed(2)}x | Scale up |`)
            .join("\n")}

## Lowest ROI Workflows (Need Optimization)

| Workflow | Executions | Net ROI | Avg ROI Ratio | Recommendation |
|----------|-----------|---------|---------------|----------------|
${lowestROI
            .map((w) => `| ${w.name} | ${w.count} | $${w.total_roi.toFixed(2)} | ${w.avg_roi_ratio.toFixed(2)}x | ${w.total_roi < 0 ? "Optimize or disable" : "Monitor"} |`)
            .join("\n")}

## Cost Breakdown by Outcome

| Outcome | Workflows | API Cost | Wasted Cost |
|---------|-----------|----------|-------------|
| Successful | ${successfulCosts.length} | $${successfulCosts.reduce((s, c) => s + c.api_cost, 0).toFixed(2)} | N/A |
| Failed | ${failedCosts.length} | $${failedCosts.reduce((s, c) => s + c.api_cost, 0).toFixed(2)} | $${failedCosts.reduce((s, c) => s + c.api_cost, 0).toFixed(2)} |
| Blocked | ${blockedCosts.length} | $${blockedCosts.reduce((s, c) => s + c.api_cost, 0).toFixed(2)} | $${blockedCosts.reduce((s, c) => s + c.api_cost, 0).toFixed(2)} |

## Recommendations

1. **Scale Up**: Focus on high-ROI workflows (${highestROI[0]?.name || "N/A"})
2. **Optimize**: Improve success rate for expensive workflows
3. **Review**: ${lowestROI.filter((w) => w.total_roi < 0).length} workflows have negative ROI
4. **Wasted Cost**: $${(failedCosts.reduce((s, c) => s + c.api_cost, 0) + blockedCosts.reduce((s, c) => s + c.api_cost, 0)).toFixed(2)} spent on failed/blocked workflows
`;
        return {
            content: [
                {
                    type: "text",
                    text: report,
                },
            ],
        };
    }
    catch (error) {
        throw new Error(`Failed to generate cost breakdown: ${error.message}`);
    }
}
/**
 * Create ROI dashboard
 */
export async function createROIDashboard(args, workspacePath) {
    try {
        // Current month
        const { start, end } = getDateRange("month");
        const currentMonth = loadWorkflowCosts(workspacePath, { startDate: start, endDate: end });
        const currentTotal = {
            api_cost: currentMonth.reduce((s, c) => s + c.api_cost, 0),
            time_saved: currentMonth.reduce((s, c) => s + c.time_saved_hours, 0),
            human_cost_saved: currentMonth.reduce((s, c) => s + c.human_cost_saved, 0),
            net_roi: currentMonth.reduce((s, c) => s + c.net_roi, 0),
            count: currentMonth.length,
        };
        // Previous month (if comparing)
        let previousTotal = null;
        let trend = "";
        if (args.compare_to_previous) {
            const previousStart = new Date();
            previousStart.setMonth(previousStart.getMonth() - 2);
            const previousEnd = new Date();
            previousEnd.setMonth(previousEnd.getMonth() - 1);
            const previousMonth = loadWorkflowCosts(workspacePath, {
                startDate: previousStart,
                endDate: previousEnd,
                workflowName: undefined,
            });
            previousTotal = {
                api_cost: previousMonth.reduce((s, c) => s + c.api_cost, 0),
                net_roi: previousMonth.reduce((s, c) => s + c.net_roi, 0),
            };
            const roiChange = previousTotal.net_roi > 0
                ? ((currentTotal.net_roi - previousTotal.net_roi) / previousTotal.net_roi) * 100
                : 0;
            trend = roiChange > 0 ? `UP ${roiChange.toFixed(1)}%` : `DOWN ${Math.abs(roiChange).toFixed(1)}%`;
        }
        // Top 5 highest value and most expensive
        const topValue = [...currentMonth]
            .sort((a, b) => b.net_roi - a.net_roi)
            .slice(0, 5);
        const topExpensive = [...currentMonth]
            .sort((a, b) => b.api_cost - a.api_cost)
            .slice(0, 5);
        const dashboard = `# ROI Dashboard - ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}

## This Month Summary

| Metric | Value |
|--------|-------|
| Total Workflows | ${currentTotal.count} |
| API Costs | $${currentTotal.api_cost.toFixed(2)} |
| Time Saved | ${currentTotal.time_saved.toFixed(1)} hours |
| Human Cost Saved | $${currentTotal.human_cost_saved.toFixed(2)} |
| **Net Value** | **$${currentTotal.net_roi.toFixed(2)}** |

${args.compare_to_previous && previousTotal ? `
## Trend vs Previous Month

| Metric | Current | Previous | Change |
|--------|---------|----------|--------|
| API Cost | $${currentTotal.api_cost.toFixed(2)} | $${previousTotal.api_cost.toFixed(2)} | ${((currentTotal.api_cost - previousTotal.api_cost) / previousTotal.api_cost * 100).toFixed(1)}% |
| Net ROI | $${currentTotal.net_roi.toFixed(2)} | $${previousTotal.net_roi.toFixed(2)} | ${trend} |

### ROI Trend: ${trend.startsWith("UP") ? "IMPROVING" : "DECLINING"}
` : ""}

## Top 5 Highest Value Workflows

| Workflow | Net ROI | ROI Ratio | Time Saved |
|----------|---------|-----------|------------|
${topValue.map((c) => `| ${c.workflow_name} | $${c.net_roi.toFixed(2)} | ${c.roi_ratio.toFixed(2)}x | ${c.time_saved_hours.toFixed(1)}h |`).join("\n")}

## Top 5 Most Expensive Workflows

| Workflow | API Cost | Outcome | ROI Ratio |
|----------|----------|---------|-----------|
${topExpensive.map((c) => `| ${c.workflow_name} | $${c.api_cost.toFixed(4)} | ${c.outcome} | ${c.roi_ratio.toFixed(2)}x |`).join("\n")}

---
**Last Updated**: ${new Date().toLocaleString()}
`;
        return {
            content: [
                {
                    type: "text",
                    text: dashboard,
                },
            ],
        };
    }
    catch (error) {
        throw new Error(`Failed to create ROI dashboard: ${error.message}`);
    }
}
//# sourceMappingURL=cost-tracking.js.map