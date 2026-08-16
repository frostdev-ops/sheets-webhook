# Publishing runbook — Google Workspace Marketplace

## Identifiers

| Thing | Value |
| :--- | :--- |
| Script ID | `1EI1qHVVgQiyWgnO5Z_DT3iMdFdOXKS31WQh756XFyH92gKfyGufYw_b8` |
| Deployment | `AKfycbx_FHC9m8uxPsXFuONOXuILQI4MIOstMRIIiUVtAwFbZF_al4SvIg3TY4okiNS0U8fOpg` @ version 1 |
| GCP project | `sheets-webhook-addon-505715` |
| Marketplace App ID | `176826552943` |
| Draft listing | https://workspace.google.com/marketplace/app/appname/176826552943 |
| Container sheet | https://drive.google.com/open?id=1YcD2hj-fWLIgl7PD4e6LAZRA5eL0PZ76vn1BycEIBZ4 |

## Done

- Standard GCP project created and attached to the Apps Script project.
- OAuth consent screen configured (External, publishing status **Testing**),
  four scopes registered, test users added: `jameskueller1@gmail.com`,
  `admin@frostdev.io`.
- Marketplace SDK enabled.
- **App Configuration** saved: visibility **Public + Unlisted** (permanent),
  Individual + Admin install, Sheets add-on wired to the script ID at version 1,
  developer info (FrostDev / non-trader / admin@frostdev.io).
- **Store Listing** draft saved: name, descriptions, Free of charge,
  Communication category, all icons + banner + 1280×800 screenshot, support
  links pointing at this repo, all regions, draft testers enabled.

## Remaining, in order

1. **Test the draft install.** Signed in as a test user, open the draft listing
   URL above and install. Verify the add-on appears under Extensions in a
   form-linked sheet and that configure → send test → enable posting works from
   a clean install.
2. **OAuth verification** (required before anyone outside the test-user list can
   install). Google Auth Platform → Verification Center → prepare:
   - Homepage: https://github.com/frostdev-ops/sheets-webhook
   - Privacy policy: `PRIVACY.md` in this repo
   - Scope justification for `script.external_request`: the add-on posts the
     user's own form responses to the Discord webhook URL that the user
     configures; `urlFetchWhitelist` in `appsscript.json` restricts outbound
     requests to `discord.com`/`discordapp.com` webhook paths.
   - A screencast showing the OAuth consent flow and the feature that needs the
     scope. Expect days-to-weeks turnaround.
3. **Submit for review** on the Store Listing tab (button is enabled now). This
   is the Marketplace app review, separate from OAuth verification. Do not
   submit until step 1 passes.

## Releasing updates

```bash
npx @google/clasp push -f
npx @google/clasp create-version "what changed"
```

Then bump the version number in Marketplace SDK → App Configuration → Sheets
add-on script version, and Save. Store-listing-only edits don't need a new
script version, but any listing change re-enters review once published.
