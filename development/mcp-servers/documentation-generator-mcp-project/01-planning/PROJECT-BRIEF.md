---
type: plan
tags: [mcp-server, documentation-generator, automation, api-docs, changelog]
created: 2025-10-31
status: active
---

# Documentation Generator MCP - Project Brief

**Version:** 1.0.0
**Status:** In Development
**Category:** Intelligence Layer / Documentation Automation
**Priority:** Medium
**Estimated Delivery:** 2-3 hours

## Purpose

Automate documentation generation, maintenance, and validation across the workspace. Generate API docs from code, changelogs from git commits, track documentation coverage, and maintain searchable documentation catalogs.

## Problem Statement

**Current Pain Points:**
1. **Manual documentation updates** - Developers forget to update docs when code changes
2. **Inconsistent documentation** - No standard format across projects
3. **Missing API documentation** - Many functions/classes lack JSDoc comments
4. **No changelog automation** - Changelogs manually maintained, often incomplete
5. **Doc coverage unknown** - No visibility into what's documented vs. undocumented
6. **Scattered documentation** - Hard to find and navigate documentation

**Impact:**
- Developer time wasted on manual doc updates
- Documentation drift (code changes, docs don't)
- Onboarding friction (incomplete/outdated docs)
- Integration challenges (missing API docs)

## Solution

Build an MCP server with 6 tools to automate documentation lifecycle:

1. **generate_api_docs** - Generate markdown API docs from TypeScript/JSDoc
2. **generate_changelog** - Auto-generate changelogs from git commit history
3. **track_doc_coverage** - Scan code and calculate documentation coverage
4. **generate_diagrams** - Create Mermaid.js diagrams from code structure
5. **update_documentation** - Detect code changes and regenerate affected docs
6. **catalog_documentation** - Index all markdown files with searchable metadata

## Key Features

### API Documentation Generation
- Parse TypeScript source files with AST analysis
- Extract JSDoc comments and type information
- Generate clean markdown documentation
- Include code examples from test files
- Support for classes, functions, interfaces, types

### Changelog Automation
- Parse git commit history by date range or tag
- Categorize commits (features, fixes, breaking changes, chores)
- Generate semantic versioning-compatible changelogs
- Support conventional commit format
- Markdown output with links to commits

### Documentation Coverage Tracking
- Scan TypeScript files for exported symbols
- Identify undocumented functions/classes/interfaces
- Calculate coverage percentage (documented / total)
- Prioritize gaps by code importance (public API first)
- Generate coverage reports

### Diagram Generation
- Architecture diagrams (component relationships)
- Dependency graphs (import analysis)
- Data flow diagrams (function call chains)
- Mermaid.js format for GitHub compatibility
- Auto-update on code changes

### Documentation Updates
- Watch for git commits affecting documented code
- Regenerate affected documentation automatically
- Update timestamps and version references
- Validate internal links still work
- Flag manual review when needed

### Documentation Catalog
- Scan for all markdown files in project
- Extract YAML frontmatter metadata
- Generate searchable index
- Create navigation structure
- Track documentation health (outdated, broken links)

## Success Criteria

**Functionality:**
- ✅ All 6 tools implemented and tested
- ✅ API docs generate accurately from TypeScript/JSDoc
- ✅ Changelogs auto-generate from git commits
- ✅ Doc coverage calculated correctly
- ✅ Diagrams render properly in GitHub markdown
- ✅ Documentation auto-updates on code changes
- ✅ Doc catalog indexes all project documentation

**Quality:**
- ✅ >70% test coverage
- ✅ Zero TypeScript errors
- ✅ All quality gates passed
- ✅ Security scan clean
- ✅ Integration tests with git-assistant MCP
- ✅ Integration tests with project-index-generator MCP

**Performance:**
- ✅ API doc generation: <5 seconds for typical MCP
- ✅ Changelog generation: <3 seconds for 100 commits
- ✅ Coverage scan: <10 seconds for 10k LOC
- ✅ Diagram generation: <5 seconds per diagram

**Documentation:**
- ✅ Comprehensive README with examples
- ✅ Tool documentation with schemas
- ✅ Integration guide for other MCPs
- ✅ Troubleshooting guide

## Architecture

**Design:** Stateless MCP server (no persistent state)
**Storage:** All generated docs written to project directories
**Integration:** Works with git-assistant, project-index-generator MCPs
**Dependencies:**
- @typescript-eslint/parser (AST parsing)
- TypeScript compiler API (type extraction)
- simple-git (git operations)
- markdown-it (markdown processing)
- gray-matter (YAML frontmatter parsing)

## Timeline

**Total Estimate:** 2-3 hours with parallelization

### Planning (20 mins) - CURRENT
- [x] Create PROJECT-BRIEF.md
- [ ] Write SPECIFICATION.md
- [ ] Document DESIGN-DECISIONS.md

### Implementation (1.5 hours)
- [ ] Set up TypeScript project structure
- [ ] Implement 6 documentation tools
- [ ] Build doc templates
- [ ] Create validation utilities

### Testing (30 mins)
- [ ] Unit tests for all tools (>70% coverage)
- [ ] Integration tests with git-assistant
- [ ] Integration tests with project-index-generator
- [ ] Validate generated docs

### Rollout (20 mins)
- [ ] Quality gates with testing-validation-mcp
- [ ] Security scan with security-compliance-mcp
- [ ] Deploy to production
- [ ] Register with mcp-config-manager
- [ ] Update tracking documents

## Risks & Mitigation

**Risk 1: Generated docs may be incomplete or incorrect**
- **Mitigation:** Comprehensive validation, human review flagging
- **Fallback:** Generate templates requiring human completion

**Risk 2: JSDoc parsing complexity**
- **Mitigation:** Use battle-tested TypeScript compiler API
- **Fallback:** Simple regex-based extraction for basic cases

**Risk 3: Git commit parsing ambiguity**
- **Mitigation:** Support conventional commits, provide categorization hints
- **Fallback:** Manual commit categorization via config file

## Integration Points

**git-assistant MCP:**
- Use git commit data for changelog generation
- Detect code changes for doc regeneration
- Extract commit metadata (author, date, message)

**project-index-generator MCP:**
- Feed generated docs into project index
- Update doc catalog when new docs created
- Cross-reference with file organization

**workspace-brain MCP:**
- Log documentation generation events
- Track doc coverage metrics over time
- Identify documentation improvement opportunities

## Future Enhancements (Phase 2)

- AI-powered doc improvement suggestions
- Multi-language support (JavaScript, Python, Go)
- Interactive doc generation UI
- Doc quality scoring
- Automated doc testing (code examples actually work)
- Integration with external doc platforms (GitHub Pages, ReadTheDocs)

---

**Owner:** Workspace Team
**Stakeholders:** All developers, MCP users
**Status:** In Development
**Last Updated:** 2025-10-31
