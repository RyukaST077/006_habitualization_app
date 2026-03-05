# Agents Guidelines

## Principle: One thread per role — reuse, don't re-spawn

Each role (`explorer`, `reviewer`, `builder`, etc.) has **at most one active sub-agent thread**.
If a thread for that role exists, **reuse it**. If none exists, spawn exactly one.
Use role + ordinal labels (e.g. "explorer #1") when multiple threads exist.

## Re-spawn exceptions

Re-spawn a new thread for the same role **only if**:

1. **Context is polluted** — thread is confused, contradicts itself, or has irrelevant state
2. **Hard reset required** — prior env/state is interfering
3. **Explicit parallelism** — label clearly (e.g. "explorer #2 for alternative approach")

When re-spawning:
- State which exception applies
- Label with ordinal (e.g. "reviewer #2")
- Main agent consolidates results and closes redundant threads