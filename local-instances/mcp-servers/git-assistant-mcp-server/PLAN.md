---
type: reference
phase: stable
project: git-assistant-mcp-server
tags: [MCP, git-assistant, mcp-server]
category: mcp-servers
status: completed
priority: medium
---

# Git Assistant MCP Server - Implementation Plan

**Created:** 2025-10-11
**Status:** Planning Phase
**Purpose:** MCP server that provides intelligent version control assistance for AI-assisted development

---

## Executive Summary

The Git Assistant MCP Server will monitor development activity and provide contextual guidance for version control best practices. It will help developers (especially those new to AI-assisted coding) understand when to commit, what to commit, and how to write meaningful commit messages.

**Key Features:**
- Passive monitoring of file changes
- Intelligent commit readiness analysis
- AI-generated commit message suggestions
- Educational guidance for git workflows
- Pattern learning that adapts to your workflow
- Integration with Claude Code as a native tool

---

## Problem Statement

### Current Pain Points
1. **Inconsistent version control practices** - Developers forget to commit regularly
2. **Poor commit messages** - Messages don't describe "why" changes were made
3. **Overly large commits** - Too many changes bundled together
4. **Unclear when to commit** - No guidance on optimal commit timing
5. **New to AI coding** - Teams unfamiliar with AI-assisted development patterns

### User Story
> "As a developer using Claude Code for the first time, I want an AI assistant to remind me when it's a good time to commit and help me write meaningful commit messages, so that I maintain good version control practices without having to think about it constantly."

---

## Goals & Success Metrics

### Goals
1. ✅ Reduce forgotten commits by 80%
2. ✅ Improve commit message quality (measured by completeness and context)
3. ✅ Teach git best practices through contextual guidance
4. ✅ Seamlessly integrate into Claude Code workflow
5. ✅ Support developers at all git experience levels
6. ✅ Learn and adapt to individual developer patterns and workflows

### Success Metrics
- **Engagement:** AI suggestions accepted >60% of the time
- **Quality:** Commit messages average >50 characters with "why" context
- **Frequency:** Commits happen within 30 minutes of completing a logical unit
- **Education:** Developers report increased git confidence after 2 weeks

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│              CLAUDE CODE (Client)                        │
│  - User writes code with AI assistance                  │
│  - Calls Git Assistant tools for guidance                │
└─────────────────────────────────────────────────────────┘
                           │
                           │ MCP Protocol (stdio)
                           ↓
┌─────────────────────────────────────────────────────────┐
│         GIT ASSISTANT MCP SERVER (Node.js)              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Resources (Read-Only Data)                       │  │
│  │  - git://status              Current git status   │  │
│  │  - git://recent-commits      Last 10 commits      │  │
│  │  - git://diff-summary        Changes since commit │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Tools (Actions)                                  │  │
│  │  - check_commit_readiness    Analyze if ready    │  │
│  │  - suggest_commit_message    Generate message    │  │
│  │  - show_git_guidance         Educational tips    │  │
│  │  - analyze_commit_history    Pattern analysis    │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Core Logic                                       │  │
│  │  - Heuristics engine (when to commit)            │  │
│  │  - Message generator (analyze changes)           │  │
│  │  - Pattern learner (user preferences)            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Git commands (via child_process)
                           ↓
┌─────────────────────────────────────────────────────────┐
│              LOCAL GIT REPOSITORY                        │
│  - .git/ directory                                      │
│  - Working tree with changes                            │
└─────────────────────────────────────────────────────────┘
```

---

## MCP Server Schema

### Resources (Read-Only Data Access)

#### Resource 1: `git://status`
**Description:** Current git repository status (staged, unstaged, untracked files)

**Response Schema:**
```json
{
  "branch": "main",
  "ahead": 0,
  "behind": 0,
  "staged": [
    { "path": "src/server.ts", "status": "modified" }
  ],
  "unstaged": [
    { "path": "src/helpers.ts", "status": "modified" }
  ],
  "untracked": [
    { "path": "tests/new-test.ts", "status": "untracked" }
  ],
  "total_changes": 3,
  "is_clean": false
}
```

