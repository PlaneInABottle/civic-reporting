# DeepSeek V4 Flash — Phase 1 dependency-audit integrity confirmation

Verified the current worktree read-only: the workspace overrides, lockfile resolution, updated evidence, and disposition ledger.

# Phase 1 Dependency-Audit Integrity Confirmation

## What the remediation does (verified)

`pnpm-workspace.yaml:5-7` adds workspace overrides `postcss: 8.5.25` and `sharp: 0.35.3`. The lockfile confirms they are **effective and complete**:

- **Single PostCSS resolution:** only `postcss@8.5.25` exists in the tree (`pnpm-lock.yaml:2395,5281`), consumed by `next@16.2.12` (`:5094`), `@tailwindcss/postcss@4.3.3` (`:3543`), and `vite@8.2.0` (`:5790`). No `postcss@8.5.6` remains anywhere — the audited version is fully displaced, and the override actually unifies the build chain on one PostCSS (a supply-chain positive).
- **Single Sharp resolution:** `sharp@0.35.3(@types/node@24.10.1)` (`:5461`) with the internally consistent platform matrix `@img/sharp-*@0.35.3` + `@img/sharp-libvips@1.3.2`; it enters only as Next's optional dependency (`:5108`).
- **`allowBuilds` (`pnpm-workspace.yaml:9-13`) includes `sharp: true`**, which is required for sharp's native install scripts and consistent with the pin.
- **Evidence updated** (`docs/implementation/phase-1.md:21,33-40,65-66,94-108`): audit RED (4 findings, 1 moderate/3 high in Next-transitive Sharp/PostCSS) → GREEN (patched overrides, `pnpm audit --prod --audit-level high` pass); 19 unit/component tests, build pass (11 static pages/10 routes), 24 e2e tests including the nine-route full-rule axe matrix; closure review records READY with no Critical/High/Medium.

## Severity-ranked findings

**M9 — Medium: manifest and lockfile disagree on the PostCSS pin.**
`apps/web/package.json:37` still declares `"postcss": "8.5.6"` while the lockfile importer records `specifier: 8.5.25 / version: 8.5.25` (`pnpm-lock.yaml:82-84`) and the tree resolves 8.5.25. The installed/effective version is correct (8.5.25 via override), but the committed manifest no longer matches the committed lockfile.
_Impact:_ (a) a `pnpm install --frozen-lockfile` CI gate can fail as out-of-sync; (b) the security posture is correct today but fragile — if the override is later removed, the manifest would silently revert to the audited 8.5.6. This is the one defect in the remediation itself.
_Fix:_ set `apps/web/package.json:37` to `"8.5.25"` and confirm the lockfile importer spec, override, and resolved version all agree before the baseline commit.

**L11 — Low: audit evidence is scoped to `--prod`.** `docs/implementation/phase-1.md:39` records `pnpm audit --prod --audit-level high`. The devDependency tree (vitest/vite/eslint/@playwright) is outside that gate. Recommend a full `pnpm audit` (no `--prod`) at commit for completeness; not a blocker.

**L12 — Low (informational): sharp is pinned but unused in Phase 1.** It enters only as Next's optional dependency (`pnpm-lock.yaml:5108`); Phase 1 has no image path, so it is installed-but-unused. The pin is correct — it prevents the audited transitive version from returning in Phase 3+ — and no action is needed.

**L13 — Low (doc completeness): the audit RED/GREEN is recorded in `phase-1.md:21,38-40` but has no row in the disposition ledger** (`.hermes/reviews/phase-1-disposition.md` tracks M1–M8, R1, L8–L10). Add a dependency-audit row for ledger completeness.

## Supply-chain / build / test risk summary

- **No new vulnerabilities introduced**; remediation direction (patched override for a build-chain transitive) is correct and standard.
- **Deterministic today** (single postcss/sharp resolutions; committed lockfile records the overrides at `pnpm-lock.yaml:7-9`); the only reproducibility exposure is M9.
- **Build/test regression risk: none evidenced** — build, 24 e2e, and axe matrix pass per the updated evidence; PostCSS 8.5.x is semver-compatible with the Tailwind/Vite/Next consumers.
- Prior review notes (L9 stale evidence, L10 optional selectors) are resolved or soundly rejected in the disposition ledger.

## Commit-suitability verdict

**Still READY for the baseline commit — the dependency-audit remediation does not alter the prior verdict; it strengthens it.** One Medium (M9) is a one-line manifest reconciliation (`postcss` → `8.5.25`) that should be applied and the lockfile confirmed in sync before committing, plus the two Low notes (full non-`--prod` audit, disposition ledger row). M5/M6/L3 remain honest Phase 2/launch blockers; synthetic-pilot and blocked-launch boundaries are intact. No Phase 2 implementation is requested or reviewed.
