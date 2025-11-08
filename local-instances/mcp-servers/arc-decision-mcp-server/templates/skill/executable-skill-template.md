---
name: my-executable-skill
description: A clear, complete description of what this executable skill does. Specify what automation or scripts it provides and when to use them.
---

# [Executable Skill Title]

## Purpose

[Explain what this skill automates and how it helps. Be specific about what the scripts do.]

## When to Use

This skill should be used when:
- [Specific automation scenario 1]
- [Specific automation scenario 2]
- [Specific automation scenario 3]

## Available Scripts

### Script 1: [Script Name]

**Purpose:** [What this script does]

**Usage:**
```bash
[command to run the script]
```

**Parameters:**
- `param1`: [Description]
- `param2`: [Description]

**Example:**
```bash
[concrete example of running the script]
```

**Output:**
```
[Expected output format]
```

### Script 2: [Script Name]

**Purpose:** [What this script does]

**Usage:**
```bash
[command to run the script]
```

**Example:**
```bash
[concrete example]
```

## Workflow Instructions

### Step 1: Prepare

[Instructions for preparing to use the scripts]

### Step 2: Execute

[Instructions for executing the automation]

1. [Detailed step]
2. [Detailed step]
3. [Detailed step]

### Step 3: Verify

[Instructions for verifying the automation worked correctly]

**Validation checklist:**
- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]

## Script Implementations

### Implementation: [Script 1 Name]

**Filename:** `[script-name].[ext]`

```[language]
#!/usr/bin/env [interpreter]

# [Script Name]
# Purpose: [Brief description]
# Usage: [How to use]

# [Implementation code here]
# Note: This is a template - customize for your needs

function main() {
    # [Main logic]
}

# Execute
main "$@"
```

### Implementation: [Script 2 Name]

**Filename:** `[script-name].[ext]`

```[language]
#!/usr/bin/env [interpreter]

# [Script Name]
# Purpose: [Brief description]

# [Implementation code]
```

## Error Handling

### Common Errors

**Error:** `[Error message]`
- **Cause:** [Why this error occurs]
- **Solution:** [How to fix it]

**Error:** `[Error message]`
- **Cause:** [Why this error occurs]
- **Solution:** [How to fix it]

## Best Practices

1. **[Practice 1]:** [Description and reasoning]
2. **[Practice 2]:** [Description and reasoning]
3. **[Practice 3]:** [Description and reasoning]

## Examples

### Example 1: [Use Case Name]

**Scenario:** [Describe the specific situation]

**Steps:**
1. [Preparation step]
2. Run script:
   ```bash
   [command with actual parameters]
   ```
3. [Follow-up step]

**Expected Result:**
```
[Show what should happen]
```

### Example 2: [Use Case Name]

**Scenario:** [Describe the situation]

**Complete workflow:**
```bash
# Step 1: [Description]
[command]

# Step 2: [Description]
[command]

# Step 3: [Description]
[command]
```

**Output:**
```
[Expected output]
```

## Safety Considerations

⚠️ **Important safety notes:**

- **[Safety concern 1]:** [How to mitigate]
- **[Safety concern 2]:** [How to mitigate]
- **[Safety concern 3]:** [How to mitigate]

**Always:**
- [ ] [Safety check 1]
- [ ] [Safety check 2]
- [ ] [Safety check 3]

## Maintenance

**Updating scripts:**
1. [How to modify the scripts]
2. [How to test changes]
3. [How to deploy updates]

**Dependencies:**
- [Dependency 1]: [Version or requirements]
- [Dependency 2]: [Version or requirements]

---

**Note for Skill Authors:**

This is an executable skill template that combines instructions with runnable scripts. Key characteristics:

- **Executable:** Includes scripts that Claude can run
- **Self-contained:** Scripts are included in the skill file
- **Safe:** Includes error handling and safety considerations
- **Token-efficient:** Still lightweight compared to MCP servers

**Best practices:**
1. Always include error handling in scripts
2. Make scripts idempotent (safe to run multiple times)
3. Provide clear usage examples with actual parameters
4. Include validation/verification steps
5. Document safety considerations explicitly

**When to use vs MCP Server:**
- ✅ **Use Executable Skill when:**
  - Scripts are simple and self-contained
  - No need for complex external API integration
  - No need for state persistence across sessions
  - Token efficiency is important

- 🤔 **Consider MCP Server when:**
  - Need complex external system integration
  - Need state persistence/learning
  - Scripts become complex and need proper tooling
  - Need reusability across different AI clients beyond Claude

**Security note:**
- Scripts in skills run in Claude's execution environment
- Always validate inputs and handle errors
- Be cautious with file system operations
- Never include credentials or secrets in skill files