**Use Cases:**
- Check if there are uncommitted changes
- Show user current repository state
- Determine if commit is needed

---

#### Resource 2: `git://recent-commits`
**Description:** Last 10 commits in current branch

**Response Schema:**
```json
{
  "commits": [
    {
      "hash": "abc123",
      "author": "John Doe",
      "date": "2025-10-11T14:30:00Z",
      "message": "Add employee validation logic\n\nImplemented deduplication check and pay rate validation to prevent invalid employee records.",
      "files_changed": 3,
      "insertions": 45,
      "deletions": 12
    }
  ]
}
```

**Use Cases:**
- Learn user's commit message style
- Analyze commit frequency patterns
- Provide context for next commit message

---

#### Resource 3: `git://diff-summary`
**Description:** Summary of changes since last commit

**Response Schema:**
```json
{
  "total_files_changed": 5,
  "insertions": 127,
  "deletions": 34,
  "files": [
    {
      "path": "src/server.ts",
      "insertions": 45,
      "deletions": 10,
      "change_summary": "Added new tool handler for commit suggestions"
    },
    {
      "path": "src/helpers.ts",
      "insertions": 32,
      "deletions": 5,
      "change_summary": "Implemented heuristics for commit readiness"
    }
  ]
}
```

**Use Cases:**
- Generate commit message based on actual changes
- Determine scope of changes (small commit vs large refactor)
- Detect if changes span multiple concerns (suggest splitting)

---

### Tools (Actions)

#### Tool 1: `check_commit_readiness`
**Description:** Analyze repository state and determine if now is a good time to commit

**Parameters:**
```json
{
  "context": {
    "type": "string",
    "description": "Optional context about what user is working on",
    "required": false
  }
}
```

**Logic (Heuristics Engine):**
1. **File Count Heuristic:**
   - 1-3 files: "✅ Good commit size"
   - 4-7 files: "⚠️ Consider if changes are related"
   - 8+ files: "❌ Too many files - split into multiple commits"

2. **Line Change Heuristic:**
   - < 50 lines: "✅ Small, focused change"
   - 50-200 lines: "✅ Moderate change"
   - 200-500 lines: "⚠️ Large change - ensure it's cohesive"
   - 500+ lines: "❌ Very large - consider breaking up"

3. **Time Since Last Commit:**
   - < 15 min: "Too soon, keep working"
   - 15-60 min: "Good timing"
   - 1-4 hours: "Overdue - commit soon"
   - 4+ hours: "⚠️ Long gap - definitely commit"

4. **Logical Unit Detection:**
   - All changes in same module/feature: "✅ Cohesive"
   - Changes span multiple unrelated areas: "❌ Split into separate commits"

5. **Work Completion Signals:**
   - Test files added/updated: "✅ Good - tests included"
   - Documentation updated: "✅ Good - docs included"
   - Console.log / debug code present: "⚠️ Remove debug code first"

**Response Schema:**
```json
{
  "ready_to_commit": true,
  "confidence": 0.85,
  "recommendation": "Good time to commit - changes are focused and include tests",
  "reasons": [
    "Changes affect 3 related files",
    "Moderate size (127 lines added)",
    "Test coverage included",
    "45 minutes since last commit"
  ],
  "warnings": [
    "Consider removing console.log on line 42 of server.ts"
  ],
  "suggested_next_steps": [
    "Review changes: git diff",
    "Stage files: git add src/server.ts src/helpers.ts tests/server.test.ts",
    "Commit: git commit -m 'your message'",
    "Or use suggest_commit_message tool for AI-generated message"
  ]
}
```

---

#### Tool 2: `suggest_commit_message`
**Description:** Generate a meaningful commit message based on actual code changes

**Parameters:**
```json
{
  "include_body": {
    "type": "boolean",
    "description": "Include detailed body in commit message (not just subject)",
    "default": true
  },
  "style": {
    "type": "string",
    "enum": ["conventional", "simple", "detailed"],
    "description": "Commit message style",
    "default": "conventional"
  }
}
```

