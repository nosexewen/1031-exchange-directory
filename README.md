# 1031 Exchange & Cost Segregation GEO Directory

## Remote-only
Read AGENTS.md before any work. Do not run any commands, npm installs, Python, builds, tests, scrapers or servers locally. All commands below belong on remote runners or in the Cloudflare Pages build configuration.

## Initial commit
The delivered bootstrap workflow is self-contained. Add it via GitHub's web editor as .github/workflows/bootstrap-directory.yml in an existing repository that you own. Add an Actions secret DIRECTORY_BOOTSTRAP_TOKEN containing a classic PAT with repo and workflow scopes. A token capable of creating a repository and pushing workflow files is required; the source repository GITHUB_TOKEN is not sufficient. Run it once from Actions. The workflow creates a NEW PRIVATE repository under the authenticated token owner's account, generates site/package-lock.json remotely, validates schemas and the Astro build, then pushes main. It refuses to overwrite an existing target. After completion remove the bootstrap secret and workflow from the source repo.

The initial baseline is 3 states, 5 QI candidates and 3 cost-seg candidates. Raw evidence records and normalized output are both version controlled. Pipeline normalization is deterministic; no live extraction is implemented.

## Cloudflare Pages
1. Connect the new repository in Cloudflare Pages with production branch main.
2. Root directory: site. Framework: Astro. Build command: npm ci && npm run check && npm run build. Output: dist. Node version: 20 (NODE_VERSION=20).
3. Set PUBLIC_SITE_URL to the final canonical HTTPS URL in Pages AND the GitHub repository Actions variable. The Actions fallback URL is only for verification, not an assertion of a deployment.
4. Leave build watch paths inclusive of data/**, site/** and pipeline/** so data-only commits can trigger Pages builds. Pages Functions live in site/functions and are deployed alongside the static output.
5. Check Pages deployment logs for every production build. GitHub CI verifies separately; linking Pages does not automatically make GitHub checks a production gate. Use preview-only integration and a manual production promotion or required checks before merging to main when a hard gate is needed.

## Intake activation
Intake fails closed unless configured. In Pages bind a private KV namespace as LEADS. Set secret TURNSTILE_SECRET_KEY and environment PRIVACY_CONTACT. Set public build variables PUBLIC_TURNSTILE_SITE_KEY and PUBLIC_PRIVACY_CONTACT to the matching site key and operator identity/deletion contact. Configure Turnstile to allow the actual production hostname. Disable intake in previews unless each preview hostname and private preview storage are deliberately configured. Never expose the secret as a PUBLIC variable.

Requests are saved with a 30-day TTL. View/manage through authenticated Cloudflare administration; this starter includes no public lead-list API, email sending or provider forwarding. Confirmation states only that a request was saved. Provider outreach requires later authorization.

## GitHub Actions
- data-pipeline.yml: manual or Monday 03:17 UTC; Python 3.11; validate and normalize raw records; stage only data/normalized; commit to main when changed.
- site-ci.yml: pushes/PRs/manual plus completed normalization runs; Node 20; npm ci, contract parity, calculator tests, npm run check, npm run build.
- GITHUB_TOKEN bot commits do not trigger another push workflow; workflow_run performs site verification against main after normalization. Cloudflare external build triggering should be confirmed on the connected integration. Branch protection may require a narrowly scoped bot exception; do not silently bypass it.
- schema contract fixtures compare required fields and representative accepted/rejected values. They are not a proof of equivalence for every possible JSON input.

## Schema and data
Pydantic v2 schemas live in pipeline/models.py. Zod definitions live directly in site/src/content/config.ts and validate Astro data collections. A remote precheck/prebuild step copies normalized JSON into generated Astro collections; generated copies are ignored. Update both schemas together.

Provider fee ranges use {minimum_usd, maximum_usd}, not a prose string. Rates are fractions (0.05 = 5%), null means variable/unknown. Nullable Boolean provider claims avoid falsely reporting an unknown as false. partner_tier is nullable because no contract exists. All seed providers have verified_partner=false or unassigned cost-seg tier. The supplied state field describes a baseline home-office state, not a regional coverage boundary. National/Regional filters are implemented.

## Financial model
Input excess depreciable basis must already exclude land. The model bounds it against purchase price minus land but does not compute basis from a sale. Carryover basis is excluded. Assumed short-life basis is 80% 5-year and 20% 15-year property with half-year MACRS. Remaining building basis uses 27.5/39-year mid-month depreciation. User-entered bonus rate defaults to 0; eligibility is not inferred. Results are deductions, not tax savings.

## Known activation requirements
Repository creation/commit, remote CI result, Cloudflare project connection, canonical URL and intake secrets cannot be claimed complete until their remote operations succeed. Astro 4 is retained as requested; evaluate its current support/security before production, remotely only. npm lockfile is generated and committed by bootstrap, never fabricated.
