/** {{Header|filter|filter}} rendering. Discord renders markdown in `content`
 * natively, so template text passes through untouched — filters format the
 * substituted answer values. */

var FILTERS = {
  bold: function (v) { return '**' + v + '**'; },
  italic: function (v) { return '*' + v + '*'; },
  underline: function (v) { return '__' + v + '__'; },
  strike: function (v) { return '~~' + v + '~~'; },
  spoiler: function (v) { return '||' + v + '||'; },
  code: function (v) { return '`' + v.replace(/`/g, "'") + '`'; },
  codeblock: function (v) { return '```\n' + v.replace(/```/g, "'''") + '\n```'; },
  quote: function (v) { return v.split('\n').map(function (l) { return '> ' + l; }).join('\n'); },
  list: function (v) { return v.split(/,\s*/).filter(String).map(function (i) { return '- ' + i; }).join('\n'); },
  escape: function (v) { return v.replace(/[\\*_~`>#|]/g, function (m) { return '\\' + m; }); },
  upper: function (v) { return v.toUpperCase(); },
  lower: function (v) { return v.toLowerCase(); },
  trim: function (v) { return v.trim(); },
};

function renderTemplate(template, namedValues, timestamp) {
  return String(template).replace(
    /\{\{\s*([^}|]+?)\s*((?:\|\s*[A-Za-z_]+\s*)*)\}\}/g,
    function (_, name, filterChain) {
      var value = resolveValue_(name, namedValues, timestamp);
      filterChain.split('|').forEach(function (f) {
        f = f.trim().toLowerCase();
        if (!f) return;
        if (FILTERS[f]) value = FILTERS[f](value);
        else console.warn('Unknown template filter: ' + f);
      });
      return value;
    });
}

function resolveValue_(name, namedValues, timestamp) {
  if (name === '_all') return renderAll_(namedValues);
  if (name === '_timestamp') {
    return Utilities.formatDate(timestamp || new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  }
  var vals = namedValues[name];
  return vals ? [].concat(vals).filter(String).join(', ') : '';
}

/** Every question as a "**Question**\nanswer" block — the full form response. */
function renderAll_(namedValues) {
  return Object.keys(namedValues).map(function (k) {
    var v = [].concat(namedValues[k]).filter(String).join(', ');
    return '**' + k + '**\n' + (v || '—');
  }).join('\n\n');
}