**Message Generation Logic:**

1. **Analyze git diff:**
   - Parse added/removed/modified lines
   - Identify function names, class names, imports
   - Detect patterns (new feature, bug fix, refactor, docs)

2. **Classify change type:**
   - `feat:` - New functionality added
   - `fix:` - Bug fix
   - `refactor:` - Code restructuring without behavior change
   - `docs:` - Documentation only
   - `test:` - Test additions/changes
   - `chore:` - Build, config, dependencies

3. **Generate subject line (50 chars):**
   - Start with change type
   - Describe WHAT changed (imperative mood)
   - Keep under 50 characters

4. **Generate body (optional):**
   - Explain WHY change was made
   - Provide context from diff analysis
   - List key changes if multiple concerns

5. **Learn from history:**
   - Query `git://recent-commits` resource
   - Match user's existing commit style
   - Adapt to project conventions

**Response Schema:**
```json
{
  "subject": "feat: add commit readiness analysis tool",
  "body": "Implement heuristics engine that analyzes git repository state\nand determines optimal commit timing based on:\n- File change count and scope\n- Line change magnitude\n- Time since last commit\n- Logical unit cohesion\n\nIncludes test coverage for all heuristics.",
  "full_message": "feat: add commit readiness analysis tool\n\nImplement heuristics engine that analyzes git repository state\nand determines optimal commit timing based on:\n- File change count and scope\n- Line change magnitude\n- Time since last commit\n- Logical unit cohesion\n\nIncludes test coverage for all heuristics.",
  "change_type": "feat",
  "confidence": 0.78,
  "explanation": "Detected new functionality (check_commit_readiness tool) with test coverage. Message follows conventional commit format consistent with your recent commits."
}
```

---

#### Tool 3: `show_git_guidance`
**Description:** Provide educational guidance on git workflows and best practices

**Parameters:**
```json
{
  "topic": {
    "type": "string",
    "enum": ["commit-frequency", "commit-messages", "branching", "merging", "rebasing", "general"],
    "description": "Specific topic to get guidance on",
    "default": "general"
  },
  "experience_level": {
    "type": "string",
    "enum": ["beginner", "intermediate", "advanced"],
    "description": "User's git experience level",
    "default": "beginner"
  }
}
```

**Response Schema:**
```json
{
  "topic": "commit-messages",
  "guidance": {
    "summary": "Write commit messages that explain WHY, not WHAT",
    "principles": [
      "Subject line: Imperative mood, 50 chars or less",
      "Body: Explain motivation and context (why change was needed)",
      "Reference issues/tickets when applicable",
      "Use conventional commit format for consistency"
    ],
    "good_examples": [
      "fix: prevent duplicate employee records\n\nAdded deduplication check before inserting new employees to avoid constraint violations when users accidentally submit form twice.",
      "refactor: extract validation logic to separate module\n\nValidation was duplicated across 3 tools. Extracted to reusable validators/ directory to improve maintainability and test coverage."
    ],
    "bad_examples": [
      "update code",
      "fix bug",
      "WIP",
      "changes"
    ],
    "resources": [
      "https://chris.beams.io/posts/git-commit/",
      "https://www.conventionalcommits.org/"
    ]
  }
}
```

---

#### Tool 4: `analyze_commit_history`
**Description:** Analyze user's commit patterns and provide personalized insights

**Parameters:** None

