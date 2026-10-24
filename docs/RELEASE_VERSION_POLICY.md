# Release Version and Changelog Policy

This policy separates the three version domains and defines the only supported way to change
them. It implements the [#400 / FIX-005](https://github.com/bjo163/moonwitness-corpus/issues/400)
release contract without introducing hourly automatic bumps.

## Version domains

| Domain | Owner | Bump input | Notes |
|---|---|---|---|
| Spec version | `spec/` and `packages/schema` | Separate spec change process | Release plans cannot modify it. |
| Package version | Each `packages/*/package.json` named in `release/package-contract.json` | `packages` object in a release change plan | Only `@moonwitness/*` public contract packages. |
| Dataset version | The dataset manifest under `datasets/<id>/` | Dataset/source change process | Release plans cannot modify it. |
| Aggregate corpus release | `release/corpus-release.json` | `corpusRelease` in a release change plan | Identifies the consumer bundle, not every package. |

## Change plans

A release is driven by a checked-in JSON change plan in `release/changes/`:

```json
{
  "format": "moonwitness-release-change-v1",
  "summary": "Describe the public change in one sentence.",
  "packages": { "@moonwitness/corpus-core": "patch" },
  "corpusRelease": "patch"
}
```

Rules:

- `summary` is required and is rendered into the human-readable changelog.
- Allowed bumps are exactly `patch`, `minor`, and `major`.
- Empty plans are valid no-ops: they change no version.
- Invalid plans fail before any version file is written or the plan is consumed.
- Applying a plan moves it to `release/changes/applied/`; replaying the same path cannot bump twice.

Apply with:

```bash
pnpm release:version release/changes/<plan>.json
pnpm release:changelog
```

## Changelog

`CHANGELOG.md` is generated deterministically from the pending and applied plans plus the current
aggregate corpus version:

```bash
pnpm release:changelog         # regenerate
pnpm release:changelog:check   # fail closed when stale
```

The release candidate workflow runs the check before building, and `build:release` /
`validate:release` run it as a gate. The generated file contains no timestamps or environment
data, so the same commit always produces byte-identical output.

## No-op and failure behavior

- Unchanged source or an empty plan set: no package or corpus version change.
- Invalid plan or failed validator: the command fails before writing versions or consuming the plan.
- Duplicate invocation: the consumed plan is gone, so a second call cannot bump again.
- Same source + lockfile + plan: `pnpm release:verify` rebuilds twice and requires identical hashes.
- Failed promotion: the release workflow has no push/tag/publish step; protected `main`/`dev`
  require a PR and exact-head `check`/`web` contexts.

## Promotion and publication

1. Land the change and its plan/changelog through a PR into `dev`.
2. Run `pnpm check` and the exact-head release candidate workflow.
3. Promote `dev` to `main` through a PR; do not push directly.
4. npm publication remains disabled in `release/package-contract.json` until scope/license approval.
5. Browser database publication is a separate manual dispatch with `publish=true`; it reuses a
   content-addressed tag and checks for an existing release before creating one.

Rollback remains governed by [CORPUS_RELEASE_SAFETY_GATE.md](CORPUS_RELEASE_SAFETY_GATE.md):
immutable tags, no retag, previous tag plus `SHA256SUMS`, npm deprecation instead of deletion.
