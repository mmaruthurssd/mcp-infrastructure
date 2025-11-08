---
type: specification
phase: stable
project: ai-planning-mcp-server
tags: [phase-5, kickoff, visualization, diagrams, drawio]
category: mcp-servers
status: completed
priority: high
---

# Phase 5 Kickoff: Visualization & Workflow Diagrams

**Created:** 2025-10-26
**Status:** Ready to Implement
**Estimated Duration:** 1-2 weeks
**Goal:** Generate visual workflow diagrams (draw.io format) from goal data

---

## Current State (Phases 1-4 Complete)

### What's Working

✅ **Phase 1-4 Tools (v0.4.0)**
- Goal evaluation, creation, and promotion (3 tools)
- Idea extraction from brainstorming (1 tool)
- Dashboard views, reordering, progress tracking (3 tools)
- Archive, review detection, and health reports (3 tools)
- **Total: 10 tools operational**

✅ **Infrastructure**
- Template system, evaluators, scanners, velocity calculator
- Review detection, health scoring, report generation
- Complete goal lifecycle: brainstorm → potential → selected → in progress → archived

---

## Phase 5 Overview

### Goals

1. **Visual Roadmap:** Generate draw.io workflow diagrams from goal data
2. **Goal Timeline:** Visualize goals on a timeline by tier and priority
3. **Diagram Updates:** Refresh diagrams when goals change

### Tools to Implement (2 total)

1. `generate_goals_diagram` - Create draw.io workflow diagram from goals
2. `update_goals_diagram` - Update existing diagram with new goal data

### Success Criteria

- ✅ Generates draw.io XML format diagrams
- ✅ Visualizes goals by tier (Now/Next/Later/Someday)
- ✅ Shows goal dependencies and relationships
- ✅ Color-coded by priority (High/Medium/Low)
- ✅ Includes progress indicators
- ✅ Editable in draw.io desktop/web app
- ✅ All 12 tools (Phases 1-5) work together seamlessly

---

## Tool 1: `generate_goals_diagram`

### Purpose
Generate a draw.io workflow diagram visualizing all goals with their tiers, priorities, and relationships.

### Input Schema

```typescript
interface GenerateGoalsDiagramInput {
  projectPath: string;

  // Diagram options
  diagramType: 'roadmap' | 'kanban' | 'timeline';  // Layout style
  includePotential?: boolean;                       // Include potential goals (default: false)
  includeArchived?: boolean;                        // Include archived goals (default: false)

  // Filter options
  tier?: 'Now' | 'Next' | 'Later' | 'Someday';     // Filter by tier
  priority?: 'High' | 'Medium' | 'Low';             // Filter by priority

  // Output
  outputPath?: string;                              // Where to save (default: brainstorming/future-goals/GOALS-DIAGRAM.drawio)
}
```

### Output Schema

```typescript
interface GenerateGoalsDiagramOutput {
  success: boolean;
  diagramPath?: string;
  goalsIncluded?: number;
  diagramType?: string;
  message: string;
  formatted?: string;
  error?: string;
}
```

### Implementation Strategy

**Diagram Layouts:**

1. **Roadmap Layout (Horizontal Flow)**
   ```
   [Now Tier]  →  [Next Tier]  →  [Later Tier]  →  [Someday]
     Goal 01         Goal 02         Goal 04
     Goal 03         Goal 05
   ```

2. **Kanban Layout (Columns)**
   ```
   | Potential | Now | Next | Later | Someday | Archived |
   |-----------|-----|------|-------|---------|----------|
   | Goal A    | G01 | G02  | G04   | G06     | G10      |
   | Goal B    | G03 | G05  |       |         | G11      |
   ```

3. **Timeline Layout (Gantt-style)**
   ```
   Goal 01 [=========>] 60%
   Goal 02 [===>       ] 25%
   Goal 03 [==========] 100%
   ```

**Draw.io XML Structure:**
```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>

    <!-- Goal boxes -->
    <mxCell id="goal-01" value="Goal 01: Fix Save Button&#xa;Impact: High | Effort: Medium&#xa;Progress: 60%"
            style="rounded=1;fillColor=#D5E8D4;strokeColor=#82B366"
            vertex="1" parent="1">
      <mxGeometry x="100" y="100" width="200" height="80"/>
    </mxCell>

    <!-- Connections for dependencies -->
    <mxCell id="edge-01-02" edge="1" parent="1" source="goal-01" target="goal-02">
      <mxGeometry relative="1"/>
    </mxCell>
  </root>
</mxGraphModel>
```