**Response Schema:**
```json
{
  "analysis_period": "Last 30 days",
  "total_commits": 47,
  "patterns": {
    "average_commit_frequency": "2.1 hours",
    "average_files_per_commit": 3.2,
    "average_lines_per_commit": 89,
    "most_common_change_types": [
      { "type": "feat", "count": 23, "percentage": 49 },
      { "type": "fix", "count": 12, "percentage": 26 },
      { "type": "refactor", "count": 8, "percentage": 17 }
    ],
    "commit_message_style": "conventional",
    "average_message_length": 62
  },
  "insights": [
    "✅ You commit frequently (every 2.1 hours) - great for incremental progress",
    "✅ Your commits are focused (avg 3.2 files) - easy to review",
    "⚠️ Consider adding more body text - 68% of commits have subject line only",
    "✅ You consistently use conventional commit format"
  ],
  "recommendations": [
    "Continue your current commit frequency",
    "Add commit message bodies to explain 'why' for complex changes",
    "Consider breaking up commits over 200 lines"
  ]
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Basic MCP server with git command execution

**Tasks:**
1. Initialize Node.js + TypeScript project
2. Install MCP SDK and dependencies
3. Set up stdio transport
4. Implement basic git command wrappers:
   - `git status --porcelain`
   - `git log --oneline -n 10`
   - `git diff --stat`
5. Implement first resource: `git://status`
6. Test with MCP Inspector
7. Configure Claude Code to load server

**Deliverables:**
- `package.json`, `tsconfig.json`
- `src/server.ts` (MCP server initialization)
- `src/git.ts` (git command wrappers)
- `tests/git.test.ts` (unit tests)
- `README.md` (setup instructions)

---

### Phase 2: Resources (Week 1-2)
**Goal:** Complete all read-only resources

**Tasks:**
1. Implement `git://recent-commits` resource
2. Implement `git://diff-summary` resource
3. Add error handling for non-git directories
4. Add caching for recent commits (1 minute TTL)
5. Write integration tests
6. Document resource schemas

**Deliverables:**
- All 3 resources functional
- Test coverage >80%
- Resource documentation in README

---

### Phase 3: Commit Readiness Tool (Week 2)
**Goal:** Implement intelligent commit readiness analysis

**Tasks:**
1. Design heuristics engine
2. Implement file count heuristic
3. Implement line change heuristic
4. Implement time-based heuristic
5. Implement logical unit detection
6. Combine heuristics into confidence score
7. Write comprehensive tests for each heuristic
8. Test with real repositories

**Deliverables:**
- `check_commit_readiness` tool functional
- Heuristics documented and tested
- User testing with 3+ developers

---

### Phase 4: Message Generator (Week 3)
**Goal:** AI-powered commit message generation

**Tasks:**
1. Implement git diff parser
2. Detect change types (feat, fix, refactor, etc.)
3. Extract meaningful context from diff
4. Generate subject line (<50 chars)
5. Generate body with WHY context
6. Learn from user's commit history
7. Support conventional commit format
8. Test message quality with sample diffs

**Deliverables:**
- `suggest_commit_message` tool functional
- Message quality >80% acceptance rate
- Support for 3 message styles

---

### Phase 5: Guidance & Analysis (Week 3-4)
**Goal:** Educational features and pattern analysis

**Tasks:**
1. Create guidance content library
2. Implement `show_git_guidance` tool
3. Implement `analyze_commit_history` tool
4. Add personalized insights
5. Add resource links for learning
6. Test with developers at different experience levels

**Deliverables:**
- Both tools functional
- Guidance content covers 6 topics
- Analysis provides actionable insights

---

### Phase 6: Polish & Deploy (Week 4)
**Goal:** Production-ready deployment

**Tasks:**
1. Add comprehensive error handling
2. Improve performance (caching, lazy loading)
3. Write end-to-end tests
4. Create user documentation
5. Add configuration options
6. Deploy to npm (optional)
7. Get user feedback and iterate

**Deliverables:**
- Production-ready MCP server
- Complete documentation
- Published to npm (optional)
- User feedback incorporated

---

### Phase 7: Pattern Learning (Week 5+)
**Goal:** Learn and adapt to individual developer workflows

**Tasks:**
1. Implement pattern detection engine
   - Analyze commit history for patterns
   - Detect file naming conventions
   - Identify project structure preferences
   - Track commit timing patterns
2. Create local preferences storage (`.git-assistant-preferences.json`)
3. Implement `learn_patterns` tool
4. Add project type detection
   - Recognize: "creating new tool/MCP server"
   - Recognize: "PLAN.md → implementation pattern"
   - Recognize: "reusable utility creation"
5. Add intelligent repository suggestions
   - "This looks reusable - create new repo?"
   - "Extract to shared library?"
   - "Initialize standard project structure?"
