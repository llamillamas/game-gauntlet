# SKILL_QUICK_REF.md — Fast Commands

**Use this for quick spawns.** Full details in `AGENTS_CONFIG.md`.

---

## Quick Spawn Syntax

```bash
sessions_spawn(task: "[exact description]", agentId: "[name]", model: "sonnet", runTimeoutSeconds: 180)
```

---

## Agent Quick Reference

| Agent | Best For | Timeout | Model | Example Prompt |
|-------|----------|---------|-------|-----------------|
| **atlas** | Decompose features into tickets | 180s | sonnet | "Break down 'redesign betting page' into FE/BE/security/QA tickets with acceptance criteria" |
| **nova** | Frontend implementation | 300s | sonnet | "Implement ticket FE-1: [exact AC]. Include loading, error, empty states. Reusable components." |
| **forge** | Backend implementation | 300s | sonnet | "Implement ticket BE-1: [exact AC]. Include validation, basic tests, observability hooks." |
| **sentinel** | Security review | 180s | opus | "Security review of [feature/diff]. Focus on auth, validation, secrets, dependency risks." |
| **gauge** | QA + release planning | 180s | sonnet | "Write test matrix + release checklist for [feature]. Include unit/integration/e2e + rollback." |
| **scribe** | Research + decision memos | 150s | sonnet | "Research [question]. Compare options A vs B. Show assumptions. Recommend defaults." |

---

## Auto-Active Skills (No Spawn Needed)

✅ **audit-logging** — All actions logged  
✅ **rate-limiter** — Quota protected  
✅ **secrets-manager** — Env vars encrypted  
✅ **permission-gates** — Safe operations  

---

## Common Game-Gauntlet Flows

### **Page Redesign Phase**
```
1. atlas → "Decompose page redesign into FE/BE/SEC tickets with AC"
2. nova + forge (parallel, 2min stagger) → Use tickets from Atlas
3. sentinel → Review diffs
4. gauge → Write test matrix
```

### **Contract Audit**
```
1. sentinel → "Review smart contract auth/validation/secrets"
2. cellcog (via sentinel) → Analyze diffs
```

### **Feature Research**
```
1. scribe → "Research [tech]. Compare options. Show defaults."
```

---

## Auditing

**View recent actions:**
```bash
tail -50 ~/.openclaw/audit.log
grep "FILE_WRITE" ~/.openclaw/audit.log | tail -20
```

---

**Status:** ✅ All 10 skills installed & agents configured (Feb 20, 09:21 UTC)
