/** Menu, config, triggers, and the form-submit entry point. */

var DEFAULT_TEMPLATE = '# New form response — {{_timestamp}}\n\n{{_all}}';

function onOpen(e) {
  // Must not touch Properties here: runs in AuthMode.NONE when installed as an add-on.
  SpreadsheetApp.getUi()
    .createMenu('Discord Webhook')
    .addItem('Configure…', 'showSidebar')
    .addItem('Enable posting', 'enableTrigger')
    .addItem('Disable posting', 'disableTrigger')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Discord Webhook'));
}

function getConfig() {
  var p = PropertiesService.getDocumentProperties();
  return {
    webhookUrl: p.getProperty('WEBHOOK_URL') || '',
    template: p.getProperty('TEMPLATE') || '',
  };
}

function saveConfig(webhookUrl, template) {
  webhookUrl = String(webhookUrl || '').trim();
  if (!/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(webhookUrl)) {
    throw new Error('That is not a Discord webhook URL (expected https://discord.com/api/webhooks/…).');
  }
  PropertiesService.getDocumentProperties().setProperties({
    WEBHOOK_URL: webhookUrl,
    TEMPLATE: String(template || ''),
  });
  return 'Saved.';
}

/** The form-linked responses sheet, falling back to the active sheet. */
function responsesSheet_() {
  var ss = SpreadsheetApp.getActive();
  var linked = ss.getSheets().filter(function (s) { return s.getFormUrl(); })[0];
  return linked || ss.getActiveSheet();
}

/** Sidebar status line: trigger state + queue depth. */
function getStatus() {
  var enabled = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'handleFormSubmit';
  });
  return { postingEnabled: enabled, queueDepth: getQueueDepth() };
}

/** Row-1 headers of the responses sheet, for the sidebar's placeholder chips. */
function getHeaders() {
  var sh = responsesSheet_();
  var lastCol = sh.getLastColumn();
  if (!lastCol) return [];
  return sh.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(String)
    .filter(function (h) { return h; });
}

function enableTrigger() {
  if (!getConfig().webhookUrl) {
    SpreadsheetApp.getUi().alert('Set the webhook URL first: Discord Webhook → Configure…');
    return;
  }
  deleteTriggersFor_('handleFormSubmit');
  ScriptApp.newTrigger('handleFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();
  SpreadsheetApp.getUi().alert('Posting enabled — new form responses will be sent to Discord.');
}

function disableTrigger() {
  deleteTriggersFor_('handleFormSubmit');
  SpreadsheetApp.getUi().alert('Posting disabled.');
}

function deleteTriggersFor_(handler) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === handler) ScriptApp.deleteTrigger(t);
  });
}

/** Installable onFormSubmit trigger target. */
function handleFormSubmit(e) {
  var config = getConfig();
  if (!config.webhookUrl) {
    console.error('Form response received but no webhook URL is configured.');
    return;
  }
  var content = renderTemplate(config.template || DEFAULT_TEMPLATE, (e && e.namedValues) || {}, new Date());
  if (!content.trim()) return;
  enqueueChunks(chunkContent(content));
  drainQueue();
}

/** Sidebar "Send test": renders against the last data row and sends through the real pipeline. */
function sendTest() {
  var config = getConfig();
  if (!config.webhookUrl) throw new Error('Save a webhook URL first.');
  var content = renderTemplate(config.template || DEFAULT_TEMPLATE, testNamedValues_(), new Date());
  if (!content.trim()) throw new Error('Template rendered to an empty message.');
  enqueueChunks(chunkContent(content));
  drainQueue();
  var depth = getQueueDepth();
  return depth
    ? 'Sent — ' + depth + ' chunk(s) still queued (rate-limited; they will follow).'
    : 'Test message sent.';
}

function testNamedValues_() {
  var sh = responsesSheet_();
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 2 || !lastCol) {
    return { Test: ['This is a test message from sheets-webhook — no form responses in the sheet yet.'] };
  }
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sh.getRange(lastRow, 1, 1, lastCol).getValues()[0];
  var nv = {};
  headers.forEach(function (h, i) {
    if (String(h)) nv[String(h)] = [String(values[i])];
  });
  return nv;
}
