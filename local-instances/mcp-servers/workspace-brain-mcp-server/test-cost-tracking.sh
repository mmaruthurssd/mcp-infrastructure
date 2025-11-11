#!/bin/bash
# Test script for cost tracking functionality

WORKSPACE_BRAIN_DIR="$HOME/workspace-brain"

echo "=== Testing Cost Tracking & ROI System ==="
echo ""

# Create test workflow cost data
echo "Creating test workflow cost data..."

# Create directory structure
mkdir -p "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows"
mkdir -p "$WORKSPACE_BRAIN_DIR/cost-tracking/monthly-summaries"

# Generate sample workflow cost records
cat > "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows/patient-data-migration-2025-01-15.json" << 'EOF'
{
  "id": "test-001",
  "workflow_name": "patient-data-migration",
  "timestamp": "2025-01-15T10:30:00Z",
  "api_tokens": {
    "input": 15000,
    "output": 8000
  },
  "time_saved_hours": 4.5,
  "outcome": "completed",
  "api_cost": 0.825,
  "human_cost_saved": 225.0,
  "net_roi": 224.175,
  "roi_ratio": 272.73,
  "metadata": {
    "mcp_used": "task-executor-mcp",
    "complexity": 7
  }
}
EOF

cat > "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows/hipaa-compliance-check-2025-01-16.json" << 'EOF'
{
  "id": "test-002",
  "workflow_name": "hipaa-compliance-check",
  "timestamp": "2025-01-16T14:20:00Z",
  "api_tokens": {
    "input": 8000,
    "output": 3000
  },
  "time_saved_hours": 2.0,
  "outcome": "completed",
  "api_cost": 0.345,
  "human_cost_saved": 100.0,
  "net_roi": 99.655,
  "roi_ratio": 289.86,
  "metadata": {
    "mcp_used": "security-compliance-mcp",
    "complexity": 5
  }
}
EOF

cat > "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows/appointment-sync-2025-01-17.json" << 'EOF'
{
  "id": "test-003",
  "workflow_name": "appointment-sync",
  "timestamp": "2025-01-17T09:00:00Z",
  "api_tokens": {
    "input": 5000,
    "output": 2000
  },
  "time_saved_hours": 1.5,
  "outcome": "completed",
  "api_cost": 0.225,
  "human_cost_saved": 75.0,
  "net_roi": 74.775,
  "roi_ratio": 333.33,
  "metadata": {
    "mcp_used": "google-sheets-integration",
    "complexity": 3
  }
}
EOF

cat > "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows/patient-data-migration-2025-01-18.json" << 'EOF'
{
  "id": "test-004",
  "workflow_name": "patient-data-migration",
  "timestamp": "2025-01-18T11:45:00Z",
  "api_tokens": {
    "input": 18000,
    "output": 10000
  },
  "time_saved_hours": 5.0,
  "outcome": "completed",
  "api_cost": 1.02,
  "human_cost_saved": 250.0,
  "net_roi": 248.98,
  "roi_ratio": 245.1,
  "metadata": {
    "mcp_used": "task-executor-mcp",
    "complexity": 8
  }
}
EOF

cat > "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows/report-generation-2025-01-19.json" << 'EOF'
{
  "id": "test-005",
  "workflow_name": "report-generation",
  "timestamp": "2025-01-19T16:30:00Z",
  "api_tokens": {
    "input": 12000,
    "output": 6000
  },
  "time_saved_hours": 3.0,
  "outcome": "completed",
  "api_cost": 0.63,
  "human_cost_saved": 150.0,
  "net_roi": 149.37,
  "roi_ratio": 238.1,
  "metadata": {
    "mcp_used": "project-management-mcp",
    "complexity": 6
  }
}
EOF

cat > "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows/backup-validation-2025-01-20.json" << 'EOF'
{
  "id": "test-006",
  "workflow_name": "backup-validation",
  "timestamp": "2025-01-20T08:15:00Z",
  "api_tokens": {
    "input": 3000,
    "output": 1000
  },
  "time_saved_hours": 0.5,
  "outcome": "completed",
  "api_cost": 0.12,
  "human_cost_saved": 25.0,
  "net_roi": 24.88,
  "roi_ratio": 208.33,
  "metadata": {
    "mcp_used": "backup-dr-mcp",
    "complexity": 2
  }
}
EOF

cat > "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows/code-review-2025-01-21.json" << 'EOF'
{
  "id": "test-007",
  "workflow_name": "code-review",
  "timestamp": "2025-01-21T13:00:00Z",
  "api_tokens": {
    "input": 20000,
    "output": 5000
  },
  "time_saved_hours": 2.5,
  "outcome": "failed",
  "api_cost": 0.675,
  "human_cost_saved": 125.0,
  "net_roi": 124.325,
  "roi_ratio": 185.19,
  "metadata": {
    "mcp_used": "code-review-mcp",
    "complexity": 7,
    "failure_reason": "Linting errors"
  }
}
EOF

cat > "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows/deployment-rollback-2025-01-22.json" << 'EOF'
{
  "id": "test-008",
  "workflow_name": "deployment-rollback",
  "timestamp": "2025-01-22T17:45:00Z",
  "api_tokens": {
    "input": 10000,
    "output": 8000
  },
  "time_saved_hours": 1.0,
  "outcome": "blocked",
  "api_cost": 0.75,
  "human_cost_saved": 50.0,
  "net_roi": 49.25,
  "roi_ratio": 66.67,
  "metadata": {
    "mcp_used": "deployment-release-mcp",
    "complexity": 6,
    "blocked_reason": "Dependency conflict"
  }
}
EOF

echo "Created 8 test workflow cost records"
echo ""

# Calculate monthly summary
cat > "$WORKSPACE_BRAIN_DIR/cost-tracking/monthly-summaries/2025-01.json" << 'EOF'
{
  "year_month": "2025-01",
  "total_workflows": 8,
  "total_api_cost": 4.585,
  "total_time_saved": 20.0,
  "total_human_cost_saved": 1000.0,
  "total_net_roi": 995.415,
  "avg_roi_ratio": 229.04,
  "updated_at": "2025-01-22T18:00:00Z"
}
EOF

echo "Created monthly summary for 2025-01"
echo ""

echo "=== Test Data Created Successfully ==="
echo ""
echo "Storage location: $WORKSPACE_BRAIN_DIR/cost-tracking/"
echo ""
echo "Summary:"
echo "- 8 workflow cost records"
echo "- Total API Cost: \$4.59"
echo "- Total Time Saved: 20.0 hours"
echo "- Total Human Cost Saved: \$1,000.00"
echo "- Net ROI: \$995.42"
echo "- Average ROI Ratio: 229.04x"
echo ""
echo "Test data is ready for ROI report generation!"
