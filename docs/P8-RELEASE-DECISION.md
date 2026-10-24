# P8 — npm publication decision record

Snapshot: 2026-10-24. Status: **BLOCKED ON OWNER DECISION**. No package has been published, no scope has been claimed, and `npmPublishEnabled` remains `false`.

## Why publication is blocked

`release/package-contract.json` records two unresolved blockers:

1. A repository-wide code license has not been selected.
2. Ownership and publish permission for the `@moonwitness` npm scope have not been confirmed in this repository.

`LICENSES/README.md` restates the first blocker: no single repository-wide license has been selected. `scripts/publish-npm.ts` enforces both gates — any non-dry-run invocation fails while `npmPublishEnabled` is `false`, and publication requires `NODE_AUTH_TOKEN`. No npm token, scope membership, 2FA policy, or provenance identity is present in the repository.

## Two different pack paths

These must not be conflated:

| Path | Command | Output | Installable? |
| --- | --- | --- | --- |
| raw workspace package | `npm pack --dry-run` inside `packages/*` | TypeScript sources, `workspace:*` deps | **no** |
| release-staged package | `pnpm release:prepare` (`scripts/build-release.ts`) | compiled `dist/*.js` + `*.d.ts` tarballs | shaped correctly, **not yet clean-install tested** |

`scripts/build-release.ts` compiles each package with TypeScript into `dist`, generates a staged manifest with `repository`, `homepage`, `bugs`, `files`, `publishConfig`, `exports`/`types`/`module`/`main`, rewrites `workspace:*` dependencies to exact versions, copies `spec/v0.1` for `includeSpec` packages, points the CLI `bin` at `./dist/cli.js`, and runs `npm pack` from the staged directory. It then writes `release-manifest.json` and `SHA256SUMS`.

Raw workspace manifests still declare raw TypeScript entrypoints (`./src/index.ts`), `bin` at `./src/cli.ts`, and `workspace:*` dependencies, so raw workspace packs are **not** publishable artifacts. Only the staged tarballs are.

## Release bundle evidence (local, 2026-10-24)

Produced by `pnpm release:prepare`; nothing was published.

| Package | Role | Version | Tarball bytes |
| --- | --- | --- | ---: |
| `@moonwitness/corpus-core` | p8-target | 0.1.0 | 11,481 |
| `@moonwitness/corpus-schema` | p8-target | 0.1.0 | 40,918 |
| `@moonwitness/corpus-repository` | p8-target | 0.1.0 | 4,237 |
| `@moonwitness/corpus-node` | support | 0.1.0 | 6,658 |
| `@moonwitness/corpus-ingestion` | support | 0.1.0 | 92,352 |
| `@moonwitness/corpus-validator` | p8-target | 0.1.0 | 14,188 |
| `@moonwitness/corpus-cli` | p8-target | 0.1.0 | 2,665 |

Verified tarball contents: the CLI ships `dist/cli.js` plus declarations with `bin` pointing at it; the schema package ships `dist/index.js` and the full `spec/v0.1` tree; core declares `exports.types/import` to built files.

The bundle also contains `corpus.jsonld` (264,498,482 B), `ro-crate-metadata.json`, `release-manifest.json`, and `SHA256SUMS`.

## Remaining gaps before publication

1. **No `license` field** in any staged manifest; the repository license decision is open.
2. **No clean-install test.** No script installs the packed tarballs into a throwaway project and imports/exercises them. `validate:release` validates consumer-release metadata only.
3. **Scope ownership and publisher policy** for `@moonwitness` are unconfirmed.
4. **Provenance/OIDC**: publication should run from GitHub Actions with npm provenance, not a long-lived local token.
5. **Version and tag policy** for the first public release is undecided.
6. **Node floor**: staged manifests declare `engines.node >= 20` while the repository targets Node 24 LTS. Decide the supported floor deliberately.

## Decisions required from the owner

1. Choose the repository-wide code license and add a matching `license` field to every staged package.
2. Confirm ownership of the `@moonwitness` npm scope and who may publish to it.
3. Define publisher identity, 2FA enforcement, and the token/secret policy.
4. Approve the build contract now implemented (JavaScript + declarations, `files` allowlist, `exports` to built output, executable CLI bin) or amend it.
5. Approve version and release-tag policy for the first public release.
6. Publish from GitHub Actions with npm provenance (OIDC), not from a local long-lived token.
7. Decide whether a clean-install smoke test is a hard gate before the first publish.

## Explicitly not done

- no npm login, token creation, scope claim, or package publication;
- no GitHub Release or new release tag;
- no change to `release/package-contract.json`;
- no dataset, schema, or research-status mutation.

## Unblock sequence (only after written authorization)

1. Land the license field and any build-contract amendments in reviewed PRs.
2. Re-run `pnpm check`, `pnpm release:changelog:check`, and `pnpm release:prepare`.
3. Install each tarball in a clean temporary project and exercise the CLI and public exports.
4. Flip `npmPublishEnabled` in a dedicated PR with explicit owner approval.
5. Publish through the release workflow with provenance, then verify registry metadata and install.

Tracking issues P8-002 through P8-006 ([#92](https://github.com/bjo163/moonwitness-corpus/issues/92) through [#96](https://github.com/bjo163/moonwitness-corpus/issues/96)) stay **open** until packages are actually installable from the registry.
