# PROJECT OVERVIEW MCP Tools Documentation

## Overview

The PROJECT OVERVIEW tools provide a conversational interface for creating and managing PROJECT OVERVIEW documents in the hierarchical planning framework v1.0.0. These tools use guided conversations, intelligent extraction, and cascade detection to help users establish the foundation for their projects.

## Table of Contents

1. [Tool Inventory](#tool-inventory)
2. [Tool Usage](#tool-usage)
3. [Workflow Examples](#workflow-examples)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)
6. [Technical Details](#technical-details)

---

## Tool Inventory

### 1. `create_project_overview`

**Purpose:** Start a guided conversation to create a comprehensive PROJECT OVERVIEW document.

**Input:**
- `projectPath` (string, required): Absolute path to the project directory
- `initialDescription` (string, optional): Optional initial description to seed the conversation

**Output:**
```typescript
{
  success: boolean;
  conversationId: string;
  question: string;
  phase: string;
  progress: { current: number; total: number };
}
```

**Features:**
- Progressive disclosure (12 questions across 5 phases)
- Intelligent follow-up questions based on responses
- Progress tracking throughout conversation
- Automatic information extraction

---

### 2. `continue_project_overview_conversation`

**Purpose:** Continue the PROJECT OVERVIEW guided conversation with user responses.

**Input:**
- `projectPath` (string, required): Absolute path to the project directory
- `conversationId` (string, required): Conversation ID from `create_project_overview`
- `userResponse` (string, required): User's answer to the previous question

**Output:**
```typescript
{
  success: boolean;
  question?: string;
  phase: string;
  progress: { current: number; total: number };
  complete: boolean;
  summary?: string;
}
```

**Features:**
- Information extraction from natural language
- Context-aware follow-up questions
- Summary generation when complete
- Phase-based organization

---

### 3. `finalize_project_overview`

**Purpose:** Generate and save the PROJECT OVERVIEW document from conversation data.

**Input:**
- `projectPath` (string, required): Absolute path to the project directory
- `conversationId` (string, required): Conversation ID from `create_project_overview`
- `confirm` (boolean, default: true): Confirm generation

**Output:**
```typescript
{
  success: boolean;
  filePath?: string;
  validationResult?: any;
  error?: string;
}
```

**Features:**
- Zod schema validation
- Markdown generation with YAML frontmatter
- Version tracking (v1 initially)
- Automatic directory creation

---

### 4. `update_project_overview`

**Purpose:** Update existing PROJECT OVERVIEW with cascade detection and version control.

**Input:**
- `projectPath` (string, required): Absolute path to the project directory
- `updates` (object, required): Fields to update
- `incrementVersion` (boolean, default: true): Increment version number
- `changeDescription` (string, optional): Description of changes made
- `dryRun` (boolean, default: false): Preview changes without applying them

**Output:**
```typescript
{
  success: boolean;
  cascadeImpacts?: ChangeImpact[];
  updatedFilePath?: string;
  versionInfo?: VersionInfo;
  warnings?: string[];
  error?: string;
}
```

**Features:**
- Cascade impact analysis
- Version control (auto-increment)
- Dry run mode
- Automatic backup and rollback
- Validation with Zod schemas

---

### 5. `identify_components_from_overview`

**Purpose:** Analyze PROJECT OVERVIEW and suggest logical components.

**Input:**
- `projectPath` (string, required): Absolute path to the project directory
- `useAI` (boolean, default: false): Use AI-based analysis (future feature)

**Output:**
```typescript
{
  success: boolean;
  suggestedComponents: SuggestedComponent[];
  reasoning: string;
}
```

**Features:**
- Pattern-based component identification
- Confidence scoring (high/medium/low)
- Multiple analysis strategies:
  - Functional areas from goals
  - Stakeholder-based components
  - Technology-based components
  - Project type defaults
- Deduplication and merging

---

## Tool Usage

### Creating a New PROJECT OVERVIEW

#### Step 1: Start Conversation

```typescript
const result = await mcp.callTool('create_project_overview', {
  projectPath: '/path/to/my-project',
  initialDescription: 'A medical practice management system'
});

console.log(result.question);
// "What's the name of your project?"
console.log(`Phase: ${result.phase}, Progress: ${result.progress.current}/${result.progress.total}`);
// Phase: essentials, Progress: 0/12
```

#### Step 2: Continue Conversation

```typescript
const continueResult = await mcp.callTool('continue_project_overview_conversation', {
  projectPath: '/path/to/my-project',
  conversationId: result.conversationId,
  userResponse: 'MediCare Pro'
});

if (continueResult.complete) {
  console.log('Conversation complete!');
  console.log(continueResult.summary);
} else {
  console.log(continueResult.question);
  // Next question in the flow
}
```

#### Step 3: Finalize

```typescript
const finalizeResult = await mcp.callTool('finalize_project_overview', {
  projectPath: '/path/to/my-project',
  conversationId: result.conversationId,
  confirm: true
});

if (finalizeResult.success) {
  console.log(`PROJECT OVERVIEW created at: ${finalizeResult.filePath}`);
}
```

---

### Updating an Existing PROJECT OVERVIEW

#### Dry Run (Preview Changes)

```typescript
const dryRunResult = await mcp.callTool('update_project_overview', {
  projectPath: '/path/to/my-project',
  updates: {
    timeline: '6 months instead of 12 months',
    keyOutcomes: [
      'Launch MVP in 3 months',
      'Achieve 100 active users',
      'Establish data security compliance'
    ]
  },
  changeDescription: 'Reduced timeline and updated outcomes',
  dryRun: true
});

console.log('Cascade Impacts:', dryRunResult.cascadeImpacts);
console.log('Warnings:', dryRunResult.warnings);
```

#### Apply Update

```typescript
const updateResult = await mcp.callTool('update_project_overview', {
  projectPath: '/path/to/my-project',
  updates: {
    timeline: '6 months instead of 12 months',
    keyOutcomes: [
      'Launch MVP in 3 months',
      'Achieve 100 active users',
      'Establish data security compliance'
    ]
  },
  changeDescription: 'Reduced timeline and updated outcomes',
  incrementVersion: true,
  dryRun: false
});

if (updateResult.success) {
  console.log(`Updated to version: ${updateResult.versionInfo.version}`);
  console.log(`Cascade impacts: ${updateResult.cascadeImpacts.length} components affected`);
}
```

---

### Identifying Components

```typescript
const componentsResult = await mcp.callTool('identify_components_from_overview', {
  projectPath: '/path/to/my-project'
});

console.log(componentsResult.reasoning);

for (const component of componentsResult.suggestedComponents) {
  console.log(`\n${component.name} (${component.confidence} confidence)`);
  console.log(`  Description: ${component.description}`);
  console.log(`  Reasoning: ${component.reasoning}`);

  if (component.suggestedGoals && component.suggestedGoals.length > 0) {
    console.log('  Suggested Goals:');
    component.suggestedGoals.forEach(goal => console.log(`    - ${goal}`));
  }
}
```

---

## Workflow Examples

### Example 1: Software Project

```typescript
// Start conversation
const conv = await mcp.callTool('create_project_overview', {
  projectPath: '/projects/web-analytics-tool',
  initialDescription: 'Build a real-time web analytics dashboard'
});

// Answer questions (abbreviated)
await mcp.callTool('continue_project_overview_conversation', {
  projectPath: '/projects/web-analytics-tool',
  conversationId: conv.conversationId,
  userResponse: 'WebInsight Analytics'
});

await mcp.callTool('continue_project_overview_conversation', {
  projectPath: '/projects/web-analytics-tool',
  conversationId: conv.conversationId,
  userResponse: 'software'
});

// ... continue through all questions ...

// Finalize
await mcp.callTool('finalize_project_overview', {
  projectPath: '/projects/web-analytics-tool',
  conversationId: conv.conversationId,
  confirm: true
});

// Identify components
const components = await mcp.callTool('identify_components_from_overview', {
  projectPath: '/projects/web-analytics-tool'
});

// Expected components:
// - Engineering (high confidence - from goals/outcomes)
// - Frontend Application (medium confidence - from technologies)
// - Backend Services (medium confidence - from technologies)
// - Data & Analytics (high confidence - from project purpose)
```

---

### Example 2: Research Project

```typescript
// Start conversation for research project
const conv = await mcp.callTool('create_project_overview', {
  projectPath: '/projects/ai-bias-study',
  initialDescription: 'Study bias in large language models'
});

// Answer questions
await mcp.callTool('continue_project_overview_conversation', {
  projectPath: '/projects/ai-bias-study',
  conversationId: conv.conversationId,
  userResponse: 'AI Bias Research Initiative'
});

await mcp.callTool('continue_project_overview_conversation', {
  projectPath: '/projects/ai-bias-study',
  conversationId: conv.conversationId,
  userResponse: 'research'
});

// ... continue ...

// Identify components
const components = await mcp.callTool('identify_components_from_overview', {
  projectPath: '/projects/ai-bias-study'
});

// Expected components:
// - Research (low confidence - project type default)
// - Data Collection (low confidence - project type default)
// - Data & Analytics (high confidence - if mentioned in goals)
```

---

### Example 3: Update Timeline with Cascade Detection

```typescript
// Update timeline constraint
const result = await mcp.callTool('update_project_overview', {
  projectPath: '/projects/mobile-app',
  updates: {
    timeline: 'Changed from 12 months to 8 months due to funding constraints'
  },
  changeDescription: 'Compressed timeline due to funding',
  dryRun: false
});

// Check cascade impacts
if (result.cascadeImpacts && result.cascadeImpacts.length > 0) {
  console.log('⚠️  The following components may be affected:');

  for (const impact of result.cascadeImpacts) {
    console.log(`\n${impact.entityType}: ${impact.entityName}`);
    console.log(`  Change Type: ${impact.changeType}`);
    console.log(`  Affected Children: ${impact.impactedChildren.length}`);
    console.log(`  Requires Review: ${impact.requiresReview ? 'Yes' : 'No'}`);
  }
}
```

---

## Error Handling

### Common Errors and Solutions

#### 1. PROJECT OVERVIEW Not Found

**Error:**
```
PROJECT OVERVIEW does not exist at /path/01-planning/PROJECT-OVERVIEW.md
```

**Solution:**
- Ensure you've created a PROJECT OVERVIEW first using `create_project_overview`
- Verify the `projectPath` is correct

---

#### 2. Validation Failure

**Error:**
```json
{
  "success": false,
  "error": "Updated PROJECT OVERVIEW failed validation",
  "warnings": [
    "Project name is required",
    "Vision statement is too short"
  ]
}
```

**Solution:**
- Review validation warnings
- Provide required fields
- Ensure field formats are correct
- Changes are automatically rolled back

---

#### 3. Cascade Update Blocked

**Error:**
```json
{
  "success": false,
  "error": "Cascade update has blocking issues",
  "warnings": [
    "Structural change to project-001 may break existing references"
  ]
}
```

**Solution:**
- Review blocking issues carefully
- Use `dryRun: true` to preview impacts
- Consider making smaller, incremental changes
- Manually review affected components

---

#### 4. Invalid Update Structure

**Error:**
```
goals must be an array
```

**Solution:**
```typescript
// ❌ Wrong
updates: { goals: 'Launch product' }

// ✅ Correct
updates: { goals: ['Launch product', 'Acquire users'] }
```

---

## Best Practices

### 1. Use Progressive Disclosure

The conversation is designed to ask minimum questions. Trust the extraction logic to infer details:

```typescript
// ✅ Good: Concise answers
userResponse: 'React, Node.js, PostgreSQL'

// ❌ Over-detailed: Unnecessary
userResponse: 'We will be using React for the frontend, Node.js for the backend...'
```

---

### 2. Always Use Dry Run for Significant Updates

```typescript
// Step 1: Preview with dry run
const preview = await mcp.callTool('update_project_overview', {
  projectPath: '/path/to/project',
  updates: { visionStatement: 'New vision...' },
  dryRun: true
});

// Step 2: Review impacts
console.log(preview.cascadeImpacts);

// Step 3: Apply if safe
if (preview.cascadeImpacts.length === 0) {
  await mcp.callTool('update_project_overview', {
    projectPath: '/path/to/project',
    updates: { visionStatement: 'New vision...' },
    dryRun: false
  });
}
```

---

### 3. Provide Change Descriptions

```typescript
// ✅ Good: Clear description
changeDescription: 'Reduced timeline from 12 to 8 months due to funding constraints'

// ❌ Poor: Vague description
changeDescription: 'Updated'
```

---

### 4. Review Component Suggestions

Don't blindly accept all suggested components. Filter by confidence:

```typescript
const components = await mcp.callTool('identify_components_from_overview', {
  projectPath: '/path/to/project'
});

// Focus on high confidence components
const highConfidence = components.suggestedComponents
  .filter(c => c.confidence === 'high');

console.log(`High confidence components (${highConfidence.length}):`, highConfidence);
```

---

### 5. Validate Before Finalizing

Always confirm the summary before finalizing:

```typescript
const continueResult = await mcp.callTool('continue_project_overview_conversation', {
  projectPath: '/path/to/project',
  conversationId: conv.conversationId,
  userResponse: lastAnswer
});

if (continueResult.complete) {
  // Review summary
  console.log(continueResult.summary);

  // Confirm with user before finalizing
  if (userConfirms) {
    await mcp.callTool('finalize_project_overview', {
      projectPath: '/path/to/project',
      conversationId: conv.conversationId,
      confirm: true
    });
  }
}
```

---

## Technical Details

### Question Flow Design

The conversation uses progressive disclosure across 5 phases:

1. **Essentials (3 questions):**
   - Project name
   - Project type
   - Primary purpose

2. **Vision (3 questions):**
   - Vision statement
   - Key outcomes
   - Target audience

3. **Stakeholders (2 questions):**
   - Key stakeholders
   - Stakeholder concerns

4. **Resources (2 questions):**
   - Team and resources
   - Tools and technologies

5. **Constraints (2 questions):**
   - Timeline
   - Constraints (budget, technical, regulatory)

**Total: 12 questions**

---

### Information Extraction Techniques

The extraction logic uses:

1. **Pattern Matching:** Regex patterns for structured data
2. **List Detection:** Handles bullets, numbers, commas, "and" separators
3. **Keyword Analysis:** Identifies tools vs. technologies
4. **Role Inference:** Infers stakeholder influence/interest from role
5. **Constraint Categorization:** Classifies constraints by type

---

### Cascade Detection Logic

When updating PROJECT OVERVIEW, the system checks:

1. **Scope Changes:** Components added/removed
2. **Timeline Changes:** Timeline constraints modified
3. **Resource Changes:** Team, tools, technologies changed
4. **Budget Changes:** Budget constraints modified
5. **Dependency Changes:** Dependencies altered

Each change generates a `ChangeImpact`:
```typescript
{
  entityType: 'project' | 'component' | 'major-goal';
  entityId: string;
  entityName: string;
  changeType: 'scope' | 'timeline' | 'resources' | 'constraints' | 'structure';
  impactedChildren: string[];
  requiresReview: boolean;
  autoUpdateable: boolean;
}
```

---

### Backup and Rollback

The `update_project_overview` tool uses automatic backup/rollback:

1. **Before Update:** Creates `.PROJECT-OVERVIEW.backup.md`
2. **On Success:** Deletes backup
3. **On Failure:** Restores from backup, then deletes it
4. **On Exception:** Restores from backup, preserves backup for manual recovery

---

### Component Identification Patterns

The component identification uses 4 strategies:

1. **Functional Areas:**
   - Keywords: marketing, sales, develop, build, design, ux, compliance, legal, hire, team, data, analytics
   - Confidence: 2+ keywords = high, 1 keyword = medium

2. **Stakeholder Roles:**
   - Analyzes stakeholder role field
   - Maps to component names
   - Confidence: always high (direct mapping)

3. **Technology Stack:**
   - Backend/API: api, backend, server
   - Frontend: react, vue, frontend, web
   - Mobile: mobile, ios, android
   - Infrastructure: aws, azure, cloud, docker
   - Confidence: always medium (indirect inference)

4. **Project Type Defaults:**
   - Software: Engineering, QA
   - Research: Research, Data Collection
   - Business: Marketing, Operations
   - Product: Product Development, Manufacturing
   - Confidence: always low (generic defaults)

---

## Version History

**v1.0.0 (Current)**
- Initial implementation
- 5 MCP tools
- Cascade detection
- Component identification
- Error handling with rollback
- Comprehensive documentation

---

## Related Documentation

- [Hierarchical Data Model](../types/hierarchical-entities.ts)
- [Validation System](../validation/VALIDATION-README.md)
- [Hierarchical Utils](../utils/HIERARCHICAL-UTILS-README.md)
- [Template System](../templates/project-overview.template.ts)
- [Information Extraction](../utils/conversation-extractor.ts)

---

**Last Updated:** 2025-10-27
**Maintainer:** Project Management MCP Development Team
