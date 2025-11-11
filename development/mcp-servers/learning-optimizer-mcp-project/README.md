# Learning Optimizer MCP Project

**Status:** Active Development
**Category:** Supporting MCP
**Priority:** Low

## Overview

Domain-agnostic troubleshooting optimization MCP server that learns from issues and prevents technical debt. Tracks issues, detects duplicates, optimizes knowledge bases, and promotes high-impact issues to preventive checks.

## Project Structure

This project follows the 8-folder standardized structure:

- `01-planning/` - Project planning and requirements
- `02-goals-and-roadmap/` - Goals, milestones, and roadmap
- `03-system-architecture/` - Architecture documentation
- `04-product-under-development/` - Source code (staging and production)
- `05-documentation/` - User guides and API docs
- `06-testing-and-quality/` - Tests and quality assurance
- `07-deployment-and-operations/` - Deployment scripts and ops docs
- `08-retrospectives-and-learnings/` - Post-mortems and learnings

## Quick Start

**Development (Staging):**
```bash
cd development/mcp-servers/learning-optimizer-mcp-project/04-product-under-development/staging/
npm install
npm run build
npm test
```

**Production Deployment:**
```bash
# Source is in local-instances/mcp-servers/learning-optimizer-mcp-server/
# Registered in ~/.claude.json
```

## Key Features

- Issue tracking with frequency counts
- Duplicate detection with similarity scoring
- Knowledge base optimization
- Promotion to preventive checks
- Domain-specific configuration
- Human review workflow for promotions

## Tools (11)

1. `track_issue` - Track/update issue with auto-duplicate detection
2. `check_optimization_triggers` - Check if optimization needed
3. `optimize_knowledge_base` - Execute full optimization
4. `get_domain_stats` - Get domain statistics
5. `list_domains` - List all configured domains
6. `get_issues` - Get all tracked issues for domain
7. `detect_duplicates` - Detect duplicate issues
8. `categorize_issues` - Categorize issues by keywords
9. `get_prevention_metrics` - Get prevention success rates
10. `get_promotion_candidates` - Get issues pending review
11. `review_promotion` - Approve/reject/defer promotion

## Configuration

Configuration stored in: `local-instances/mcp-servers/learning-optimizer-mcp-server/configs/`

Domains configured: mcp-installation, google-sheets, etc.

## Template

Drop-in template available at:
`templates-and-patterns/mcp-server-templates/learning-optimizer-mcp-template/`

## Links

- Template: [learning-optimizer-mcp-template](../../templates-and-patterns/mcp-server-templates/templates/learning-optimizer-mcp-server-template/)
- MCP Development Standard: [MCP-DEVELOPMENT-STANDARD.md](../../templates-and-patterns/MCP-DEVELOPMENT-STANDARD.md)
