# Corpus Release Safety Gate — Interim Policy

> Implementation tracking: [#400 / FIX-005](https://github.com/bjo163/moonwitness-corpus/issues/400). This policy deliberately fails closed while the source corpus and branch histories are not verified.

## Current temporary gate

The `dev` workflow `.github/workflows/release.yml` has been changed from "Aggressive Release" to **Release Candidate Verification (No Promotion)**. It runs on explicit dispatch or limited release-file changes and may only create **unpublished, temporary CI artifacts**. It uses `contents: read`, checks out the candidate commit without persistent credentials, installs using `pnpm install --frozen-lockfile`, runs `pnpm build:release` and checks release determinism via `pnpm release:verify`.

The release workflow must never issue `git push origin HEAD:dev`, `git push origin ...:main`, `git push --force`, `git tag`, an npm publish, or GitHub Release creation while this interim gate is in force.

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

Related: [#395](https://github.com/bjo163/moonwitness-corpus/issues/395) corpus integrity, [#399](https://github.com/bjo163/moonwitness-corpus/issues/399) merge inventory, [#398](https://github.com/bjo163/moonwitness-corpus/issues/398) branch protections, [#397](https://github.com/bjo163/moonwitness-corpus/issues/397) CI.