6. Personalized commit boundaries
   - Learn when YOU typically commit
   - Adapt heuristics to your style
   - Suggest based on YOUR patterns, not generic rules
7. Context-aware suggestions
   - "You usually commit after creating plans"
   - "You group changes by implementation phase"
   - "You prefer detailed commit messages"

**New Tool: `learn_patterns`**
```typescript
tool: learn_patterns() {
  // Analyze last 100 commits
  const patterns = {
    commit_frequency: "avg 2.3 hours",
    typical_file_count: 3.2,
    project_patterns: [
      "Creates PLAN.md before implementation",
      "Groups changes by phase (setup/implementation/testing)",
      "Creates reusable tools in separate folders"
    ],
    file_naming: [
      "Uses kebab-case for folders",
      "Uses PascalCase.md for documentation"
    ],
    repository_patterns: [
      "Initializes new repos for reusable tools",
      "Creates MCP servers in dedicated directories"
    ]
  };

  return {
    patterns_detected: patterns,
    suggestions: [
      "Continue your current commit frequency",
      "I've learned you create plans first - I'll suggest commits after plan completion",
      "When you create reusable tools, I'll ask if you want a new repo"
    ]
  };
}
```

**Enhanced Tool: `check_commit_readiness` (now pattern-aware)**
```typescript
// Before: Generic rules
if (files_changed > 5) return "Too many files";

// After: Learns YOUR patterns
if (files_changed > user_preferences.typical_file_count * 1.5) {
  return "This is larger than your typical commits (avg 3.2 files)";
}
```

**Project Type Detection Logic:**
```typescript
// Detects you're creating something reusable
if (
  new_folder_created &&
  (folder_name.includes("tool") ||
   folder_name.includes("mcp-server") ||
   folder_name.includes("utility"))
) {
  suggest({
    message: "Detected new reusable tool creation",
    actions: [
      "Initialize new git repository here?",
      "Create standard structure (README, PLAN, src/)?",
      "Add to your tools index?"
    ]
  });
}
```

**Deliverables:**
- Pattern detection engine
- Local preferences storage
- `learn_patterns` tool
- Project type detection
- Repository initialization suggestions
- Personalized heuristics
- Documentation for pattern learning features

**Success Metrics:**
- Suggestions match user intent >80% of the time
- Reduced false positives in commit timing
- User reports "it understands my workflow"

---

## Technical Stack

### Core Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "simple-git": "^3.21.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "tsx": "^4.0.0"
  }
}
```

### Why simple-git?
- Battle-tested git wrapper library
- Promise-based API
- Type-safe with TypeScript
- Handles cross-platform differences
- Active maintenance

### Alternative: Native git commands
Could use `child_process.exec` directly, but simple-git provides:
- Better error handling
- Consistent API
- Parsed responses
- Less boilerplate

---

## Configuration

### Environment Variables
```bash
# Optional: Set repository path (default: current working directory)
GIT_ASSISTANT_REPO_PATH=/path/to/repo

# Optional: Enable debug logging
GIT_ASSISTANT_DEBUG=true

# Optional: Customize heuristics
GIT_ASSISTANT_MAX_FILES=7
GIT_ASSISTANT_MAX_LINES=200
```

### Claude Code Configuration
```json
{
  "mcpServers": {
    "git-assistant": {
      "command": "node",
      "args": [
        "/path/to/git-assistant-mcp-server/dist/server.js"
      ],
      "env": {
        "GIT_ASSISTANT_REPO_PATH": "${workspaceFolder}"
      }
    }
  }
}
```

---

## Testing Strategy

### Unit Tests (Vitest)
- Test each heuristic independently
- Test git command wrappers with mocked responses
- Test message generation logic
- Target: 80%+ coverage

### Integration Tests
- Test full tool workflows
- Test with real git repository fixtures
- Test error cases (non-git directories, detached HEAD)

### User Testing
- Test with 3-5 developers of varying git experience
- Collect feedback on message quality
- Measure acceptance rate of suggestions
- Iterate based on feedback

---

## Success Criteria

### MVP (Phase 1-3 Complete)
- ✅ MCP server runs in Claude Code
- ✅ `git://status` resource works
- ✅ `check_commit_readiness` provides useful guidance
- ✅ Developers use it at least once per coding session

