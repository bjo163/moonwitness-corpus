
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

To run both dev servers (`pnpm dev` = Fastify API on port 4310, Next.js on port 5174):

    pnpm dev

`pnpm dev` needs the independent web install above. `apps/web` is excluded from the pnpm workspace (`!apps/web` in `pnpm-workspace.yaml`), so `pnpm install` never provides `next`. `npm ci` deletes `node_modules` before it installs, so an interrupted install leaves a directory tree that exists but has no `next` binary, which surfaced only as:

    [web] 'next' is not recognized as an internal or external command,
    [web] ELIFECYCLE  Command failed with exit code 1.

`pnpm dev:web` now runs `scripts/ensure-web-deps.mjs` first. It checks `node_modules/.package-lock.json`, `node_modules/next/package.json` and the `node_modules/.bin/next` shim; if any is missing it prints the reason and runs `npm ci` inside `apps/web` itself, then re-checks. A fresh clone therefore starts with `pnpm dev` alone. Use `node scripts/ensure-web-deps.mjs --check` to report without touching the filesystem.

Relevant small-test example:

    pnpm exec tsx --test packages/srgbl/src/analysis.test.ts

For TODO audit (read only):

    pnpm todo:check

Do not execute pnpm todo:sync indiscriminately: the repository issue-sync contract and canonical P18/P19 TODO markers must be preserved.

## 2.1 Measured command matrix (baseline P19-L01 / #452)

