# PROJECT OVERVIEW Question Flow Design

**Version:** 1.0.0
**Created:** 2025-10-27
**Goal:** Goal 004 - Build PROJECT OVERVIEW Generation Tool

---

## Design Principles

1. **Progressive Disclosure**: Ask minimum questions, infer maximum information
2. **Conversational**: Natural dialogue, not interrogation
3. **Smart Extraction**: AI extracts implicit information from responses
4. **Confirmation**: Show extracted data before committing
5. **Flexibility**: Allow users to skip or elaborate

---

## Question Sequence

### Phase 1: Core Information (3-5 questions)

#### Q1: Project Basics
**Question:**
```
Let's create your project overview! First, tell me about your project:
- What are you building?
- What problem does it solve?
- Who is it for?

(Feel free to describe it naturally - I'll extract the key details)
```

**Extracts:**
- Project name (from description or ask follow-up)
- Description/summary
- Problem statement
- Target users/stakeholders

**Follow-up if needed:**
```
What would you like to call this project?
```

---

#### Q2: Vision & Success
**Question:**
```
Great! Now, imagine this project is successfully completed. What does success look like?
- What are the key outcomes?
- How will you know it's working?
- What's the ultimate goal?
```

**Extracts:**
- Mission statement
- Success criteria
- Vision
- Key outcomes

---

#### Q3: Scope & Constraints
**Question:**
```
Let's talk about scope and constraints:
- What's IN scope for this project?
- What's explicitly OUT of scope?
- Any timeline or resource constraints?
- Any risks or concerns?
```

**Extracts:**
- Scope (in/out)
- Timeline constraints
- Resource constraints
- Risks
- Concerns

---

#### Q4: Resources & Dependencies
**Question:**
```
What resources do you have available, and what do you need?
- Existing assets (code, designs, documentation)
- Team members and their roles
- Tools and technologies you're using
- External dependencies
```

**Extracts:**
- Team members (stakeholders)
- Existing assets
- Needed assets
- External dependencies
- Technologies/tools

---

#### Q5: Components & Structure (Optional)
**Question:**
```
Do you already have a sense of major components or work areas for this project?
(Skip if not - I can suggest some based on what you've shared)
```

**Extracts:**
- Component names
- Component purposes
- Project structure ideas

**AI Suggestion:**
If user skips, AI suggests 3-5 components based on project type and description.

---

### Phase 2: Confirmation & Refinement

#### Show Extracted Information
```
Here's what I've captured:

**PROJECT OVERVIEW**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT NAME: [name]
DESCRIPTION: [description]

VISION:
• Mission: [mission statement]
• Success Criteria:
  - [criterion 1]
  - [criterion 2]
  - [criterion 3]

SCOPE:
• In Scope:
  - [item 1]
  - [item 2]
• Out of Scope:
  - [item 1]
  - [item 2]

CONSTRAINTS:
• Timeline: [timeline info]
• Resources:
  - Team: [team members]
  - Tools: [tools list]
  - Technologies: [tech stack]

STAKEHOLDERS:
  - [stakeholder 1]: [role/interest]
  - [stakeholder 2]: [role/interest]

RESOURCES:
• Existing: [existing assets]
• Needed: [needed assets]
• Dependencies: [external deps]

COMPONENTS (Suggested):
  1. [component 1]
  2. [component 2]
  3. [component 3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Does this look accurate? You can:
- Approve as-is
- Request changes (I'll ask follow-ups)
- Manual edit (I'll open the file)
```

---

#### Refinement Questions (if requested)
```
What would you like to refine?
1. Vision & success criteria
2. Scope definition
3. Timeline & resources
4. Stakeholders
5. Components
6. Something else
```

Then ask targeted follow-ups for the selected area.

---

## Information Extraction Logic

### AI Extraction Patterns

**Problem Statement:**
- Look for phrases: "solves", "addresses", "fixes", "pain point", "challenge"
- Extract: user frustrations, current limitations, goals

**Success Criteria:**
- Look for: "success means", "know it's working", "measure", "goal is"
- Convert to concrete, measurable criteria
- Ensure 3-5 criteria minimum

**Scope:**
- IN: Look for "must have", "includes", "covers", "handles"
- OUT: Look for "not doing", "future phase", "out of scope", "won't include"
- Add explicit boundaries if implied

**Timeline:**
- Look for: dates, "by [time]", "within [duration]", "deadline", "launch"
- Convert to structured timeline

**Stakeholders:**
- Look for: "for [group]", "users", "team", "clients", "customers"
- Extract roles and categorize (internal/external, influence level)

**Resources:**
- EXISTING: "we have", "already built", "current", "using"
- NEEDED: "need", "require", "will use", "planning to"
- DEPENDENCIES: "depends on", "requires", "integrates with"

**Components:**
- Extract from: major feature areas, system layers, work domains
- If not clear, suggest based on project type:
  - **Software:** Frontend, Backend, Data, Infrastructure, Operations
  - **Research:** Literature Review, Methodology, Data Collection, Analysis, Writing
  - **Product:** Design, Engineering, Marketing, Sales, Support
  - **Business:** Strategy, Operations, Finance, Marketing, Technology

---

