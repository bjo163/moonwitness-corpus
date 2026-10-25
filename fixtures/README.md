# Fixtures

Cross-package test fixtures belong here. Canonical example datasets live under `datasets/examples/`.

## `key-witness/seal-document.json`

The input format of `pnpm keys:seal`, exercised end to end by
`scripts/key-witness-seal.test.ts`: the CLI seals it, writes an index, and verifies
that index against a catalog. It is `"synthetic": true` and every id contains
`fixture`, because the CLI must refuse to write a synthetic document into
`dist/key-witness/index.json` — that path is what the API serves as published
research. Do not flip the flag on this file; write a real document instead.

Nothing in the fixture is scripture, a translation, a reviewed reading or a granted
right. `textRights` is `restricted` and the annotation licence is an example id.
