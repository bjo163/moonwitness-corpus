
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

Measured on 2026-10-25 with Node 24.22.1, pnpm 10.33.4, npm 11.19.1, git 2.56.0 on a Windows checkout of `dev`; re-measured at `dev` HEAD `7a97cc9` after the P19-L01..L38 wave, again at `02e25e3` after the P18 contract wave (#425-#428, #441-#443), and again at `2da54b7` after the P18 key-witness export wave (#437-#440, #444), and again at `9b5f63f` after the P18-006 annotation tool (#430), and again at `4ee683d` after the P18-009 Titik Tengah card UI (#433), and again at `f4b13b1` after the P18-010 balance console (#434), and the hardening-wave counts below (428 root tests) were measured after the seal CLI, the console model tests and the release preflight landed. Exit codes below are observed results, not expectations. Re-measure after any dependency or toolchain change; a green historical run is not evidence for a new SHA.

**Root workspace (`pnpm`, monorepo gate):**

| Command | Observed result | Writes to the worktree | Note |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | exit 0 | `node_modules/` only (ignored) | Reports ignored build scripts for `esbuild`, `protobufjs`; do not run `pnpm approve-builds` casually |
| `pnpm typecheck` | exit 0 (`tsc --noEmit`, no output) | none | Root `tsconfig.json` only; `apps/web` is not covered |
| `pnpm test` | exit 0, 428 tests pass, 0 fail | none | Baseline before the P19 micro-issue wave was 295, then 347; the P18 contract wave adds 28 (7 new files x 4 tests), the key-witness wave 8, the annotation-tool wave 5, the P18-011 facet wave 1, and the hardening wave 27 (seal CLI 8, console model 12, release preflight 7). Re-read the count instead of trusting this row |
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
| `pnpm exec tsx --test scripts/key-witness-seal.test.ts` | exit 0, 8 tests pass, 0 fail | none | P18-020 publication: seal from the trusted catalog, a synthetic document may not be written under `dist/` without an override, a written seal verifies and another corpus is refused, a draft message never reaches publication, and `fixtures/key-witness/seal-document.json` is sealed **through the CLI `main()`** and verified again by `--check` |
| `pnpm exec tsx --test apps/web/src/lib/key-witness.test.ts` | exit 0, 12 tests pass, 0 fail | none | The console model behind the screens: nine-field coverage, the `not-computable` profile, disagreement grouping with literal false flags, compare refusals and frame boundaries, spectrum filters and alphabetical order, citation validation, whole-export rejection, and the loader's single-request cache with failure recovery. Runs under the root suite, so `apps/web` needs no second test runner — but it may not import React, because the `check` job has no `apps/web/node_modules` |
| `pnpm exec tsx --test scripts/release-preflight.test.ts` | exit 0, 7 tests pass, 0 fail | none | P8-002..006 readiness: identity, licence, semver, an entry point that exists, the fact that export **keys** are not file targets, and the tarball rules (tests and stray files are counted, "outside dist" only when the manifest is unbounded) |
| `pnpm release:preflight -- --pack` | exit 0 (`0 of 12 packages are publishable as they stand`), plus one measured tarball per package | none | `--pack` runs `npm pack --dry-run --json --ignore-scripts`, so the tarball size and contents are measured rather than assumed; it spawns npm through `node .../npm-cli.js`, because Windows `.cmd` shims are not `execFile`-able |
| `pnpm release:preflight` | exit 0 (`0 of 12 packages are publishable as they stand`) | none | Reads only; `--strict` turns a blocker into a non-zero exit. Run it before any publish attempt |
| `pnpm keys:seal -- --check` | exit 1 while no index exists (`ENOENT dist/key-witness/index.json`) | none | The expected state today: nothing is published, so every key screen shows its blocked card. `--records/--out` seals a real document |
| `pnpm validate:editions` | exit 0, `valid: true`, 618 editions / 297 works / 91 languages | none | Edition registry integrity; named verification command for the P19-L25 rights matrix |
| `pnpm exec tsx --test packages/srgbl/src/research-ledger.test.ts` | exit 0, 5 tests pass, 0 fail | none | Candidate-ledger serialization tasks (P19-L19 / #470) |
| `pnpm exec tsx --test packages/srgbl/src/sources.test.ts` | exit 0, 4 tests pass, 0 fail | none | Selector/rights-scope file introduced by P19-L05 / #456 |
| `pnpm exec tsx --test packages/srgbl/src/swing-chain.test.ts` | exit 0, 8 tests pass, 0 fail | none | Swing candidate/chain tasks |
| `pnpm exec tsx --test scripts/ensure-web-deps.test.ts` | exit 0, 5 tests pass, 0 fail | none | Dev-bootstrap guard: complete install, fresh clone, interrupted `npm ci`, missing `next` package, wrong cwd |
| `pnpm exec tsx --test apps/api/src/api.test.ts` | exit 0, 18 tests pass, 0 fail | none | Run whenever `packages/srgbl` changes reach the Fastify adapter; includes the reviewed-snapshot 200/404/503 fail-closed cases and, since #444, the key-witness 404/503 matrix and its `application/x-ndjson` export |
| `pnpm check` | **not run locally in this session**; passed inside every CI run listed below | SQLite database build output and repository build artifacts (ignored) | Release-grade gate; deliberately not run per micro issue on the laptop because it builds and validates the whole corpus, so it is delegated to the `check` job |
| `pnpm todo:check` | exit 0, `TODO sync metadata valid: 330 tracked roadmap tasks` | none | Read-only audit; see the warning above |

**What a publish would actually ship** (`pnpm release:preflight -- --pack`, one `npm pack --dry-run --json --ignore-scripts` per package; nothing is written and no lifecycle script runs):

| Package | Files | Packed | Unpacked |
|---|---|---|---|
| `@moonwitness/corpus-ingestion` | 84 | 105.6 kB | 512.3 kB |
| `@moonwitness/srgbl` | 44 | 87.8 kB | 351.1 kB |
| `@moonwitness/corpus-validator` | 22 | 20.0 kB | 105.2 kB |
| `@moonwitness/corpus-core` | 25 | 14.9 kB | 59.8 kB |
| `@moonwitness/corpus-node` | 6 | 7.8 kB | 31.7 kB |
| `@moonwitness/corpus-repository` | 6 | 5.1 kB | 21.0 kB |
| `@moonwitness/sdk` | 4 | 3.1 kB | 10.8 kB |
| `@moonwitness/corpus-build` | 3 | 2.9 kB | 9.7 kB |
| `@moonwitness/corpus-cli` | 2 | 2.3 kB | 8.3 kB |
| `@moonwitness/corpus-server` | 4 | 1.3 kB | 3.1 kB |
| `@moonwitness/corpus-schema` | 2 | 415 B | 470 B |
| `@moonwitness/corpus` | 2 | 287 B | 416 B |

Every one of the twelve has no `files` list, so npm falls back to "everything not ignored": `@moonwitness/srgbl` would ship 22 `*.test.ts` files and every source file (351 kB unpacked), `corpus-validator` 12 test files, `corpus-repository` 2. Eleven of the twelve are blocked **only** by the missing licence field; `@moonwitness/corpus-cli` also has no entry point at all, and `@moonwitness/srgbl` is `private`. Adding `files: ["dist"]` is not the fix yet, because no package builds a `dist/` in this repository - it would publish an empty tarball.

**Independent web app (`apps/web`, npm, separate install tree):**

| Command | Observed result | Writes to the worktree | Note |
|---|---|---|---|
| `npm ci` | exit 0, 95 packages added, 0 vulnerabilities | `apps/web/node_modules/` (ignored) | Run automatically by `scripts/ensure-web-deps.mjs` when `pnpm dev` finds the install incomplete; `apps/web` is excluded from the pnpm workspace, so nothing else installs it |
| `npm run typecheck` | exit 0 (`tsc --noEmit`, no output) once route types match the routes | none | A stale gitignored `.next/dev/types/*.ts` makes typecheck fail with errors that point only into generated files; after adding or removing a route run `npx --yes next typegen` first, which is what happened at `f4b13b1` when `/admin/*` was introduced |
| `npm test` | exit 0 (`RGBL web contract smoke: OK`) | none | Contract smoke test, not the application build |
| `npm run build` | exit 0, `next build` (Turbopack) prerendered 13 static routes: `/`, `/_not-found`, `/admin`, `/admin/balance`, `/admin/compare`, `/admin/coverage`, `/admin/disagreement`, `/admin/ledger`, `/admin/profile`, `/admin/spectrum`, `/explorer`, `/research/key-witness`, `/research/srgbl` | `apps/web/.next/`, `apps/web/public/corpus-catalog.json` (tracked, only when missing), `apps/web/public/corpus-db/`, `apps/web/public/vendor/sqlite-httpvfs/` | `/` is a static landing page, the browser corpus app lives at `/explorer` wearing the same MoonWitness brand, and the console has seven sections (ledger, balance, spectrum, disagreement, coverage, compare, profile); measured with the catalog and browser DB already present, so `ensure-catalog.mjs` exited without fetching and `git status --short` stayed clean; a fresh clone still needs network |

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
| [40161848834](https://github.com/bjo163/moonwitness-corpus/actions/runs/40161848834) | `d75c892` | #436 alternate-assessment view with assessor identity, MoonWitness re-skin of the reader app, and the five defects the second browser review found | `success` (both `check` and `web`) |
| [40162696764](https://github.com/bjo163/moonwitness-corpus/actions/runs/40162696764) | `703cbeb` | #437-#439 coverage meter, score-profile readiness, compare-by-key, and the scoped `.gitignore` coverage pattern that had hidden the new route | `success` (both `check` and `web`) |
| [40164201291](https://github.com/bjo163/moonwitness-corpus/actions/runs/40164201291) | `aee2310` | hardening wave: seal CLI, console model tests, release preflight, P19 register reconciliation, and the handoff record | `failure` (`check` only): the new web model test imported a React hook, and the `check` job installs no `apps/web` dependencies |
| [40164841813](https://github.com/bjo163/moonwitness-corpus/actions/runs/40164841813) | `0642617` | fix: extract the React-free export reader, keep the hook thin, point the model test at the reader | `success` (both `check` and `web`) |
| [40166705661](https://github.com/bjo163/moonwitness-corpus/actions/runs/40166705661) | `abbc7da` | seal fixture through the CLI `main()`, `--pack` tarball measurement with its two bug fixes, and the handoff record | `success` (both `check` and `web`) |

A green run is evidence only for its own `headSha`; `9f5014b` has no successful run of its own, and is covered only indirectly by the two later green runs that carry it as an ancestor. `abbc7da` is the last SHA measured here. **A failing run is evidence too:** `40164201291` failed in `check` because `apps/web/src/lib/key-witness.test.ts` imported a module that imports `react`, and the root test glob runs web sources without installing the web app's dependencies; the fix was to split the reader out, not to skip the test or to install `apps/web` in `check`. **A browser review is not a test suite:** the console was opened at `05910da` in a dev server (`npm run dev`, port 5174) and the reviewer found four real defects that every green check above had missed - spectrum filters hidden while the export was blocked, the sign-in form prefilling the shipped `admin` instead of the configured username, the profile keeping the old identity after a credential change, and 10px mobile section labels wrapping. A second pass at `d75c892` found five more: the explorer header hid every navigation link and the source chip below 768px/640px with no replacement, the console's mobile tab renamed "Disagreement" to "Debate", the disagreement screen rendered as an almost empty page when the export was missing, the blocked message was not announced as a status, and the new hairlines were too faint to read. All nine were fixed and re-verified in the same sessions, and none of them would have failed the contract smoke test, because it asserts source strings rather than behaviour.

**What a browser actually showed at `abbc7da`.** The stack was opened with `pnpm dev` (API `:4310`, web `:5174`): `/` rendered the landing page, `/explorer` rendered the MoonWitness shell with live API counts (`538K` records, `17` traditions, `31` visible works), `/admin/ledger` without a session rendered "This desk has no open session" instead of the ledger, and the console's seven-section strip stayed horizontally scrollable at 360px. Authenticated runs of `/admin/ledger`, `/admin/coverage` and `/admin/compare` each landed on an explicit empty state ("No sealed key/message index is published" / "No sealed export is published yet") with the API returning `404 key_witness_not_materialized` and no fabricated rows. **The three ready states - the export download, the "inputs missing" profile figure and the assessor disclosure - cannot be reached in this checkout by design:** the API refuses any index whose passages the repository does not hold, so the synthetic seal fixture is answered with an orphan error rather than served. That is why those three behaviours are proven by the twelve model tests and the contract assertions, and the table's prose is the only evidence for them. Headless captures at 360px are crops, not mobile evidence: Chromium enforces a minimum window width, so sub-500px screenshots show a wider page cut off. Responsive behaviour was checked at exact widths through same-origin iframes instead, and no screenshot is committed here. **The P18 issues above stay open on purpose:** `TODO.md` keeps every P18 checkbox unchecked "so an online AI or human review can correct them before the pilot is ratified", and issue state follows that checkbox, so implementing and testing a task does not authorise ticking it. Ratifying the 20-key vocabulary, the reviewer identity and the pilot traditions remains a human decision (#429-#432 stay blocked on it). `gh` 2.103.2 is installed at `C:\Program Files\GitHub CLI\` and authenticated as `bjo163` (keyring, scopes `repo`, `workflow`, `read:org`, `gist`); the machine-wide PATH entry only reaches terminals started after the install, so an already-open shell must call the absolute path.

**Decisions, not gaps.** Four things look like incomplete work and are not, so do not "fix" them casually:

- the document icon is pinned to the Rocksoul asset release on purpose, and a contract assertion enforces it (`4050b6b5...`); a local `app/icon.svg` was tried and reverted for that reason;
- `NEXT_PUBLIC_RGBL_API_URL` keeps the RGBL name because the environment contract and both docs reference it;
- the `rgbl-theme` storage key keeps its name so no reader's theme choice is reset;
- no webfont is bundled: builds must work offline, so `globals.css` states an explicit system stack instead of Geist-only feature settings that do nothing.

**Dev story.** `pnpm dev` starts the API (`:4310`) and the web app (`:5174`) together. Running `apps/web` alone is supported but leaves every key screen on "The research API could not be reached" and `/explorer` logging connection-refused requests, which is a configuration state, not a bug.

**Blocked, and not by code.** These need a person or credentials, so no amount of local work closes them:

- **Pilot ratification** (#429-#432: the 20-key vocabulary, reviewer identity, pilot traditions). `TODO.md` checkboxes stay unticked and issue state follows the checkbox.
- **Package publication.** No repository licence has been chosen (`LICENSES/README.md`), so the preflight reports `0 of 12` instead of publishing; a licence choice is a human decision, not a default.
- **Registry, release and upstream acquisition.** `config/upstream-executors.json`, `config/upstream-registry.json` and the release scripts need maintainer credentials and an approved release plan; nothing in the hardening wave writes a release or touches an upstream.
- **Brand assets.** The document icon is pinned to the Rocksoul asset release. Copying that SVG into `apps/web/public` requires an asset-licence answer from the design owner (see `docs/design/knowledge-observatory-v2/DESIGN-CONTRACT.md`, "reconcile with upstream `rocksoul-assets` prior to production"), so the local icon stays undone on purpose.
- **Server-side admin authorisation.** The console gate is browser-local and must never become mutation authorization; the design atlas calls for an ADR and RBAC first (its UI-14), and no mutation route exists to protect.

**New design input, not implemented.** `e6771a3` added `docs/design/knowledge-observatory-v2/` (a 20-screen atlas, a design contract and 16 implementation packets) from another contributor. It is design-only: no route, component or data contract from it exists in `apps/web`. Two things to know before treating it as status: its baseline table lists four admin pages (`/admin/ledger`, `/balance`, `/spectrum`, `/profile`) while `dev` now has seven (disagreement, coverage and compare were added after it was written), and its packets are ordered by product priority, not by what the corpus can already prove. Implementing a packet needs the user's direction; the correct first packet (UI-01) is a read-only parity and baseline report, which is what this document already records.

**Worktree policy for these commands:**

- Read-only: `pnpm typecheck`, `pnpm test`, the focused `tsx --test` commands and `npm test` write no tracked file.
- Build/gate commands: `pnpm check`, `pnpm build`, `pnpm build:sqlite` and `apps/web` `npm run build` regenerate local artifacts. Some are ignored, but `apps/web/public/corpus-catalog.json` is tracked, so run `git status --short` afterwards and never commit regenerated or downloaded output as part of a micro issue.
- A dirty tree stops the workflow: report the changed files instead of stashing, discarding, resetting or committing edits you did not make and understand.
- **A new file can be invisible:** `.gitignore` used to contain a bare `coverage/` pattern, so `apps/web/src/app/admin/(console)/coverage/page.tsx` never appeared in `git status` and would have been left out of the commit. The pattern is now root- and package-scoped. When a new path does not show up in `git status`, run `git check-ignore -v <path>` before concluding the file was not written.

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
