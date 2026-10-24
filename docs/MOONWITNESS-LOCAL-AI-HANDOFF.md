
# MoonWitness Corpus — LOCAL AI HANDOFF (SRGBL v8 / P18–P19)

**Date:** 2026-10-25 · **Target:** bjo163/moonwitness-corpus · **Work only on existing branch: dev**.  
**Status:** Ready as an engineering instruction and issue inventory, **not** a claim that all P19 acceptance/research gates are complete.

**Start here:** [Master Grandplan](./MOONWITNESS-SRGBL-V8-GRANDPLAN.md) → [Narrative](./MOONWITNESS-P19-PRODUCT-NARRATIVE.md) → [Experience Blueprint](./MOONWITNESS-SRGBL-V8-BLUEPRINT.md) → [38 Micro Issues](./MOONWITNESS-P19-MICROTASKS.md) → [Issue Manifest](./MOONWITNESS-P19-MICROTASKS.json).  
**Master Epic:** https://github.com/bjo163/moonwitness-corpus/issues/446.  
**Preexisting P18 work:** GitHub Issues #425–#444.  
**P19 atomic issue range:** #452–#489.

**MANDATORY BEFORE EACH ISSUE:** [Walkthrough of the actual product](./MOONWITNESS-EXPLAINED-WALKTHROUGH.md) and [Issue-specific input/output, valid/invalid examples and executable tests](./MOONWITNESS-P19-EXECUTABLE-SPECS.md). An AI must read the exact micro-ID section, not merely the title. The corresponding GitHub issue now embeds these details.

## 0. Most important instruction — no new branches

The user explicitly prohibits creating more branches. The local AI must work **only on dev**. Never run git switch -c, git checkout -b, git branch newname, or gh pr create. Do not push to main or release the application. Do not force-push or bypass protection. If dev is protected against direct push, show the exact error and preserve local work for user policy resolution; **do not create a branch as a workaround**.

Before any change, check for dirty worktree and other processes working in dev. Never delete other edits. Run **one coding agent at a time** on the shared dev checkout; concurrency is allowed only with isolated worktrees that already exist and do not create branches, and only if the user explicitly approves it.

## 1. Required environment

- Node.js 24.x, pnpm 10.33.4, TypeScript and Fastify.
- apps/web is independent Next.js 16 static export, npm 11.6.x; do not assume pnpm workspace installs web dependencies.
- Existing corpus SQLite/build system, derived research package packages/srgbl, read-only Fastify research endpoints.
- GitHub CLI (gh), authenticated with repository permissions.

## 2. First-time local terminal commands

    git remote -v
    git status --short --branch
    git fetch origin --prune
    git switch dev
    git pull --ff-only origin dev
    node --version
    pnpm --version
    gh auth status
    pnpm install --frozen-lockfile
    pnpm typecheck

If the working tree is dirty before switching/pulling, stop and inspect; never discard unknown edits. If node/pnpm versions mismatch, correct environment without gratuitous dependency upgrades.

For the independent web:

    cd apps/web
    npm ci
    npm run typecheck
    npm test
    npm run build
    cd ../..

For full repository gate:

    pnpm check

Relevant small-test example:

    pnpm exec tsx --test packages/srgbl/src/analysis.test.ts

For TODO audit (read only):

    pnpm todo:check

Do not execute pnpm todo:sync indiscriminately: the repository issue-sync contract and canonical P18/P19 TODO markers must be preserved.

## 2.1 Measured command matrix (baseline P19-L01 / #452)

Measured on 2026-10-25 with Node 24.22.1, pnpm 10.33.4, npm 11.19.1, git 2.56.0 on a Windows checkout of `dev`; re-measured at `dev` HEAD `169cd33` after the P19-L01..L20 wave. Exit codes below are observed results, not expectations. Re-measure after any dependency or toolchain change; a green historical run is not evidence for a new SHA.

**Root workspace (`pnpm`, monorepo gate):**