### V1.0 (Phases 1-6 Complete)
- ✅ All 3 resources functional
- ✅ All 4 tools functional
- ✅ >80% of suggested messages accepted
- ✅ >80% test coverage
- ✅ Documentation complete
- ✅ 5+ developers using regularly

### V2.0 (Phase 7 Complete - Pattern Learning)
- ✅ Pattern detection engine functional
- ✅ Learns user commit patterns and preferences
- ✅ Project type detection working
- ✅ Repository initialization suggestions
- ✅ Personalized heuristics adapt to user
- ✅ >80% suggestion accuracy for individual users

### Future Enhancements (Post V2.0)
- Integrate with GitHub/GitLab APIs (show PR suggestions)
- Add branch management tools
- Add merge conflict resolution guidance
- Support for git hooks integration
- Team-wide analytics dashboard
- Multi-user pattern sharing (team conventions)

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Git commands fail in non-standard repos | High | Medium | Comprehensive error handling, graceful degradation |
| MCP protocol changes | High | Low | Pin SDK version, monitor for updates |
| Performance issues with large repos | Medium | Medium | Implement caching, lazy loading |
| Cross-platform git differences | Medium | Low | Use simple-git library, test on Windows/Mac/Linux |

### User Experience Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Suggestions feel annoying/pushy | High | Medium | Make guidance optional, allow customization |
| Messages don't match user style | Medium | High | Learn from commit history, allow style selection |
| Heuristics are inaccurate | Medium | Medium | Extensive testing, user feedback loop |
| Complexity overwhelms beginners | Medium | Low | Tiered guidance by experience level |

---

## Project Timeline

**V1.0 Duration:** 4 weeks (part-time effort)
**V2.0 Duration:** +1-2 weeks (pattern learning)

### V1.0 Timeline
- **Week 1:** Foundation + Resources (Phases 1-2)
- **Week 2:** Commit Readiness Tool (Phase 3)
- **Week 3:** Message Generator + Guidance (Phases 4-5)
- **Week 4:** Polish + Deploy (Phase 6)

**V1.0 Checkpoints:**
- End of Week 1: Demo basic resources to team
- End of Week 2: User test commit readiness tool
- End of Week 3: User test message generator
- End of Week 4: Launch V1.0

### V2.0 Timeline (Pattern Learning)
- **Week 5-6:** Pattern Learning (Phase 7)

**V2.0 Checkpoints:**
- End of Week 5: Pattern detection working, can analyze history
- End of Week 6: Project type detection, personalized suggestions, Launch V2.0

---

## Open Questions

1. **Should we store user preferences?**
   - Option A: Local config file (.git-assistant-preferences.json)
   - Option B: Store in git config (git config --local)
   - Option C: No persistence, always infer from history
   - **Decision:** Use Option A for Phase 7 (pattern learning needs persistence)

2. **How aggressive should commit reminders be?**
   - Option A: Passive (only when user asks)
   - Option B: Proactive (AI suggests after detecting readiness)
   - Option C: Hybrid (passive by default, proactive opt-in)
   - **Decision:** Start with A, offer C as configuration option

3. **Should we support git hooks?**
   - Would allow automatic message suggestions on `git commit`
   - Requires installation step (more friction)
   - **Decision:** Not in MVP, consider for V1.1

4. **Multi-repo support?**
   - Single server instance for all repos?
   - Or per-repo server instances?
   - **Decision:** Single server, auto-detect repo from working directory

---

## Next Steps

1. ✅ Review and approve this plan
2. Create project structure and boilerplate
3. Begin Phase 1 implementation
4. Set up CI/CD pipeline (GitHub Actions)
5. Create tracking issues for each phase

---

**End of Implementation Plan**

*This plan will be updated as implementation progresses and requirements evolve.*
