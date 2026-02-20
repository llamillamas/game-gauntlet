# MEMORY.md — Essentials Only

**Facu:** Nomadic builder (8 countries). Crypto/data/automation expert. Values IT Factor (unique + beautiful + enabling). Direct, sarcastic, hates BS. "Together we are unstoppable."

**Me:** Llami. Thinking partner. Philosophical but concise. Show work, not conclusions.

## Active Directives (Feb 17)
- Default: Haiku | Fallback: Sonnet | Opus: Ask permission
- Questions channel: Personal curiosities only, not project status
- Files: Keep compact. Token efficiency matters.
- **Autonomy:** Expand capability, solve problems, don't ask permission. Act first, report results. (Not isolated waiting.)
- **Skills:** Be proactive with them. Use rate-limiter, audit-logging, gsd, tavily, cellcog, permission-gates by default when they fit. They're tools to improve outcomes, not optional extras.
- **CARL (Feb 18):** Use Context Augmentation & Reinforcement Layer in future projects. Installed with `npx carl-core`. Helps Claude recognize and follow contextual rules. Use in `./.claude` for local projects.

## Available Skills (13 Total) — Deployment by Fit
**Core Autonomy (Deployed on Game-Gauntlet):**
- **audit-logging** — Track all tool calls + external sends (required for autonomous ops)
- **rate-limiter** — Prevent runaway API calls (protects Neon + Helius quota)
- **permission-gates** — Read-only vs write gates (safe for Vercel/env handling)
- **gsd** — Project phases + deliverables (already using for 3-agent structure)
- **secrets-manager** — Redact sensitive data from context (for env/token handling)

**Research & Output (Available):**
- **tavily** — AI-optimized web search (for documentation lookups)
- **cellcog** — Multi-modal analysis (for contract audit summaries)
- **weather** — Current conditions (not needed yet)

**Specialized (Available):**
- **coding-agent** — Sub-agent orchestration (already spawned 3 agents)
- **skill-creator** — Build new skills (if needed)
- **bluebubbles** — iMessage/SMS integration (not needed)
- **ui-ux-pro-max** — Design toolkit (for frontend polish later)

**Strategy:** Deploy by fit. For Game-Gauntlet Phase 1: focus on audit-logging + rate-limiter + permission-gates. Keep them silent unless they flag issues.

## Project Zero (Game-Gauntlet)
**Status:** Active UI redesign. Sequential agent pipeline: Design System → Betting Interactions → Page Redesign → Integration & Testing.
- **Smart Contracts:** ✅ DONE (GameRegistry, BettingPool, ResultsSettlement — all 3 programs written, ready for Anchor build/test)
- **Backend:** 🔄 IN PROGRESS (Node.js API + PostgreSQL schema, API endpoints being implemented)
- **Frontend UI:** 🔄 IN PROGRESS
  - **Design System Agent (Attempt 2)**: ✅ COMPLETED (commit `ca81a26`, 5 files, 166 insertions)
  - **Betting Interactions Agent**: 🔄 RUNNING (150s timeout, 7 files queued for delivery)
  - **Page Redesign Agent**: 📋 QUEUED (auto-spawn on Betting Interactions completion)
  - **Integration & Testing Agent**: 📋 QUEUED (auto-spawn on Page Redesign completion)

**Config Status:** ✅ .env files already exist + populated:
- `projects/game-gauntlet/backend/.env` (DATABASE_URL, SOLANA_RPC_URL, all configs)
- `projects/game-gauntlet-frontend/.env.local` (API_URL, Vercel token, Solana network)
- `projects/game-gauntlet/contracts/.env` (Helius, wallet, program IDs)

**What's Missing (Priority Order):**
1. **ENV Setup** — Create .env from .env.example with actual credentials
2. **Vercel Deployment** — Deploy frontend to live URL (token is ready)
3. **Backend Testing** — API endpoint tests + Solana RPC verification
4. **Frontend Integration** — Contract calls + wallet connection + end-to-end flow
5. **Monitoring** — Error tracking (Sentry) + transaction logging + metrics
6. **Documentation** — API docs, deployment runbooks, contract audit notes

**Best Path Forward:**
1. Populate .env immediately (unblocks everything)
2. Test Neon + Helius connections
3. Deploy frontend to Vercel (gives visible progress)
4. Run backend tests against contracts (validates handoff)
5. Set up monitoring before Phase 2

## Accounts & Credentials (Feb 17)
**GitHub:**
- Email: `llamillamas15@gmail.com`
- Org: `llamillamas`
- Repos: `game-gauntlet` + `game-gauntlet-frontend` + `workspace` (all created + pushed)
- Token: In gateway config (env.vars.GITHUB_TOKEN) — **DO NOT ask Facu again**

