# Corpus Release Safety Gate — Interim Policy

> Implementation tracking: [#400 / FIX-005](https://github.com/bjo163/moonwitness-corpus/issues/400). This policy deliberately fails closed while the source corpus and branch histories are not verified.

## Current temporary gate

The `dev` workflow `.github/workflows/release.yml` has been changed from "Aggressive Release" to **Release Candidate Verification (No Promotion)**. It runs only on explicit dispatch and may only create **unpublished, temporary CI artifacts**. It uses `contents: read`, checks out the candidate commit without persistent credentials, installs using `pnpm install --frozen-lockfile`, runs `pnpm build:release` and checks release determinism via `pnpm release:verify`.

The release workflow must never issue `git push origin HEAD:dev`, `git push origin ...:main`, `git push --force`, `git tag`, an npm publish, or GitHub Release creation while this interim gate is in force.

Browser database publication is also opt-in: `.github/workflows/publish-browser-db.yml` only verifies and archives a candidate on dispatch, and creates/updates the versioned GitHub Release only when the `publish` input is `true`. `.github/workflows/generate-web-catalog.yml` verifies that the committed catalog is current and never commits or pushes to `main` or `dev`.

## Version policy and changelog

[`docs/RELEASE_VERSION_POLICY.md`](RELEASE_VERSION_POLICY.md) defines the spec/package/dataset/corpus version domains and the change-plan workflow. `CHANGELOG.md` is generated deterministically from `release/changes/` by `pnpm release:changelog`; the release candidate, `build:release`, and `validate:release` fail closed when it is stale via `pnpm release:changelog:check`. Regression coverage for no-op, invalid-plan, duplicate-application, deterministic changelog, read-only release verification and opt-in publication lives in `scripts/release-gates.test.ts`.

## Rollback

- Published tags (`corpus-v*`, `browser-db-*`) are immutable; never retarget or force-update them.
- To roll back a consumer, pin the previous immutable tag plus its `SHA256SUMS` and manifest digest; do not reuse a version for different bytes.
- If a candidate is bad **before** publication, discard the CI artifact; the already-published version remains authoritative.
- npm publication cannot be deleted safely; a bad npm release requires a new patch version and a deprecation notice, never a retag.

## Requirements before enabling real automatic releases

- **Inputs:** accepted, reviewed change plan (SemVer impact), immutable `dev` source SHA, pinned `pnpm-lock.yaml`, explicit spec/package/dataset/corpus version policy, verified source bytes and rights.
- **Pre-flight:** clean, non-stale head; ancestor/integration conflict check against `main`; provenance-accurate schema and dataset validation; deterministic materialization; typecheck/test/API smoke and web build once web code is reconciled.
- **Build:** no dynamic timestamp-based patch bump per hourly schedule; same source + input lock + plan yields same version, changelog, checksum manifest and bundle hash.
- **Dry run:** `pnpm build:release`, `pnpm release:verify`, and consumer/release contract verification must pass on one exact candidate SHA.
- **Approval:** maintainers review the conflict matrix and PR #360; protected `main` requires exact-head checks and approved promotion route. A red or missing check blocks the release, not merely records a warning.
- **Publication:** GitHub Release and npm publication are separate opt-in steps, never implied by a valid local bundle. Record tags, immutable version, checksums, rights and rollback instructions.
- **No-op / failure:** unchanged source, schema failure, duplicate invocation, unverified rights, ambiguous Renouf headings, unknown branch relationship and GitHub token errors must cause zero version bump, zero `main` changes and no partial publication.

## Evidence state

At the time of writing, materialization and CI checks had not produced green exact-head evidence and `main` remained diverged from `dev`. **No production release is approved.** Historical failed actions are not proof the current candidate passes or fails; revalidate actual run head SHA.

Local Node 24 verification on 2026-10-24 (pre-promotion work branch):

- `pnpm release:verify` rebuilt the bundle twice and reported `Release bundle is byte-deterministic across two builds.` (`0.1.0`, 7 npm tarballs, 49 datasets).
- `pnpm release:publish:dry-run` listed all 7 packages and published nothing.
- `release/package-contract.json` keeps `npmPublishEnabled: false`; `pnpm release:publish` fails closed without an explicit gate change.
- `pnpm check` passed (234 tests, corpus validation, build) and the three materializers were rerun with unchanged dataset hashes.

Related: [#395](https://github.com/bjo163/moonwitness-corpus/issues/395) corpus integrity, [#399](https://github.com/bjo163/moonwitness-corpus/issues/399) merge inventory, [#398](https://github.com/bjo163/moonwitness-corpus/issues/398) branch protections, [#397](https://github.com/bjo163/moonwitness-corpus/issues/397) CI.