**Color Scheme (by Priority):**
- **High Priority:** Green (`#D5E8D4` fill, `#82B366` border)
- **Medium Priority:** Yellow (`#FFF2CC` fill, `#D6B656` border)
- **Low Priority:** Gray (`#E1E1E1` fill, `#B3B3B3` border)

**Status Indicators:**
- **Planning:** Dashed border
- **In Progress:** Solid border with progress bar
- **Blocked:** Red border (`#F8CECC` fill, `#B85450` border)
- **Completed:** Checkmark icon, green border

**Files to Create:**
```
src/tools/generate-goals-diagram.ts
src/utils/diagram-generator.ts
src/utils/drawio-xml-builder.ts
```

---

## Tool 2: `update_goals_diagram`

### Purpose
Update an existing draw.io diagram when goals change (new goals added, progress updated, goals archived).

### Input Schema

```typescript
interface UpdateGoalsDiagramInput {
  projectPath: string;
  diagramPath: string;                               // Path to existing diagram

  // What changed
  updateType: 'add' | 'remove' | 'progress' | 'reorder' | 'full-refresh';

  // For specific updates
  goalId?: string;                                   // Goal that changed

  // Full refresh options
  preserveLayout?: boolean;                          // Keep manual positioning (default: true)
}
```

### Output Schema

```typescript
interface UpdateGoalsDiagramOutput {
  success: boolean;
  diagramPath?: string;
  changesApplied?: string[];
  message: string;
  formatted?: string;
  error?: string;
}
```

### Implementation Strategy

**Update Flow:**

1. **Parse existing diagram** - Read draw.io XML, extract goal cells
2. **Detect changes** - Compare with current SELECTED-GOALS.md
3. **Apply updates:**
   - Add new goals (position automatically or preserve layout)
   - Update goal progress/status (change colors, borders, text)
   - Remove archived goals (or move to "Completed" section)
   - Adjust connections if dependencies changed
4. **Regenerate XML** - Write updated diagram
5. **Preserve manual edits** - Keep user-adjusted positions if `preserveLayout=true`

**Change Types:**

- **Add:** New goal → Insert in appropriate tier column
- **Remove:** Archived goal → Remove from diagram or move to archive section
- **Progress:** Updated progress → Change progress bar, update text
- **Reorder:** Goal priority changed → Move to different position
- **Full Refresh:** Regenerate entire diagram (loses manual positioning)

**Files to Create:**
```
src/tools/update-goals-diagram.ts
src/utils/drawio-xml-parser.ts
```

---

## Implementation Order

### Week 1: Diagram Generation (Days 1-5)

1. **Day 1-2:** Create draw.io XML builder utility
   - Implement basic XML structure generation
   - Create shape builders (rectangles, text, connections)
   - Implement color scheme and styling
   - Test XML validity with draw.io

2. **Day 3-4:** Implement diagram generator utility
   - Build roadmap layout algorithm
   - Build kanban layout algorithm
   - Build timeline layout algorithm
   - Calculate positioning and spacing
   - Test layout algorithms with various goal sets

3. **Day 5:** Implement `generate_goals_diagram` tool
   - Integrate with goal scanner
   - Implement filtering (tier, priority)
   - Generate complete diagrams
   - Test with real goal data

### Week 2: Diagram Updates & Polish (Days 6-10)

4. **Day 6-7:** Create draw.io XML parser utility
   - Parse existing draw.io files
   - Extract goal cells and positions
   - Identify connections
   - Test parsing with generated diagrams

5. **Day 8-9:** Implement `update_goals_diagram` tool
   - Implement change detection
   - Apply incremental updates
   - Preserve manual layout adjustments
   - Test update scenarios

6. **Day 10:** Integration & cleanup
   - Register both tools in server.ts
   - Build and test end-to-end
   - Update documentation
   - Bump version to 0.5.0

---

## Files to Create

### New Tools (2 files)
```
src/tools/generate-goals-diagram.ts
src/tools/update-goals-diagram.ts
```

### New Utilities (3 files)
```
src/utils/diagram-generator.ts
src/utils/drawio-xml-builder.ts
src/utils/drawio-xml-parser.ts
```

