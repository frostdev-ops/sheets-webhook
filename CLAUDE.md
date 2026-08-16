# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

A Google Sheets add-on/script (similar to Document Studio) that watches for new Google Forms responses landing in a sheet, transforms each response into a customized message using a user-defined template, and posts it to a Discord channel via webhook.

**Status: Phase 1 implemented** (`Code.js`, `Template.js`, `Discord.js`, `Sidebar.html`, `Checks.js`) and pushed via clasp. Run `runChecks()` from the script editor — or the Node harness pattern (mock `Utilities`/`Session`, eval the files) — to verify templating/chunking logic. Phase 2 (Marketplace packaging): code is add-on-safe and deployed as version 1; the remaining console steps are the runbook in `PUBLISHING.md` (GCP project, consent screen, Marketplace SDK). `PRIVACY.md` and `README.md` are the verification collateral.

## Architecture

- **Platform**: Google Apps Script (V8 runtime), bound to the response spreadsheet. Plain `.gs`/`.js` files — no bundler, no npm modules at runtime (Apps Script cannot `require`/`import` packages).
- **Trigger**: an **installable** `onFormSubmit` trigger on the spreadsheet (simple triggers cannot call external services like `UrlFetchApp`). The event object's `e.namedValues` maps column headers → response values.
- **Templating**: message template with `{{Column Header}}` placeholders substituted from `e.namedValues`. Template and webhook URL stored in `PropertiesService` (script/user properties) or a config sheet — not hardcoded.
- **Delivery**: `UrlFetchApp.fetch(webhookUrl, {method: 'post', contentType: 'application/json', payload})`. Discord webhook payload is `{content}` or `{embeds: [...]}`.
- **UI** (if built as an add-on): sidebar/dialog via `HtmlService` + a menu from `onOpen` for configuring the webhook URL and template.

## Platform Constraints Worth Remembering

- Discord limits: `content` ≤ 2000 chars, embed description ≤ 4096, ≤ 10 embeds per message; webhook rate limit ~30 requests/min — a burst of form responses may need a queue or `Utilities.sleep` backoff on HTTP 429.
- `e.namedValues` values are arrays (e.g. `['answer']`); multi-select checkbox answers arrive comma-joined in one element.
- Installable triggers run as the user who created them; `UrlFetchApp` requires the `https://www.googleapis.com/auth/script.external_request` scope in `appsscript.json`.
- Apps Script quotas: 20k URL fetches/day (consumer), 6 min max execution per run.

## Development Workflow (clasp)

Local development uses [clasp](https://github.com/google/clasp) to sync with the Apps Script project:

The npm package is scoped — `npx clasp` does NOT resolve; always use `npx @google/clasp`:

```bash
npx @google/clasp login      # one-time OAuth (interactive — ask James to run it)
npx @google/clasp push -f    # upload local files (-f skips the manifest confirmation prompt)
npx @google/clasp pull       # download remote changes
npx @google/clasp open-script  # open the script editor in a browser
```

The project is already created (`.clasp.json` has the scriptId; container sheet + script links are in the Drive account admin@frostdev.io). Note: `clasp create` clones the remote's default `appsscript.json` over the local one — re-add `oauthScopes` if that ever happens again. Testing = `runChecks()` (script editor or Node harness) plus a real form submission.
