---
type: readme
phase: stable
project: smart-file-organizer-mcp-server
tags: [MCP, mcp-server, smart-file-organizer]
category: mcp-servers
status: completed
priority: high
---

# Smart File Organizer MCP Server

Advanced MCP server for intelligent file organization with deep folder understanding, content analysis, project detection, and lifecycle management.

## Overview

The Smart File Organizer goes beyond simple pattern matching to provide:

- **Deep Folder Understanding**: Comprehensive knowledge of your entire folder structure and each folder's purpose
- **Content Analysis**: Reads and analyzes file content to determine purpose and appropriate placement
- **Project Detection**: Automatically detects project boundaries and suggests when files should be grouped
- **Lifecycle Management**: Tracks file lifecycle stages (planning → active → development → stable → archived)
- **Learning System**: Learns from your decisions to improve future suggestions
- **Scalability**: Designed to handle large workspaces (tested for million+ file environments)

## Key Features

### 1. Deep Folder Understanding

The server maintains a comprehensive folder map that describes:
- Purpose of each folder
- Accepted file types
- Organizational rules
- Lifecycle stages
- Subfolder patterns

Example folder types:
- `active-work/` - Current work in progress
- `projects/` - Stable, maintained projects
- `projects-in-development/` - Projects under active development
- `Templates-for-tools-frameworks-mcp-servers/` - Reusable templates
- `reference/` - Static reference material
- `future-ideas/` - Planning and ideation
- `archived/` - Old/completed work
- `temp/` - Temporary files

### 2. Content Analysis

Analyzes file content to understand:
- **File type** (code, documentation, config, secrets, templates, etc.)
- **Purpose** (extracted from headings, comments, etc.)
- **Sensitive content** (detects credentials, API keys, etc.)
- **Project affiliation** (which project does this belong to?)
- **Lifecycle indicators** (planning, draft, stable, deprecated, etc.)

Returns confidence scores and detailed reasoning for each suggestion.

### 3. Project Detection

Automatically detects when files form a cohesive project by checking for:
- `package.json` or similar config files
- README.md
- src/ or lib/ directories
- Multiple related code files
- Configuration files

Suggests:
- Creating project folders
- Grouping related files
- When active-work should graduate to projects/
- When projects should be archived

### 4. Lifecycle Management

Tracks and suggests lifecycle transitions:

```
planning → active → development → stable → archived
(future-ideas) (active-work) (projects-in-dev) (projects) (archived)
```

Monitors:
- File modification times
- Project completeness
- Deprecation indicators
- Activity patterns

## Installation

```bash
cd smart-file-organizer-template
npm install
npm run build
```