Measured on 2026-10-25 with Node 24.22.1, pnpm 10.33.4, npm 11.19.1, git 2.56.0 on a Windows checkout of `dev`; re-measured at `dev` HEAD `7a97cc9` after the P19-L01..L38 wave, again at `02e25e3` after the P18 contract wave (#425-#428, #441-#443), and again at `2da54b7` after the P18 key-witness export wave (#437-#440, #444), and again at `9b5f63f` after the P18-006 annotation tool (#430), and again at `4ee683d` after the P18-009 Titik Tengah card UI (#433), and again at `f4b13b1` after the P18-010 balance console (#434). Exit codes below are observed results, not expectations. Re-measure after any dependency or toolchain change; a green historical run is not evidence for a new SHA.

**Root workspace (`pnpm`, monorepo gate):**

| Command | Observed result | Writes to the worktree | Note |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | exit 0 | `node_modules/` only (ignored) | Reports ignored build scripts for `esbuild`, `protobufjs`; do not run `pnpm approve-builds` casually |
| `pnpm typecheck` | exit 0 (`tsc --noEmit`, no output) | none | Root `tsconfig.json` only; `apps/web` is not covered |
| `pnpm test` | exit 0, 401 tests pass, 0 fail | none | Baseline before the P19 micro-issue wave was 295, then 347; the P18 contract wave adds 28 more (7 new files x 4 tests), the key-witness wave adds 8 (5 index/export tests plus 3 API subtests), the annotation-tool wave adds 5, and the P18-011 facet wave adds 1 (key facets travel with the citation). Re-read the count instead of trusting this row |
| `pnpm exec tsx --test packages/srgbl/src/index.test.ts` | exit 0, 14 tests pass, 0 fail | none | SRGBL core: maturity, quality rubric, direction, Witness /100, Swing candidate, cross-text relation, lens selection, correction counterreadings |
| `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts` | exit 0, 23 tests pass, 0 fail | none | Default focused command for SRGBL analysis tasks, and the owner of the Quran research-case fixture and rights-matrix regressions |
| `pnpm exec tsx --test packages/srgbl/src/publication.test.ts` | exit 0, 9 tests pass, 0 fail | none | Reviewed-snapshot seal, projection structure, stage order and the 15-case adversarial matrix (P19-L26/L27/L37) |
| `pnpm exec tsx --test packages/srgbl/src/static.test.ts` | exit 0, 3 tests pass, 0 fail | none | Browser/static export: deterministic passage order, explicit unavailable state, no research-only field (P19-L29) |
| `pnpm exec tsx --test packages/srgbl/src/annotation.test.ts` | exit 0, 3 tests pass, 0 fail | none | Paired annotation intake: distinct assessors, retained submissions, no adjudication field (P19-L35) |
| `pnpm exec tsx --test packages/srgbl/src/agreement.test.ts` | exit 0, 4 tests pass, 0 fail | none | Kappa only from comparable pairs; `estimable:false` and `blocked-pilot-input` on synthetic input (P19-L36) |
| `pnpm exec tsx --test packages/srgbl/src/key-registry.test.ts` | exit 0, 4 tests pass, 0 fail | none | P18-001 / #425: 20 candidate keys with neutral `en`/`id` definitions, examples, exclusions; `validateKeyRegistry()` refuses a dropped, duplicated, blank, copied or adjudicating entry |
| `pnpm exec tsx --test packages/srgbl/src/vocabulary.test.ts` | exit 0, 4 tests pass, 0 fail | none | P18-002 / #426: one declaration point for frame/relation/direction/intensity/review-status; closes the gap where `reviewStatus:'approved'` validated cleanly |
| `pnpm exec tsx --test packages/srgbl/src/assessment-extension.test.ts` | exit 0, 4 tests pass, 0 fail | none | P18-003 / #427: key assessment as an `assessment` @ `textual@0.1` extension; rejects undeclared fields; drift guard against `packages/schema` |
| `pnpm exec tsx --test packages/srgbl/src/message-contract.test.ts` | exit 0, 4 tests pass, 0 fail | none | P18-004 / #428: derived message provenance with `textIsOriginalScripture:false` literal; boundary and context notes may not restate the message |
| `pnpm exec tsx --test packages/srgbl/src/review-workflow.test.ts` | exit 0, 4 tests pass, 0 fail | none | P18-017 / #441: replayable audit chain, `deprecated` terminal, no automated reviewer, claimed status must match history |
| `pnpm exec tsx --test packages/srgbl/src/annotation-provenance.test.ts` | exit 0, 4 tests pass, 0 fail | none | P18-018 / #442: assessor + method + time + evidence bound to a submission; `attestsIndependence:false`, no verdict field |
| `pnpm exec tsx --test packages/srgbl/src/licensing.test.ts` | exit 0, 4 tests pass, 0 fail | none | P18-019 / #443: text licence and annotation licence decided independently; quoting restricted text withholds both; `PUBLIC_DOMAIN_INFERENCE:'prohibited'` |
| `pnpm exec tsx --test packages/srgbl/src/key-witness.test.ts` | exit 0, 6 tests pass, 0 fail | none | P18-020 / #444 plus P18-011 / #435: sealed `mw:key-witness-index:v0`, deterministic `mw:citation:v0` JSONL with a manifest, re-seal verification, refused restricted text and refused extra score field, and annotation facets that travel only when recorded (an out-of-range direction, undeclared relation or partial frame is refused); Parquet reported as `not-implemented` |
| `pnpm exec tsx --test packages/srgbl/src/annotation-tool.test.ts` | exit 0, 5 tests pass, 0 fail | none | P18-006 / #430: draft-only annotation record with `reviewStatus:'draft'` and both attestation literals false, append-only ledger that refuses duplicates and damaged history, per-line `recordSha256`, and a pair view with `adjudicated:false, agreementComputed:false` |
| `pnpm validate:editions` | exit 0, `valid: true`, 618 editions / 297 works / 91 languages | none | Edition registry integrity; named verification command for the P19-L25 rights matrix |
| `pnpm exec tsx --test packages/srgbl/src/research-ledger.test.ts` | exit 0, 5 tests pass, 0 fail | none | Candidate-ledger serialization tasks (P19-L19 / #470) |
| `pnpm exec tsx --test packages/srgbl/src/sources.test.ts` | exit 0, 4 tests pass, 0 fail | none | Selector/rights-scope file introduced by P19-L05 / #456 |
| `pnpm exec tsx --test packages/srgbl/src/swing-chain.test.ts` | exit 0, 8 tests pass, 0 fail | none | Swing candidate/chain tasks |
| `pnpm exec tsx --test scripts/ensure-web-deps.test.ts` | exit 0, 5 tests pass, 0 fail | none | Dev-bootstrap guard: complete install, fresh clone, interrupted `npm ci`, missing `next` package, wrong cwd |
| `pnpm exec tsx --test apps/api/src/api.test.ts` | exit 0, 18 tests pass, 0 fail | none | Run whenever `packages/srgbl` changes reach the Fastify adapter; includes the reviewed-snapshot 200/404/503 fail-closed cases and, since #444, the key-witness 404/503 matrix and its `application/x-ndjson` export |
| `pnpm check` | **not run locally in this session**; passed inside every CI run listed below | SQLite database build output and repository build artifacts (ignored) | Release-grade gate; deliberately not run per micro issue on the laptop because it builds and validates the whole corpus, so it is delegated to the `check` job |
| `pnpm todo:check` | exit 0, `TODO sync metadata valid: 330 tracked roadmap tasks` | none | Read-only audit; see the warning above |

**Independent web app (`apps/web`, npm, separate install tree):**

| Command | Observed result | Writes to the worktree | Note |
|---|---|---|---|
| `npm ci` | exit 0, 95 packages added, 0 vulnerabilities | `apps/web/node_modules/` (ignored) | Run automatically by `scripts/ensure-web-deps.mjs` when `pnpm dev` finds the install incomplete; `apps/web` is excluded from the pnpm workspace, so nothing else installs it |
| `npm run typecheck` | exit 0 (`tsc --noEmit`, no output) once route types match the routes | none | A stale gitignored `.next/dev/types/*.ts` makes typecheck fail with errors that point only into generated files; after adding or removing a route run `npx --yes next typegen` first, which is what happened at `f4b13b1` when `/admin/*` was introduced |
| `npm test` | exit 0 (`RGBL web contract smoke: OK`) | none | Contract smoke test, not the application build |
| `npm run build` | exit 0, `next build` (Turbopack) prerendered 10 static routes: `/`, `/_not-found`, `/admin`, `/admin/balance`, `/admin/ledger`, `/admin/profile`, `/admin/spectrum`, `/explorer`, `/research/key-witness`, `/research/srgbl` | `apps/web/.next/`, `apps/web/public/corpus-catalog.json` (tracked, only when missing), `apps/web/public/corpus-db/`, `apps/web/public/vendor/sqlite-httpvfs/` | `/` is now a static landing page and the browser corpus app moved to `/explorer`; measured with the catalog and browser DB already present, so `ensure-catalog.mjs` exited without fetching and `git status --short` stayed clean; a fresh clone still needs network |

**Manual CI:** `.github/workflows/ci.yml` triggers on `workflow_dispatch` only, and uses `concurrency` with `cancel-in-progress: true` - **dispatching a new run cancels the run in flight for the same ref**, which happened once here and is recorded rather than hidden. Its `check` job runs install, `node --test scripts/workflow-safety.test.mjs`, `pnpm check` and a Fastify smoke (`/v1/health`, `/metrics`, `/v1/traditions`, `/v1/search`); its `web` job runs `node scripts/export-web-catalog.mjs --check`, web `npm ci` / `typecheck` / `test`, the browser-search-DB build and `npm run build`.

| Run | SHA | Commit | Conclusion |
|---|---|---|---|
| [40144091349](https://github.com/bjo163/moonwitness-corpus/actions/runs/40144091349) | `cf313c6` | P19-L17 wave | `success` |
| [40144490214](https://github.com/bjo163/moonwitness-corpus/actions/runs/40144490214) | `0ea9659` | #470 candidate ledger | `success` |
| [40144755987](https://github.com/bjo163/moonwitness-corpus/actions/runs/40144755987) | `169cd33` | #471 relation sources | `success` |
| [40145370729](https://github.com/bjo163/moonwitness-corpus/actions/runs/40145370729) | `e8fbfcf` | #472 lens selector | `success` |
| [40145630278](https://github.com/bjo163/moonwitness-corpus/actions/runs/40145630278) | `843d817` | `pnpm dev` self-heal | `success` |
| [40145863686](https://github.com/bjo163/moonwitness-corpus/actions/runs/40145863686) | `9f5014b` | #473 corrections | `cancelled` by the next dispatch |
| [40146001337](https://github.com/bjo163/moonwitness-corpus/actions/runs/40146001337) | `b0448f2` | #474 miracle attribution | `success` |
| [40146199184](https://github.com/bjo163/moonwitness-corpus/actions/runs/40146199184) | `be1120d` | #475 rights-safe fixture | `success` |
| [40147222934](https://github.com/bjo163/moonwitness-corpus/actions/runs/40147222934) | `8a30f2d` | #476-#479 rights matrix, seals, projection structure, API fail-closed | `success` (both `check` and `web`) |
| [40148296655](https://github.com/bjo163/moonwitness-corpus/actions/runs/40148296655) | `7a97cc9` | #480-#489 static export, five-tab status, message/Swing/lens panels, keyboard+RTL contract, annotation intake, agreement, adversarial matrix, release decision record | `success` (both `check` and `web`) |
| [40149634769](https://github.com/bjo163/moonwitness-corpus/actions/runs/40149634769) | `0e5a0dc` | #425 20-key v0 registry with `en`/`id` definitions | `success` (both `check` and `web`) |
| [40152033194](https://github.com/bjo163/moonwitness-corpus/actions/runs/40152033194) | `b89589f` | #426-#428 controlled vocabulary, assessment extension, derived message contract | `success` (both `check` and `web`) |
| [40153504300](https://github.com/bjo163/moonwitness-corpus/actions/runs/40153504300) | `02e25e3` | #441-#443 review workflow chain, annotation provenance, text/annotation licence split | `success` (both `check` and `web`) |
| [40156090170](https://github.com/bjo163/moonwitness-corpus/actions/runs/40156090170) | `2da54b7` | #437-#440 coverage, score profile, citation export and #444 sealed key-witness index plus read-only endpoints | `success` (both `check` and `web`) |
| [40156594246](https://github.com/bjo163/moonwitness-corpus/actions/runs/40156594246) | `9b5f63f` | #430 draft annotation record, append-only ledger and the `pnpm keys:annotate` CLI | `success` (both `check` and `web`) |
| [40157636034](https://github.com/bjo163/moonwitness-corpus/actions/runs/40157636034) | `4ee683d` | #433 Titik Tengah card UI plus its fail-closed contract assertions | `success` (both `check` and `web`) |
| [40158333662](https://github.com/bjo163/moonwitness-corpus/actions/runs/40158333662) | `f4b13b1` | #434 shared citation contract, admin console, balance and ledger screens | `success` (both `check` and `web`) |
| [40160883459](https://github.com/bjo163/moonwitness-corpus/actions/runs/40160883459) | `05910da` | #435 facet-carrying citations, key-spectrum search, static landing page at `/` with the browser app moved to `/explorer`, and the console fixes found by the browser review | `success` (both `check` and `web`) |

A green run is evidence only for its own `headSha`; `9f5014b` has no successful run of its own, and is covered only indirectly by the two later green runs that carry it as an ancestor. `d238ae6` is the last SHA measured here and `05910da` is the last code change. **A browser review is not a test suite:** the console was opened at `05910da` in a dev server (`npm run dev`, port 5174) and the reviewer found four real defects that every green check above had missed - spectrum filters hidden while the export was blocked, the sign-in form prefilling the shipped `admin` instead of the configured username, the profile keeping the old identity after a credential change, and 10px mobile section labels wrapping. All four were fixed and re-verified in the same session, and none of them would have failed the contract smoke test, because it asserts source strings rather than behaviour. **The P18 issues above stay open on purpose:** `TODO.md` keeps every P18 checkbox unchecked "so an online AI or human review can correct them before the pilot is ratified", and issue state follows that checkbox, so implementing and testing a task does not authorise ticking it. Ratifying the 20-key vocabulary, the reviewer identity and the pilot traditions remains a human decision (#429-#432 stay blocked on it). `gh` 2.103.2 is installed at `C:\Program Files\GitHub CLI\` and authenticated as `bjo163` (keyring, scopes `repo`, `workflow`, `read:org`, `gist`); the machine-wide PATH entry only reaches terminals started after the install, so an already-open shell must call the absolute path.

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
