# Remote-only governance
## Mandatory execution policy
ZERO project code, tests, extraction, installs, scripts, pipelines, previews, or servers run locally. Local tools may only author text files. Never invoke shell commands on the user's machine. All Python extraction/normalization/test execution runs in GitHub Actions. All production site builds run in Cloudflare Pages CI; GitHub Actions additionally runs the requested check/build verification. Never start a dev server, including in CI.
## Architecture
- pipeline/: Python 3.11+, Pydantic v2 validation, deterministic normalization.
- data/raw/: reviewed source records; data/normalized/: validated JSON, version controlled.
- site/: Astro 4, TypeScript, Tailwind CSS, React islands, static HTML for crawlers.
## Schema contract
pipeline/models.py and site/src/content/config.ts Zod definitions MUST stay synchronized, including nullable fields, enums, required keys, bounds, and URL validation. Update both in one commit. Remote contract checks validate every record and compare required fields plus positive/negative fixtures.
## Editorial and financial integrity
Unknown facts are null, never invented. Provider membership is a seed candidate, not a recommendation. Never claim a verified partnership or tier without evidence. Each record carries source URLs and an editorial review date. Weekly normalization does not refresh that review date or assert current verification. This baseline does not scrape; future extraction must be separately implemented on GitHub Actions and save evidence to data/raw.
State rates describe individual state income tax only; distinguish corporations and federal tax. Do not rank provider brands as independent if ownership is shared. Calculator inputs are explicit assumptions, not cost segregation findings or tax advice.
## Operations
No secrets or lead PII in git, workflow logs, or public data. Protected main requires a narrowly scoped bot bypass for the scheduled data-only commit, or change the pipeline to a PR workflow. CI failures block deployment. Production Pages build command is npm ci && npm run check && npm run build; root site, output dist. Node 20.