| Command | Observed result | Writes to the worktree | Note |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | exit 0 | `node_modules/` only (ignored) | Reports ignored build scripts for `esbuild`, `protobufjs`; do not run `pnpm approve-builds` casually |
| `pnpm typecheck` | exit 0 (`tsc --noEmit`, no output) | none | Root `tsconfig.json` only; `apps/web` is not covered |
| `pnpm test` | exit 0, 324 tests pass, 0 fail | none | Baseline before the P19 micro-issue wave was 295; each micro issue adds regression tests, so re-read the count instead of trusting this row |
| `pnpm exec tsx --test packages/srgbl/src/index.test.ts` | exit 0, 12 tests pass, 0 fail | none | SRGBL core: maturity, quality rubric, direction, Witness /100, Swing candidate, cross-text relation |
| `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts` | exit 0, 20 tests pass, 0 fail | none | Default focused command for SRGBL analysis tasks |
| `pnpm exec tsx --test packages/srgbl/src/research-ledger.test.ts` | exit 0, 5 tests pass, 0 fail | none | Candidate-ledger serialization tasks (P19-L19 / #470) |
| `pnpm exec tsx --test packages/srgbl/src/sources.test.ts` | exit 0, 4 tests pass, 0 fail | none | Selector/rights-scope file introduced by P19-L05 / #456 |
| `pnpm exec tsx --test packages/srgbl/src/swing-chain.test.ts` | exit 0, 8 tests pass, 0 fail | none | Swing candidate/chain tasks |
| `pnpm exec tsx --test apps/api/src/api.test.ts` | exit 0, 13 tests pass, 0 fail | none | Run whenever `packages/srgbl` changes reach the Fastify adapter |
| `pnpm check` | **not run locally in this session**; passed inside CI runs 40144490214 and 40144755987 | SQLite database build output and repository build artifacts (ignored) | Release-grade gate; deliberately not run per micro issue on the laptop because it builds and validates the whole corpus, so it is delegated to the `check` job |
| `pnpm todo:check` | **not run in this session** | none | Read-only audit; see the warning above |

**Independent web app (`apps/web`, npm, separate install tree):**

| Command | Observed result | Writes to the worktree | Note |
|---|---|---|---|
| `npm ci` | **not run in this session** | `node_modules/` | Existing install was reused; this file does not claim a lockfile reinstall passed |
| `npm run typecheck` | exit 2 on this checkout; all 5 errors are inside generated, gitignored `.next/dev/types/*.ts` (stale artifact); no `src/**` error | none | Delete or regenerate `.next` before trusting this gate; the failure is a build-cache artifact, not a source error |
| `npm test` | exit 0 (`RGBL web contract smoke: OK`) | none | Contract smoke test, not the application build |
| `npm run build` | **not run in this session** | `apps/web/.next/`, `apps/web/public/corpus-catalog.json` (tracked!), `apps/web/public/corpus-db/`, `apps/web/public/vendor/sqlite-httpvfs/` | Fetches the catalog from GitHub raw when missing, so it needs network and can modify a tracked file |

**Manual CI:** `.github/workflows/ci.yml` triggers on `workflow_dispatch` only. Its `check` job runs install, `node --test scripts/workflow-safety.test.mjs`, `pnpm check` and a Fastify smoke (`/v1/health`, `/metrics`, `/v1/traditions`, `/v1/search`); its `web` job runs `node scripts/export-web-catalog.mjs --check`, web `npm ci` / `typecheck` / `test`, the browser-search-DB build and `npm run build`. **Three dispatches were executed and all three concluded `success`:** [run 40144091349](https://github.com/bjo163/moonwitness-corpus/actions/runs/40144091349) on `cf313c6`, [run 40144490214](https://github.com/bjo163/moonwitness-corpus/actions/runs/40144490214) on `0ea9659`, and [run 40144755987](https://github.com/bjo163/moonwitness-corpus/actions/runs/40144755987) on `169cd33` (the HEAD this matrix was measured at). Only those three SHAs are CI-verified: a green run is **not** evidence for any other commit, and every earlier micro-issue comment that says "no CI run" was written before these dispatches existed. Any commit after `169cd33` in this document is documentation-only and carries no CI run. `gh` 2.103.2 is installed at `C:\Program Files\GitHub CLI\` and authenticated as `bjo163` (keyring, scopes `repo`, `workflow`, `read:org`, `gist`); the machine-wide PATH entry only reaches terminals started after the install, so an already-open shell must call the absolute path.

**Worktree policy for these commands:**

- Read-only: `pnpm typecheck`, `pnpm test`, the focused `tsx --test` commands and `npm test` write no tracked file.
- Build/gate commands: `pnpm check`, `pnpm build`, `pnpm build:sqlite` and `apps/web` `npm run build` regenerate local artifacts. Some are ignored, but `apps/web/public/corpus-catalog.json` is tracked, so run `git status --short` afterwards and never commit regenerated or downloaded output as part of a micro issue.
- A dirty tree stops the workflow: report the changed files instead of stashing, discarding, resetting or committing edits you did not make and understand.

## 3. Issue selection protocol

One small agent sees **one issue at a time**. Start with [P19-L01 #452](https://github.com/bjo163/moonwitness-corpus/issues/452) or any other READY task with satisfied dependencies as listed in the [register](./MOONWITNESS-P19-MICROTASKS.md).

1. Read that exact GitHub Issue, not a vague user brief.
2. Check the parent TODO ID in TODO.md, then follow only required links from Master Grandplan/RFC.
3. Read the named one-to-three files and related tests. Identify current code status; some baseline implementations already exist.
4. List missing acceptance checks. If functionality is already present and tested, do not duplicate it; document evidence or add an edge regression if appropriate.
5. Implement smallest necessary patch. Do not refactor unrelated packages, touch scripture source records, or introduce new frameworks.
6. Run issue's exact focused test, pnpm typecheck and relevant API/web tests. Distinguish tests actually run from intended runs.
7. Check diff and git status; stage only files related to the issue.
8. Atomic commit to **dev**, e.g. fix(p19-l03): reject unresolved source pointers.
9. Push origin dev if allowed; if refused, report the actual protection failure without making a branch.
10. Update GitHub Issue with exact SHA, tests, file scope and remaining gaps, then close only when the specific micro acceptance is met.
11. Only after that fetch latest dev and select a dependent issue. Do not automatically close parent P19-xxx TODO or #446.

No AI model may invent reviewer names, endorsements, licenses, scientific evidence, theological truth or completed pilot scores.

## 4. Absolute data boundaries

**TEXT ≠ CLAIM ≠ INTERPRETATION ≠ FRAMEWORK ≠ JUDGMENT.**

- Corpus v0.1 remains six record types: entity, resource, assertion, evidence, provenance, assessment.
- Derived SRGBL v8 record and message are not scripture.
- P18 semantic Key is a versioned source pointer, not one final meaning.
- Only supported contiguous S1→R2→G3→B4→L5 contributes maturity /15.
- Quality /40, candidate Witness support /100 and framed Key direction −2..+2 are independent measures.
- Missing evidence / license / reviewer stays UNKNOWN, not zero or fake neutral.
- Swing candidate maximum depth 3, no inherited score and independent evidence.
- Quran-anchored Positive Correction is an explicitly chosen Islamic interpretive lens, not a neutral universal verdict.
- Miracle claim is attributed testimony, not mathematically/empirically certified.
- Source text, translation and commentary cannot silently overwrite one another.
- Distinct owner repos for story/event/person avoid duplicate canonical stores; do not ingest private prior-chat text without clearance.

## 5. When the issue is blocked

If rights not cleared: build metadata-only fixture + missing-rights diagnostics, and leave publication pending.

If P18 registry/reviewer approval is missing: code strict validators and tests around *draft/candidate*, but do not mark reviewed.

If real two-annotator data does not exist: implement a validator and use clearly synthetic tests, but do not claim empirical inter-rater agreement.

If branch protection disallows direct dev push: keep the local commit and report branch protection; do not open a PR or make a branch without changing this user policy.

If manual CI is unavailable: report no run rather than using historical green results. The current workflows intentionally use workflow_dispatch only; do not enable push/PR triggers.

If issues are contradictory: favor source integrity, rights, canonical schema and explicit frame; open a short issue comment for methodological ratification instead of silently deciding.

## 6. One-shot prompt for the weakest local coding model

**Copy the paragraph below and replace ISSUE_URL with an actual link #452–#489.**

> Work in repository bjo163/moonwitness-corpus on existing branch dev ONLY. Do not create any branch, PR, or commit to main. Read ISSUE_URL and docs/MOONWITNESS-P19-MICROTASKS.md. Check git status and fetch latest dev without discarding edits. This task has one goal; read only files in its File Scope. First verify whether the expected functionality already exists. Implement only missing acceptance criteria, add one regression test, and run exactly the issue's test command plus pnpm typecheck. Avoid unrelated changes, no new dependencies unless essential, never invent scripture/rights/review. If tests pass and direct dev push is permitted, create one atomic commit referencing the micro ID and push; otherwise stop and report the error. Finish with: changed files, exact test output, SHA (if committed), pass/fail checklist, and next unmet dependency. Never mark all of P19 done just because this issue passed.

## 7. Report template for each completed local micro issue

- **Issue:** number / micro ID / parent P19 task.
- **Baseline:** dev SHA and clean/dirty working tree.
- **Result:** exactly what changed in 1–3 files, or existing implementation already verified.
- **Tests:** actual commands and exits, no invented CI results.
- **Commit:** actual SHA, push status and current dev SHA.
- **Evidence:** fixture, exact source refs or no real source when synthetic.
- **Remaining:** review/rights/validation blockers plus next READY dependent issue.
- **Release:** main untouched; parent P19 checklist unchanged unless full acceptance independently demonstrated.

## 8. Local milestone roadmap

**M0:** documentary and environment baseline, source rights/registry/reviewer decisions recorded.  
**M1:** exact source resolvers, R2 text/translation guards, claim DAG and four independent metrics.  
**M2:** Key messages, Swing candidate evidence and contrary-origin ledger.  
**M3:** typed neutral vs Quran-anchored correlation and OFFSIDE story fixture.  
**M4:** reviewed derived builds, 404/503 API, browser-static export, accessible five-stage UI.  
**M5:** true rights-cleared paired annotation/reviewer pilot, calibration, source QA and separate release decision.

Prior merged work PRs #445, #447, #448, #449 and #450 already established some foundations; local AI must audit before patching. 38 micro issues represent **work packets** rather than claiming all 28 higher-level P19 milestones are pending from zero.

## 9. What makes this handoff complete

- Master Grandplan is on dev and findable from docs/README.md.
- P19 narrative and research blueprint point to each other.
- A machine-readable 38-task manifest and Markdown register with actual GitHub Issues exists.
- Each issue has parent ID, at most three files, test command and explicit acceptance.
- No new branches created during this documentation handoff.
- Source rights, authenticated editorial review and empirical pilot remain open until independently verified.

The first recommended independent ticket is **[#452 / P19-L01](https://github.com/bjo163/moonwitness-corpus/issues/452)**.
