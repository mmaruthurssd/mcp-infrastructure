# Arc Decision Assistant - Simple User Guide

**Your friendly helper for making architecture decisions**

---

## What Is This?

The Arc Decision Assistant is like having an experienced developer friend who helps you decide **how to build your tools**.

You tell it what you want to build, it asks you clarifying questions, and then recommends whether you should create a:
- **Skill** (instructions for Claude to follow)
- **MCP Server** (connects to external systems)
- **Subagent** (changes how Claude thinks)
- **Combination** (uses multiple approaches together)

---

## How to Use It

### Starting the Assistant

In Claude Code, simply type:
```
arc decision
```

That's it! The assistant will greet you and start asking questions.

### The Conversation Flow

**1. Describe what you want:**
```
You: "I need a tool to help me write documents using our company style guide"
```

**2. The assistant asks questions:**
```
Assistant: "Is this mainly rules and patterns to follow, or do you need AI to make
creative decisions about the style?"

You: "Just rules to follow - specific fonts, colors, formatting."
```

**3. The assistant makes a recommendation:**
```
Assistant: "Perfect! I recommend creating a Skill.

Why? Because you have concrete rules that don't need AI judgment. A Skill is:
- Ultra-lightweight (uses ~50 tokens to scan, ~300 when active)
- Just a simple markdown file
- Easy to update when your style guide changes

This will save you about 2000 tokens compared to using a Subagent!"
```

**4. You can ask follow-up questions:**
```
You: "What if later I want AI to help apply these rules intelligently?"