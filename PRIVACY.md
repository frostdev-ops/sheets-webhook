# Privacy Policy — Sheets → Discord Webhook

_Last updated: 2026-08-16_

Sheets → Discord Webhook ("the add-on") posts new Google Forms responses from a
Google Sheet to a Discord channel via a webhook URL that you configure.

## What the add-on accesses

- **The current spreadsheet only** (`spreadsheets.currentonly` scope): it reads
  form response rows and column headers, and maintains a hidden `_webhook_queue`
  sheet inside your spreadsheet for pending deliveries.
- **Configuration you provide**: your Discord webhook URL and message template,
  stored in the spreadsheet's document properties within your Google account.

## What the add-on sends, and where

The only outbound transmission is the message rendered from a form response
(per your template), sent to the Discord webhook URL **you** configured —
endpoints under `https://discord.com/api/webhooks/` only. Nothing is sent
anywhere else.

## What the add-on does NOT do

- No data is transmitted to the developer or any third party other than the
  Discord webhook you configure.
- No analytics, tracking, advertising, or profiling.
- No data is stored outside your own Google account and your own Discord
  channel.
- No human reads your data.

## Data retention and deletion

All state (queue, configuration) lives inside your spreadsheet. Uninstalling
the add-on, deleting the `_webhook_queue` sheet, or clearing the configuration
removes everything. Messages already delivered to Discord are governed by
Discord's own policies.

## Limited Use disclosure

The add-on's use of information received from Google APIs adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

## Contact

Questions: admin@frostdev.io
