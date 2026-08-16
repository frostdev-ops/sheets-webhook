/** Chunking, the persistent queue, and delivery with backoff.
 * ponytail: sheet-backed FIFO + one-shot triggers; upgrade to batched embeds
 * if a form ever produces 50+ chunks. */

var DISCORD_LIMIT = 2000;
var QUEUE_SHEET = '_webhook_queue';
var MAX_ATTEMPTS = 8;

/** Split into ≤2000-char messages (never truncate), preferring paragraph /
 * newline / space breaks, closing and reopening ``` fences that span a boundary. */
function chunkContent(text) {
  var chunks = [];
  var reopen = '';
  var rest = String(text);
  while (rest.length) {
    var budget = DISCORD_LIMIT - reopen.length;
    if (rest.length <= budget) {
      chunks.push(reopen + rest);
      break;
    }
    var body = rest.slice(0, budget - 4); // reserve room for a closing "\n```"
    var cut = findCut_(body);
    var chunk = reopen + rest.slice(0, cut);
    var lang = openFence_(chunk);
    if (lang !== null) {
      chunk += '\n```';
      reopen = '```' + lang + '\n';
    } else {
      reopen = '';
    }
    chunks.push(chunk);
    rest = rest.slice(cut).replace(/^[\n ]+/, '');
  }
  return chunks;
}

function findCut_(s) {
  var floor = s.length * 0.3; // don't cut absurdly early just to hit a nice break
  var i = s.lastIndexOf('\n\n');
  if (i > floor) return i;
  i = s.lastIndexOf('\n');
  if (i > floor) return i;
  i = s.lastIndexOf(' ');
  if (i > floor) return i;
  return s.length;
}

/** Language tag of the unclosed ``` fence in s, or null if all fences are closed. */
function openFence_(s) {
  var re = /```([^\n`]*)/g;
  var open = null;
  var m;
  while ((m = re.exec(s))) open = open === null ? (m[1] || '') : null;
  return open;
}

function queueSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(QUEUE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(QUEUE_SHEET);
    sh.appendRow(['enqueued_at', 'content', 'attempts', 'next_attempt_after']);
    sh.hideSheet();
  }
  return sh;
}

/** Document lock keeps two simultaneous submissions from interleaving their chunks. */
function enqueueChunks(chunks) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var sh = queueSheet_();
    var now = new Date();
    chunks.forEach(function (c) {
      sh.appendRow([now, c, 0, now]);
    });
  } finally {
    lock.releaseLock();
  }
}

function getQueueDepth() {
  return Math.max(0, queueSheet_().getLastRow() - 1);
}

/** The only sender. Safe to call from the form trigger, a time trigger, or the sidebar. */
function drainQueue() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) return; // another drain is running; it will pick up our rows
  try {
    deleteTriggersFor_('drainQueue'); // one-shot time triggers persist after firing
    var webhookUrl = getConfig().webhookUrl;
    if (!webhookUrl) return;
    var sh = queueSheet_();
    var started = Date.now();

    while (sh.getLastRow() >= 2) {
      if (Date.now() - started > 270000) { // stay under the 6-min execution cap
        scheduleDrain_(60000);
        return;
      }
      var row = sh.getRange(2, 1, 1, 4).getValues()[0];
      var content = String(row[1] || '');
      if (!content) { sh.deleteRow(2); continue; } // stray blank row
      var attempts = Number(row[2]) || 0;
      var notBefore = row[3] instanceof Date ? row[3].getTime() : 0;
      if (notBefore > Date.now()) { // FIFO: nothing may jump past a backing-off head
        scheduleDrain_(notBefore - Date.now());
        return;
      }

      var code = 0;
      var bodyText = '';
      try {
        var res = UrlFetchApp.fetch(webhookUrl, {
          method: 'post',
          contentType: 'application/json',
          // allowed_mentions parse:[] — a form answer containing @everyone must never ping.
          payload: JSON.stringify({ content: content, allowed_mentions: { parse: [] } }),
          muteHttpExceptions: true,
        });
        code = res.getResponseCode();
        bodyText = res.getContentText();
      } catch (err) {
        bodyText = String(err); // network failure → retry branch (code stays 0)
      }

      if (code >= 200 && code < 300) {
        sh.deleteRow(2);
        if (sh.getLastRow() >= 2) Utilities.sleep(2000); // ~30 req/min per webhook
        continue;
      }

      if (code === 429 || code >= 500 || code === 0) {
        if (attempts + 1 >= MAX_ATTEMPTS) {
          console.error('Dropping chunk after ' + MAX_ATTEMPTS + ' attempts (HTTP ' + code + '): ' + bodyText);
          sh.deleteRow(2);
          continue;
        }
        var delayMs;
        if (code === 429) {
          delayMs = 5000;
          try { delayMs = Math.ceil(JSON.parse(bodyText).retry_after * 1000) + 250; } catch (ignore) {}
        } else {
          delayMs = Math.min(30000 * Math.pow(2, attempts), 600000);
        }
        sh.getRange(2, 3, 1, 2).setValues([[attempts + 1, new Date(Date.now() + delayMs)]]);
        console.warn('Send failed (HTTP ' + code + '), retry #' + (attempts + 1) + ' in ' + Math.round(delayMs / 1000) + 's');
        scheduleDrain_(delayMs);
        return;
      }

      // Other 4xx: permanent — a bad payload will not heal on retry.
      console.error('Dropping chunk, HTTP ' + code + ': ' + bodyText);
      sh.deleteRow(2);
    }
  } finally {
    lock.releaseLock();
  }
}

function scheduleDrain_(delayMs) {
  ScriptApp.newTrigger('drainQueue').timeBased().after(Math.max(1000, Math.ceil(delayMs))).create();
}
