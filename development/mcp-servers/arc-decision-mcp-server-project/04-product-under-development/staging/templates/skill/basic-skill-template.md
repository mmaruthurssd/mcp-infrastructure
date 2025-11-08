---
name: my-skill-name
description: A clear, complete description of what this skill does and when Claude should use it. Be specific about the use cases and context where this skill applies.
---

# [Skill Title]

## Purpose

[Explain what this skill helps Claude do. Be specific about the problem it solves or the workflow it supports.]

## When to Use

This skill should be used when:
- [Specific scenario 1]
- [Specific scenario 2]
- [Specific scenario 3]

## Instructions

### Step 1: [First Step]

[Detailed instructions for the first step of the workflow]

**Example:**
```
[Provide a concrete example]
```

### Step 2: [Second Step]

[Detailed instructions for the second step]

**Example:**
```
[Provide a concrete example]
```

### Step 3: [Additional Steps]

[Continue with more steps as needed]

## Guidelines

- **[Guideline Category 1]:** [Specific guideline]
- **[Guideline Category 2]:** [Specific guideline]
- **[Guideline Category 3]:** [Specific guideline]

## Patterns to Follow

### Pattern 1: [Pattern Name]

[Description of the pattern]

**Example:**
```
[Code or text example showing the pattern]
```

### Pattern 2: [Pattern Name]

[Description of the pattern]

**Example:**
```
[Code or text example showing the pattern]
```

## Common Mistakes to Avoid

- ❌ **Don't:** [Common mistake]
  - ✅ **Do:** [Correct approach]

- ❌ **Don't:** [Common mistake]
  - ✅ **Do:** [Correct approach]

## Examples

### Example 1: [Scenario Name]

**Context:** [Describe the situation]

**Application:**
```
[Show how to apply this skill in this scenario]
```

**Result:**
```
[Show the expected outcome]
```

### Example 2: [Scenario Name]

**Context:** [Describe the situation]

**Application:**
```
[Show how to apply this skill]
```

**Result:**
```
[Show the expected outcome]
```

## Additional Resources

[Optional: Link to documentation, style guides, or other references that support this skill]

---

**Note for Skill Authors:**

This is a basic skill template for instructional/workflow skills. Key characteristics:

- **Ultra-lightweight:** Only loads when relevant to the task
- **Clear structure:** YAML frontmatter + markdown instructions
- **Portable:** Works across Claude apps, Claude Code, and API
- **Token-efficient:** Typically 300-800 tokens when loaded

**Best practices:**
1. Make the `description` in frontmatter very specific so Claude knows when to load it
2. Use concrete examples throughout - they're more valuable than abstract instructions
3. Focus on "how to do X" not "why to do X" (save AI reasoning for subagents)
4. Keep it focused on one specific workflow or pattern set
5. Update regularly based on usage patterns

**When to use other architectures:**
- Need AI behavior/persona? → Add a Subagent
- Need external system access? → Add an MCP Server
- Need both? → Consider hybrid approach
