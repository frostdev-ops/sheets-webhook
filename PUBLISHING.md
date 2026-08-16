# Publishing runbook — Google Workspace Marketplace

Current state: script pushed and deployed.

- **Script ID**: `1EI1qHVVgQiyWgnO5Z_DT3iMdFdOXKS31WQh756XFyH92gKfyGufYw_b8`
- **Deployment**: `AKfycbx_FHC9m8uxPsXFuONOXuILQI4MIOstMRIIiUVtAwFbZF_al4SvIg3TY4okiNS0U8fOpg` @ version 1
- The code is already add-on-safe: Document Properties (per-spreadsheet config),
  `onInstall`, authMode-aware `onOpen`, explicit `oauthScopes`, `urlFetchWhitelist`.

## Two publishing paths

- **Private (frostdev.io domain only)** — no OAuth verification review, live in
  minutes. Do this first; it is also how you QA the real install flow.
- **Public** — requires OAuth verification (sensitive scope
  `script.external_request`): homepage + privacy policy URLs, scope
  justifications, demo screencast. Budget days-to-weeks for review.

## Steps (both paths)

1. **Standard GCP project** (Editor add-ons cannot publish from the default
   Apps Script-managed project):
   - [console.cloud.google.com](https://console.cloud.google.com) → New project
     (e.g. `sheets-webhook-addon`); note its **project number** (IAM & Admin → Settings).
   - Apps Script editor → ⚙ Project Settings → Google Cloud Platform (GCP)
     Project → Change project → paste the project number.

2. **OAuth consent screen** (GCP console → APIs & Services → OAuth consent screen):
   - User type **External** (Internal if only frostdev.io will ever use it —
     Internal also skips verification entirely).
   - App name (must not contain "Google"), support email, 120×120 logo,
     homepage URL, privacy policy URL (host `PRIVACY.md` — GitHub Pages or
     frostdev.io), authorized domain.
   - Add the four scopes from `appsscript.json`.
   - Private/Internal path: leave in production unverified. Public path: submit
     for verification with per-scope justification + a YouTube screencast
     showing the consent flow and why `script.external_request` is needed
     (posting to the user's own Discord webhook).

3. **Marketplace SDK** (GCP console → search "Google Workspace Marketplace SDK" → Enable):
   - **App Configuration**: App visibility Private (domain) or Public; App
     integration → **Editor add-on → Sheets**; enter the Script ID and
     **version number 1** (use the deployment ID if the console asks for a
     deployment instead).
   - **Store Listing**: name, short/long description, icons (32×32, 128×128),
     at least one 1280×800 screenshot (the sidebar over a responses sheet),
     category (e.g. Productivity), support/setup URLs.
   - Publish. Private: install from Marketplace while signed into the domain.

4. **Post-install QA** (fresh account ideally): install → open a form-linked
   sheet → Extensions menu shows the add-on → Configure → Save → Send test →
   Enable posting → submit a form response.

## Releasing updates

```bash
npx @google/clasp push -f
npx @google/clasp create-version "what changed"
```

Then bump the version number in Marketplace SDK → App Configuration (or
`npx @google/clasp update-deployment <deploymentId> -V <version>` if it was
wired to the deployment). Store-listing-only edits don't need a new version.
