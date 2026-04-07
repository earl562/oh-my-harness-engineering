# Contributing

Thanks for your interest in making this the best resource for agentic harness knowledge. Here's how to contribute.

## What We're Looking For

### Articles & Papers
- Blog posts from companies building production harnesses
- ArXiv papers on agent architectures, tool design, or evaluation
- Conference talks or tutorials on agent engineering
- Independent research on harness design patterns

**To add:** Open a PR editing `references/reading-list.md`. Include:
- Title and link
- Author/organization
- One-sentence key insight (what makes this worth reading?)

### Case Studies
Deep dives into specific architectural decisions made by production harnesses.

**To add:** Create a new file in `case-studies/` following the template in `case-studies/README.md`. A good case study:
- Focuses on **one specific decision** (not "everything about X")
- Explains the **problem** that motivated the design
- Shows **how it works** with architecture details or code examples
- Discusses **trade-offs** honestly
- Ends with **actionable lessons** for other harness builders

### Harness Profiles
New harnesses to add to the comparison matrix or use-case guide.

**To add:** Open a PR editing `references/harness-matrix.md` and `references/use-case-guide.md`. Include:
- Harness name, org, and repo link
- License
- Key architectural decisions (agent loop style, tool system, context management)
- What it does uniquely well

### Corrections & Updates
The space moves fast. If something is outdated or wrong, please fix it.

## Guidelines

1. **Accuracy over hype.** Cite sources. If a claim is based on benchmarks, link to them. If it's based on experience, say so.
2. **Specificity over generality.** "Tool descriptions matter" is less useful than "Adding input examples to tool descriptions improved task completion by 15% in our testing."
3. **Trade-offs over recommendations.** Every design choice has downsides. Discuss them.
4. **Neutral tone.** This is a knowledge base, not marketing. Describe what harnesses do, not why they're the best.

## Process

1. Fork the repo
2. Create a branch (`add-paper-xyz` or `case-study-harness-feature`)
3. Make your changes
4. Open a PR with a brief description of what you're adding and why it's valuable

We'll review within a few days. Most PRs that follow the guidelines above get merged quickly.

## Questions?

Open an issue if you're not sure whether something fits. We'd rather have the conversation than miss a good contribution.