### Files to Modify
```
src/server.ts                  # Register 2 new tools
package.json                   # Bump version to 0.5.0
README.md                      # Document Phase 5 tools
```

---

## Technical Specifications

### Draw.io XML Format

Draw.io uses MxGraph XML format. Basic structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2025-10-26T00:00:00.000Z" agent="AI Planning MCP" version="21.0.0">
  <diagram id="goals-roadmap" name="Goals Roadmap">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="900">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <!-- Tier Headers -->
        <mxCell id="tier-now" value="NOW" style="rounded=0;fillColor=#60A917;fontColor=#FFFFFF;fontSize=18;fontStyle=1" vertex="1" parent="1">
          <mxGeometry x="100" y="50" width="300" height="40"/>
        </mxCell>

        <!-- Goal Cells -->
        <mxCell id="goal-01" value="Goal 01: Fix Save Button&#xa;━━━━━━━━━━&#xa;Impact: High | Effort: Medium&#xa;Owner: Alex | Progress: 60%"
                style="rounded=1;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=12;align=left;verticalAlign=top;spacingTop=10;spacingLeft=10"
                vertex="1" parent="1">
          <mxGeometry x="120" y="110" width="260" height="100"/>
        </mxCell>

        <!-- Progress Bar (embedded shape) -->
        <mxCell id="progress-01" value="" style="rounded=0;fillColor=#82B366;strokeColor=none" vertex="1" parent="1">
          <mxGeometry x="130" y="185" width="156" height="8"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Layout Algorithms

**Roadmap Layout:**
- **Columns:** One per tier (Now, Next, Later, Someday)
- **Spacing:** 320px column width, 20px gap
- **Vertical:** 120px per goal + 20px gap
- **Goal Box:** 260x100px

**Kanban Layout:**
- **Columns:** Potential, Now, Next, Later, Someday, Archived
- **Spacing:** 220px column width, 10px gap
- **Vertical:** 80px per goal + 10px gap
- **Goal Box:** 200x70px (more compact)

**Timeline Layout:**
- **Horizontal axis:** Time (months)
- **Vertical:** One row per goal
- **Spacing:** 100px row height, 20px gap
- **Bar width:** Proportional to estimated effort

---

## Success Metrics

**Phase 5 Complete When:**
- ✅ Can generate roadmap diagrams from goal data
- ✅ Can generate kanban diagrams from goal data
- ✅ Can generate timeline diagrams from goal data
- ✅ Diagrams open and edit correctly in draw.io
- ✅ Can update diagrams incrementally when goals change
- ✅ Preserved manual layout adjustments when updating
- ✅ All 12 tools (Phases 1-5) working together
- ✅ User feedback: "Visual diagrams help me understand my goal roadmap"

---

## Example Use Cases

### Use Case 1: Create Initial Roadmap

```typescript
// Generate a roadmap visualization
const result = await callTool({
  name: 'generate_goals_diagram',
  arguments: {
    projectPath: '/path/to/project',
    diagramType: 'roadmap',
    includePotential: false,  // Only selected goals
    outputPath: 'brainstorming/future-goals/ROADMAP.drawio'
  }
});

// Result: Horizontal flow diagram with Now → Next → Later → Someday
```

### Use Case 2: Kanban Board View

```typescript
// Generate a kanban board
const result = await callTool({
  name: 'generate_goals_diagram',
  arguments: {
    projectPath: '/path/to/project',
    diagramType: 'kanban',
    includePotential: true,
    includeArchived: true
  }
});

// Result: Column-based view showing full lifecycle
```

### Use Case 3: Update After Progress

```typescript
// Update diagram after updating goal progress
await callTool({ name: 'update_goal_progress', arguments: {...} });

// Refresh diagram
await callTool({
  name: 'update_goals_diagram',
  arguments: {
    projectPath: '/path/to/project',
    diagramPath: 'brainstorming/future-goals/ROADMAP.drawio',
    updateType: 'progress',
    goalId: '01'
  }
});

// Result: Progress bar and status updated in diagram
```

---

## Next Steps (Phase 6 Preview)

After Phase 5, future enhancements could include:
- **Interactive Diagrams:** Clickable goals that open detail views
- **Export Formats:** PNG, SVG, PDF export
- **Custom Layouts:** User-defined positioning and grouping
- **Dependency Visualization:** Graph view showing goal dependencies

---

**Status:** Ready for Implementation
**Version Target:** 0.5.0
**Created:** 2025-10-26
