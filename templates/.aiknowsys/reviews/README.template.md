# Reviews Directory

**Purpose:** Per-developer architect reviews (ephemeral, gitignored).

**How It Works:**
- Architect writes review to `PENDING_<username>.md`
- Developer reads review, addresses issues
- Developer deletes review file after completion
- No overwrites, no conflicts

**Why Gitignored:**
- Reviews are ephemeral (exist only during action)
- Keeps git history clean (no review clutter)
- Team can't accidentally see each other's pending reviews

**Historical Reviews:**
See `sessions/YYYY-MM-DD-session.md` for completed review summaries.

---

*Part of AIKnowSys multi-developer collaboration system.*
