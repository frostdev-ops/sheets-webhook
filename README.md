# Sheets → Discord Webhook

Posts new Google Forms responses from a Google Sheet to a Discord channel,
formatted with your own template. Runs entirely inside your spreadsheet as a
Google Apps Script — no servers, no third parties.

## Features

- **Full responses, always** — messages over Discord's 2000-character limit are
  split at paragraph/line boundaries and delivered in order; code blocks are
  closed and reopened across the split. Nothing is ever truncated.
- **Discord markdown templates** — write headings, bold, quotes, code blocks,
  spoilers directly in the template; `{{Column Header}}` placeholders fill in
  answers.
- **Formatting filters** — `{{Header|escape|bold}}` style chains per placeholder.
- **Reliable delivery** — a persistent queue with rate-limit handling (429
  `retry_after`), exponential backoff on server errors, and strict FIFO order.
- **Safe by default** — form answers containing `@everyone`/`@here` never ping.

## Setup

1. Open a spreadsheet that receives Google Forms responses.
2. **Discord Webhook → Configure…** (menu, or Extensions → add-on menu).
3. Paste your Discord webhook URL (Discord: Channel → Edit → Integrations →
   Webhooks → New Webhook → Copy URL).
4. Write a template, or leave it empty to send every question and answer.
5. **Send test**, then **Enable posting**.

## Template syntax

| Syntax | Result |
| :--- | :--- |
| `{{Column Header}}` | The answer to that question |
| `{{_all}}` | Every question and answer (the default template) |
| `{{_timestamp}}` | Submission time |
| `{{Header\|bold}}` | Filtered value; chain filters with more pipes |

Filters: `bold` `italic` `underline` `strike` `spoiler` `code` `codeblock`
`quote` `list` `escape` `upper` `lower` `trim`

- `list` turns a multi-select (checkbox) answer into bullet points.
- `escape` renders free-text answers literally so user input can't hijack your
  markdown.

Example:

```
# 📋 New application — {{_timestamp}}
**{{Name|escape|bold}}** applied!
> {{Why do you want to join?|escape}}
**Roles:**
{{Roles|list}}
```

## Development

Plain Apps Script (V8), synced with [clasp](https://github.com/google/clasp) —
see `CLAUDE.md` for commands and `PUBLISHING.md` for the Marketplace runbook.
Logic checks: run `runChecks()` in the script editor.

Privacy: see [PRIVACY.md](PRIVACY.md). Contact: admin@frostdev.io