## Conversation State Management

### State Object Structure
```typescript
interface ConversationState {
  conversationId: string;
  projectPath: string;
  currentPhase: 'gathering' | 'confirming' | 'refining' | 'complete';
  currentQuestion: number;

  // Extracted data
  extracted: {
    projectName?: string;
    description?: string;
    problemStatement?: string;
    vision?: {
      missionStatement?: string;
      successCriteria?: string[];
      scope?: {
        inScope?: string[];
        outOfScope?: string[];
      };
      risks?: string[];
    };
    constraints?: {
      timeline?: any;
      resources?: any;
    };
    stakeholders?: any[];
    resources?: {
      existingAssets?: string[];
      neededAssets?: string[];
      externalDependencies?: string[];
    };
    components?: Array<{
      name: string;
      purpose: string;
      suggested?: boolean;
    }>;
  };

  // Conversation history
  messages: Array<{
    role: 'assistant' | 'user';
    content: string;
    timestamp: string;
  }>;

  // Metadata
  createdAt: string;
  lastUpdated: string;
}
```

---

## Response Time Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Question generation | < 500ms | Pre-generated templates |
| AI extraction | < 2s | OpenAI/Claude API call |
| Confirmation display | < 100ms | Template rendering |
| File generation | < 1s | Write PROJECT OVERVIEW.md |
| **Total experience** | **< 5 minutes** | 3-5 questions + confirmation |

---

## Example Conversation Flow

### Scenario: Medical Practice Management Software

**Q1: Project Basics**
```
User: I'm building a medical practice management system. It helps
small clinics manage appointments, patient records, and billing. The
problem is that current solutions are too expensive and complicated
for small practices. This is for clinic owners and staff.
```

**Extracted:**
- Project Name: "Medical Practice Management System" (ask for short name)
- Description: "Practice management for small clinics"
- Problem: "Current solutions too expensive/complicated for small practices"
- Users: Clinic owners, staff

---

**Q2: Vision & Success**
```
User: Success means clinics can manage their practice without
expensive software. Key outcomes: easy scheduling, secure patient
records, simple billing. I'll know it's working when clinics save
time and reduce no-shows.
```

**Extracted:**
- Mission: "Make practice management accessible for small clinics"
- Success Criteria:
  - Clinics adopt system without training
  - 50% reduction in scheduling time
  - 30% reduction in no-shows
  - HIPAA compliant patient records
  - Simple invoicing under 5 minutes
- Vision: Affordable, simple practice management

---

**Q3: Scope & Constraints**
```
User: In scope: appointments, patient records, billing. Out of scope:
insurance claims, marketing automation. Timeline: MVP in 3 months,
launch in 6 months. Main risk is HIPAA compliance complexity.
```

**Extracted:**
- In Scope: Appointments, Patient Records, Billing
- Out of Scope: Insurance Claims, Marketing Automation
- Timeline: 3 months MVP, 6 months launch
- Risks: HIPAA compliance complexity

---

**Q4: Resources & Dependencies**
```
User: Just me for now, but may hire a designer. Using React,
Node.js, PostgreSQL. Need to integrate with Twilio for SMS
reminders. Have some UI mockups already.
```

**Extracted:**
- Team: Solo developer, potential designer hire
- Technologies: React, Node.js, PostgreSQL, Twilio
- Existing Assets: UI mockups
- Needed Assets: Designer (potential), HIPAA consultant
- External Dependencies: Twilio API

---

**Q5: Components**
```
User: Not sure - what do you suggest?
```

**AI Suggests:**
1. **Patient Management** - Records, demographics, medical history
2. **Appointment Scheduling** - Calendar, reminders, no-show tracking
3. **Billing & Payments** - Invoicing, payment processing, reports
4. **User Access & Security** - HIPAA compliance, roles, audit trail
5. **Integration Layer** - Twilio, future APIs

---

**Confirmation:**
Shows extracted overview with all details, user approves → generates PROJECT OVERVIEW.md

---

## Error Handling

### User Skips Questions
- Allow skip, mark fields as "TBD"
- Suggest revisiting later
- Don't block file generation

### Unclear Responses
- Ask clarifying follow-up
- Offer examples
- Provide default/suggestion

### Too Much Information
- Extract key points
- Summarize in confirmation
- Store full text in notes

### Technical Issues
- Save conversation state to temp file
- Allow resume from any question
- Provide recovery path

---

## Success Metrics

**Completion Rate:** > 80% of started conversations complete
**User Satisfaction:** "Felt natural" rating > 4/5
**Extraction Accuracy:** User confirmation without changes > 70%
**Time to Complete:** < 10 minutes average
**Adoption:** Used for 90%+ of new v1.0.0 projects

---

## Future Enhancements (Post-MVP)

1. **Multi-turn refinement**: Allow iterative improvements
2. **Project type detection**: Auto-adjust questions based on domain
3. **Import from existing docs**: Parse README, proposals
4. **Voice/video input**: Transcribe planning discussions
5. **Collaborative mode**: Multiple stakeholders contribute
6. **Template library**: Industry-specific templates

---

**Status:** Design Complete - Ready for Implementation
**Next:** Create PROJECT OVERVIEW template with variables
