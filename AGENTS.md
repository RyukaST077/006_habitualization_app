# Agents Guidelines

## Principle: Reuse existing sub-agent threads by role

To keep context, speed, and stability, **do not spawn a new sub-agent if an existing sub-agent thread with the same role already exists.**  
Instead, **route follow-up work to the existing thread** and continue the conversation there.

### Why
- Preserves investigation context and partial results
- Reduces overhead from repeated startup/spawn
- Avoids duplicated work and inconsistent conclusions

---

## Role-based Thread Reuse Rules

### 1. One active thread per role (default)
For each role (e.g. `explorer`, `reviewer`, `builder`), maintain **at most one active sub-agent thread**.

- ✅ If a thread for that role exists: **reuse it**
- ❌ If a thread for that role exists: **do not spawn another one** (no re-spawn)
- ✅ If no thread exists yet: spawn exactly one

### 2. How to reuse
When you need additional work from the same role:
1) Switch to the existing role thread (e.g. via `/agent` in TUI)
2) Provide incremental instructions, referencing prior findings in that thread
3) Switch back to `main` when done and summarize results

### 3. Naming / identification
If multiple threads exist (e.g. from earlier experiments), select the one that:
- has the most relevant context, and
- is most recent / currently active

Use role + ordinal labels in communication (e.g. “explorer #1”) to avoid ambiguity.

---

## When re-spawn is allowed (exceptions)

Re-spawn a new sub-agent thread for the same role only if **one of the following is true**:

1) **Context is polluted or off-track**
   - The thread is confused, contradicts itself repeatedly, or has irrelevant state.

2) **Hard reset is required**
   - You need a clean environment because prior commands, environment variables, or state are interfering.

3) **Parallelism is explicitly required**
   - The task must be done in parallel with different assumptions or different approaches, and you explicitly label it:
     - “Spawn explorer #2 for an alternative approach; explorer #1 continues the primary path.”

When you re-spawn, you must:
- state the reason (which exception applies),
- label the new thread with an ordinal (e.g. “reviewer #2”),
- and ensure the main agent consolidates results and closes redundant threads.

---

## Example instructions (copy/paste)

### ✅ Reuse existing role thread
- “Use the existing `explorer` thread. Don’t spawn a new one. Continue from its last findings and list remaining unknowns.”
- “Route this follow-up review to the existing `reviewer` thread; update conclusions based on the latest diff.”

### ✅ Create only if missing
- “If no `explorer` thread exists yet, spawn one. Otherwise reuse the current `explorer` thread.”

### ✅ Allowed re-spawn (explicit exception)
- “Spawn a new `explorer` thread (`explorer #2`) because the current one is off-track. Start from scratch and validate assumptions.”