## Configuration

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "smart-file-organizer": {
      "command": "node",
      "args": [
        "/path/to/smart-file-organizer-template/dist/server.js"
      ],
      "env": {
        "SMART_FILE_ORGANIZER_PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

## Resources

### `smart-file-organizer://folder-map`
Returns the comprehensive folder structure map with deep understanding of folder purposes.

### `smart-file-organizer://unorganized-files`
Returns files in the root directory that don't belong there.

### `smart-file-organizer://custom-rules`
Returns learned patterns, file decisions, and project boundaries.

### `smart-file-organizer://lifecycle-stages`
Returns information about file lifecycle stages and transitions.

## Tools

### `analyze_file`
Deeply analyze a file to understand its purpose and suggest optimal location.

**Parameters:**
- `filePath` (required): Path to file (relative to project root)

**Returns:**
- File type, purpose, confidence score
- Whether it contains secrets, is a template, etc.
- Suggested location with detailed reasoning
- Keywords extracted from content

**Example:**
```
analyze_file with filePath="some-notes.md"

Returns:
📊 Analysis for "some-notes.md":
File Type: documentation
Purpose: Project Planning Notes
Is Secret: No
Is Template: No
Is Temporary: No
Is Planning Doc: Yes
Confidence: 80%

Suggested Location: future-ideas/

Reasoning:
1. Extension .md matches documentation file type
2. Filename suggests this is a planning document
3. Content suggests this is a planning or ideation document
4. Planning documents belong in future-ideas/
```

### `analyze_directory`
Analyze a directory to detect if it's a project and suggest organization.

**Parameters:**
- `dirPath` (required): Path to directory (relative to project root)

**Returns:**
- Whether it's detected as a project
- Confidence score
- Project indicators (has package.json, README, src/, etc.)
- Suggested location

**Example:**
```
analyze_directory with dirPath="my-app"

Returns:
🎯 Project Detected: "my-app"
Confidence: 85%
Files: 15

Project Indicators:
- Has package.json: ✓
- Has README.md: ✓
- Has src/ folder: ✓
- Has config files: ✓

Suggested Location: projects-in-development/

Reasoning:
1. Has package.json
2. Has README.md
3. Has src/ directory
4. Has 8 related code files
```

### `check_lifecycle`
Check if a file/folder should transition to a different lifecycle stage.

**Parameters:**
- `path` (required): Path to check (relative to project root)

**Returns:**
- Current and suggested lifecycle stage
- Whether transition is recommended
- Confidence score and reasoning
- Suggested action

**Example:**
```
check_lifecycle with path="active-work/user-auth"

Returns:
🔄 Lifecycle Analysis for "active-work/user-auth":
Current Stage: active
Suggested Stage: development
Should Transition: Yes ✓

Recommended Transition:
From: active
To: development
Reason: Project structure detected but not yet stable
Confidence: 65%
Action: Move to projects-in-development/

Analysis:
1. Has package.json
2. Has README.md
3. Has src/ folder
4. No changes in 15 days
```

### `suggest_organization`
Get comprehensive organization suggestions for multiple files.

**Parameters:**
- `paths` (required): Array of file paths to analyze

**Returns:**
- Suggestions for each file
- Confidence scores
- Reasoning

**Example:**
```
suggest_organization with paths=["notes.md", "config.json", "helper.js"]

Returns:
📋 Organization Suggestions:

📁 notes.md
   → active-work/<task-name>/
   Confidence: 75%
   Reason: Documentation files typically belong in active work folders

📁 config.json
   → config/ or <project-root>/
   Confidence: 60%
   Reason: Config files belong in config/ or project root

📁 helper.js
   → active-work/<task-name>/ or projects/<project-name>/
   Confidence: 50%
   Reason: Code files should be in a project or active work folder
```

### `move_file`
Move a file or directory to a new location.

**Parameters:**
- `source` (required): Source path (relative to project root)
- `destination` (required): Destination path (relative to project root)

**Behavior:**
- Creates destination directory if needed
- Records decision for learning
- Updates custom rules

### `create_project_folder`
Create a new project folder with proper structure.

**Parameters:**
- `projectName` (required): Name of the project
- `location` (optional): Where to create (`active-work`, `projects-in-development`, or `projects`)
- `includeStructure` (optional): Create standard folders (default: true)

**Creates:**
- Project folder with normalized name (kebab-case)
- Standard structure: `src/`, `docs/`, `README.md`
- Records project boundary for future reference

### `add_pattern`
Teach the server a new pattern for file organization.

**Parameters:**
- `pattern` (required): Regex pattern to match file names
- `location` (required): Where files matching this pattern should go
- `reason` (required): Why this pattern should go to this location

**Example:**
```
add_pattern with:
  pattern=".*-meeting-notes\\.md"
  location="active-work/<current-project>/"
  reason="Meeting notes belong with active project work"
```

### `record_decision`
Record a file organization decision for learning.

**Parameters:**
- `fileName` (required): Name of the file
- `movedTo` (required): Where it was moved to
- `reason` (required): Reason for the decision

## Folder Structure Schema

The server uses `schemas/folder-map.json` which defines:

### Folder Types
Each folder type includes:
- `path` - Folder location
- `purpose` - What the folder is for
- `lifecycle` - Lifecycle stage it represents
- `acceptsFiles` - Types of files that belong here
- `structure` - How files are organized within
- `rules` - Organization rules
- `indicators` - How to detect files that belong here

### File Types
- `code` - Source code files
- `documentation` - Documentation and text
- `config` - Configuration files
- `secrets` - Sensitive information
- `templates` - Template files
- `planning` - Planning documents
- `temp` - Temporary files

### Lifecycle Stages
1. **planning** - Ideas and planning (future-ideas/)
2. **active** - Current work (active-work/)
3. **development** - Active development (projects-in-development/)
4. **stable** - Completed and stable (projects/)
5. **static** - Reference material (reference/)
6. **archived** - No longer active (archived/)
7. **temporary** - Throwaway files (temp/)

## Custom Rules

Custom rules are stored per-project in `.smart-file-organizer-rules.json` at your project root.

Structure:
```json
{
  "patterns": [
    {
      "pattern": ".*-notes\\.md",
      "location": "active-work/<task>/",
      "reason": "Notes belong with active work",
      "addedOn": "2025-01-15"
    }
  ],
  "fileDecisions": [
    {
      "fileName": "project-plan.md",
      "movedTo": "future-ideas/",
      "reason": "Planning document",
      "timestamp": "2025-01-15"
    }
  ],
  "projectBoundaries": [
    {
      "projectName": "my-app",
      "location": "projects/my-app",
      "created": "2025-01-15"
    }
  ]
}
```

## Usage with Claude Code

### Method 1: Natural Language

Simply describe what you want:
- "Analyze all unorganized files and suggest where they should go"
- "Check if any active-work folders are ready to graduate to projects"
- "Find files that haven't been modified in 90 days and suggest archiving them"

### Method 2: Direct Tool Calls

Claude will automatically use the appropriate tools based on your request.

### Expected Behavior

**Proactive Analysis:**
When asked about organization, Claude should:
1. Check for unorganized files
2. Analyze each file deeply (content + context)
3. Suggest locations with reasoning
4. Ask for approval before moving

**Continuous Learning:**
After any organization action, Claude should:
1. Ask: "Would you like this to be a pattern I follow?"
2. Use `add_pattern` or `record_decision` to learn
3. Apply learned patterns to future suggestions

**Lifecycle Monitoring:**
Claude should proactively:
1. Detect when projects are ready to graduate
2. Suggest archiving old/unused files
3. Recommend organizing scattered files into projects

## Example Workflows

### Organizing New Files

```
You: "I have some new files in my root directory. What should I do with them?"

Claude: [Uses analyze_file on each unorganized file]
I found 3 unorganized files:

1. api-integration-notes.md
   → active-work/<task-name>/
   Confidence: 80%
   Reason: Documentation about active development work

2. database-credentials.json
   → config/
   Confidence: 95%
   Reason: Contains sensitive credentials ⚠️

3. helper-functions.js
   → active-work/<task-name>/ or projects/<project-name>/
   Confidence: 50%
   Reason: Needs more context - which project is this for?

Would you like me to move these files?
```

### Detecting Projects

```
You: "Check if my-new-app folder is ready to be a project"

Claude: [Uses analyze_directory]
🎯 Project Detected: "my-new-app"

This looks like a complete project:
- Has package.json ✓
- Has README.md ✓
- Has src/ folder ✓
- 12 code files
- Confidence: 85%

I recommend moving it to projects-in-development/ since it's well-structured but still under active development.

Would you like me to:
1. Move it to projects-in-development/
2. Keep it in active-work/ for now
3. Move it straight to projects/ if you think it's stable
```

### Lifecycle Management

```
You: "Which projects are ready to be archived?"

Claude: [Uses check_lifecycle on all projects]
I found 2 projects that might be ready for archival:

1. old-prototype/
   - No changes in 287 days
   - README mentions "deprecated"
   - Confidence: 85%
   - Recommendation: Move to archived/

2. beta-testing/
   - No changes in 195 days
   - No deprecation markers
   - Confidence: 55%
   - Recommendation: Verify if still needed before archiving

Would you like me to archive old-prototype/?
```

## Scaling to Google Drive

This server is designed with large-scale organization in mind:

### Performance Features
- **Batch Analysis**: Can analyze multiple files in parallel
- **Incremental Learning**: Doesn't re-analyze unchanged files
- **Confidence Scores**: Allows you to set thresholds for auto-organization
- **Progressive Organization**: Can work on subsets of files at a time

### For Google Drive Deployment

1. **Adapt the folder map** to match your Drive structure
2. **Set up batching** for analyzing large file sets
3. **Use confidence thresholds** to auto-organize high-confidence matches
4. **Review low-confidence** suggestions manually
5. **Build organization queue** to process files incrementally

The architecture supports:
- Millions of files
- Complex folder hierarchies
- Custom organizational rules
- Continuous learning from decisions

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run watch
```

### Start server
```bash
npm start
```

## Customization

### Modify Folder Map

Edit `schemas/folder-map.json` to:
- Add new folder types
- Define custom lifecycle stages
- Specify file type patterns
- Adjust organization rules

### Extend Content Analysis

Modify `src/content-analyzer.ts` to:
- Add new file type detection
- Enhance content parsing
- Customize keyword extraction
- Adjust confidence scoring

### Customize Project Detection

Modify `src/project-detector.ts` to:
- Change project detection criteria
- Adjust confidence thresholds
- Add new project indicators
- Customize graduation rules

### Tune Lifecycle Management

Modify `src/lifecycle-manager.ts` to:
- Change lifecycle stages
- Adjust transition thresholds
- Customize archival criteria
- Add new lifecycle rules

## Differences from Simple File Organizer

| Feature | Simple File Organizer | Smart File Organizer |
|---------|----------------------|---------------------|
| **Folder Understanding** | Root-level only | Deep, hierarchical |
| **Analysis** | Name patterns | Content + context |
| **Project Detection** | Manual | Automatic |
| **Lifecycle** | None | Full lifecycle tracking |
| **Learning** | Basic patterns | Comprehensive learning |
| **Scalability** | Small projects | Enterprise-scale |
| **Confidence Scores** | No | Yes, detailed |
| **Reasoning** | Basic | Comprehensive |

## License

MIT

## Contributing

This is a template for building your own smart file organizer. Feel free to customize and extend based on your needs!
