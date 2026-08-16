# Installing Sheets → Discord Webhook on your form

The add-on runs inside the **Google Sheet that receives your form's responses** —
not inside the form itself. Setup is: link your form to a sheet, install the
add-on, configure, enable. Ten minutes end to end.

## 1. Link your Google Form to a spreadsheet

Skip this if your form already writes into a sheet.

1. Open your form at [forms.google.com](https://forms.google.com).
2. **Responses** tab → click the Sheets icon (**Link to Sheets**).
3. Choose **Create a new spreadsheet** → **Create**. The linked sheet opens
   with a `Form Responses 1` tab whose columns match your questions.

## 2. Install the add-on

**From the Marketplace** (once published): open the listing link, click
**Install**, and approve the permissions for the Google account that owns the
response sheet.

**From source** (works today):

1. Open the response spreadsheet → **Extensions → Apps Script**.
2. Copy these files from this repo into the editor (create matching names):
   `Code.js`, `Template.js`, `Discord.js`, `Checks.js`, and `Sidebar.html`
   (File → New → HTML for the last one).
3. Open Project Settings (⚙) → check **Show "appsscript.json"** → replace its
   contents with this repo's `appsscript.json`.
4. Save everything and reload the spreadsheet.

Either way you should now see a **Discord Webhook** menu in the sheet's menu
bar (Marketplace installs put it under **Extensions → Sheets to Discord
Webhook**).

> Permissions explained: the add-on asks for access to *this spreadsheet only*,
> permission to *connect to an external service* (the Discord webhook you
> configure — nothing else), and permission to *create the form-submit trigger*.

## 3. Create a Discord webhook

1. In Discord, open the target channel → **Edit Channel → Integrations →
   Webhooks → New Webhook**.
2. Name it (this becomes the poster's display name) and **Copy Webhook URL**.

## 4. Configure

1. In the spreadsheet: **Discord Webhook → Configure…** (sidebar opens).
2. Paste the webhook URL.
3. Write a message template, or leave it empty to send every question and
   answer. Click the chips to insert `{{Column Header}}` placeholders; format
   answers with filters like `{{Name|escape|bold}}` or `{{Choices|list}}` —
   the sidebar's cheat sheet lists them all.
4. **Save**, then **Send test** and check the Discord channel.

Example template:

```
# 📋 New application — {{_timestamp}}
**{{Name|escape|bold}}** applied!
> {{Why do you want to join?|escape}}
**Roles:**
{{Roles|list}}
```

## 5. Enable posting

**Discord Webhook → Enable posting.** That's it — every new form submission is
now posted to your channel. Long responses arrive as multiple messages in
order; bursts are queued and retried automatically.

## Troubleshooting

- **No "Discord Webhook" menu**: reload the sheet; make sure the script/add-on
  is installed on the *response* spreadsheet, not the form.
- **Test works but form submissions don't post**: you skipped **Enable
  posting**, or you enabled it before saving a webhook URL — run it again.
- **Nothing arrives and you use multiple Google accounts**: open the sheet with
  the account that installed the add-on; triggers run as the installing user.
- **Delivery details**: check **Extensions → Apps Script → Executions** for
  `handleFormSubmit` / `drainQueue` logs. Pending messages sit in a hidden
  `_webhook_queue` sheet until delivered.