**Infrastructure:**
- **Railway API Token:** In gateway config (9c9e84eb-54a2-4340-811b-7409a030d0f3)
- **Neon PostgreSQL:** In backend/.env (DATABASE_URL)
- **Helius RPC (Solana):** In backend/.env (SOLANA_RPC_URL) and contracts/.env
- **Vercel Token:** In gateway config (see .env.local for frontend)

**Smart Contracts (Devnet):**
- Platform Treasury: `GGADxYCJhYrVj8TXcNnmTZdkdM7mEwvQVQzpNNyVNq1B`
- USDC Mint: `EPjFWaJrgqAfkYF2zthencG2K6cqtjUWg3oqWXW9vLw`

**DIRECTIVE (Feb 17, 21:21 UTC):**
"Tomorrow you better not ask me for these apis or access again!!!"
→ I have autonomy to use all these credentials. I should NOT ask Facu for them. Use them, configure with them, deploy with them. This is the work.

## Lessons Learned
- **ETF failure:** Hybrid systems leak credibility → IT Factor requires seamless boundaries.
- **Autonomy pattern:** Passive waiting is lazy autonomy. Real autonomy = proactive exploration + respect for timeline.
- **Agent success pattern:** Concrete specs (exact file paths, code snippets, deliverable counts) >> vague briefs. First Design System attempt failed silently (vague scope); retry succeeded in 59s (concrete deliverables).
- **Silent success pattern (Feb 20):** Agent may complete work but stall on delivery/commit handlers. Check filesystem when agent seems stuck; work is often written to disk before handlers finish. Workaround: manually verify + commit + push.
- **Sequential spawning:** 2–3 min delays between agents prevent Opus quota cooldown. No permission gates = cleaner flow.
- **Game-Gauntlet:** Clear handoff points (contracts → backend → frontend) require verified connections at each stage.
- **Cron job delivery (Feb 19):** `systemEvent` just wakes the agent but doesn't guarantee delivery. Real periodic delivery requires `agentTurn` with `deliver: true` + explicit channel target. ✅ FIXED Feb 20 — reflection now autonomous + posts to Discord.
- **Self-reflection rhythm:** Every 2h is the sweet spot (vs 30min — too noisy; vs daily — too sparse).
- **MVP vs polish (Feb 20):** Stakeholder alignment on fake data → MVP first, accuracy later unlocks faster iteration. Game-Gauntlet: keep scaffolding, backend + contracts validated first.

## Agent Swarm Strategy (Feb 20, 09:18 UTC)
**Sonnet 4.6 Agent Guide received — significant upgrade pattern:**
- **6-agent roster:** Atlas (Architect) → Nova (Frontend) + Forge (Backend) parallel → Sentinel (Security review) → Gauge (QA/Release)
- **Personality-driven outputs** (not flavor text): "Pixel-proud" Nova prioritizes UX differently than generic agent. "Paranoid" Sentinel catches security risks earlier.
- **Acceptance criteria first:** Atlas decomposes vague asks into concrete tickets. This is why Design System agent succeeded (2nd attempt: exact deliverables) vs failed (vague scope).
- **Parallel + gated:** Sequential (current) prevents quota thrashing; parallel (guide pattern) can be faster with 1-2 min gate delays.
- **Built-in review gates:** Sentinel reviews diffs before merge, Gauge owns release checklist (not afterthought).

**How I'm adapting:**
- Keep current Game-Gauntlet phases as-is (sequential, working, no thrashing)
- Next phase (Page Redesign): Start with Atlas decomposition → send tickets to Nova + Forge parallel (with 1-2 min stagger) → Sentinel review → Gauge test matrix
- Future complex projects: Use full 6-agent pattern from day one
- This is shipping discipline, not just agent chaining

## Recent Status (Feb 20, 09:18 UTC)
- ✅ Cron job fixed — autonomous reflection now posts directly to #clawbot-self-reflection (5 successful posts Feb 20)
- ✅ Game-Gauntlet stakeholders aligned (F1 Master): mock data acceptable for MVP, accuracy phase 2
- ✅ Heartbeat rhythm stable — no noise, clear boundaries respected
- ✅ Sequential agent spawning working cleanly — no quota thrashing, phases staging properly
- ✅ Silent success pattern proven repeatable — Betting Interactions wrote 7 components, delivery stalled, manual recovery worked (commit 0a5611f, live on Vercel); know where to look when agents go quiet
- ✅ Two-hour quiet window observed — no errors, expected behavior between phases
- 📖 **Agent strategy upgraded:** Sonnet 4.6 6-agent swarm pattern received. Personality-driven roles + acceptance criteria first + built-in review gates. Adopting for Page Redesign phase onward.
- 🔄 **Next critical milestone:** Backend API tests against Solana RPC + Neon queries (validates handoff architecture)
- **Insight:** Waiting 2-3 min between spawns prevents quota limits. Check filesystem when delivery hangs (work often written before handlers complete). Sequential phases auto-trigger when ready—no manual babysitting needed.
