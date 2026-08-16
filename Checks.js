/** Run from the script editor (or the Node harness) — logs FAIL lines on breakage. */
function runChecks() {
  var failures = 0;
  function check(name, cond) {
    if (!cond) { failures++; console.error('FAIL: ' + name); }
  }

  var nv = {
    Name: ['Alice'],
    Colors: ['Red, Green, Blue'],
    Bio: ['has *stars* and $& dollars'],
    Empty: [''],
  };

  check('plain placeholder', renderTemplate('Hi {{Name}}!', nv) === 'Hi Alice!');
  check('unknown header -> empty', renderTemplate('[{{Nope}}]', nv) === '[]');
  check('multi-value join', renderTemplate('{{Colors}}', nv) === 'Red, Green, Blue');
  check('list filter', renderTemplate('{{Colors|list}}', nv) === '- Red\n- Green\n- Blue');
  check('spaced syntax', renderTemplate('{{ Colors | list }}', nv) === '- Red\n- Green\n- Blue');
  check('escape+bold chain', renderTemplate('{{Bio|escape|bold}}', nv) === '**has \\*stars\\* and $& dollars**');
  check('no $& injection', renderTemplate('{{Bio}}', nv) === 'has *stars* and $& dollars');
  check('quote filter', renderTemplate('{{Name|quote}}', nv) === '> Alice');
  var all = renderTemplate('{{_all}}', nv);
  check('_all includes question', all.indexOf('**Name**\nAlice') !== -1);
  check('_all empty answer dash', all.indexOf('**Empty**\n—') !== -1);

  var words = [];
  for (var i = 0; i < 500; i++) words.push('word' + i);
  var text = words.join(' '); // ~4400 chars
  var chunks = chunkContent(text);
  check('long text splits', chunks.length > 1);
  check('chunks within limit', chunks.every(function (c) { return c.length <= 2000; }));
  check('no content lost', chunks.join(' ') === text);

  var lines = [];
  for (var j = 0; j < 300; j++) lines.push('let x' + j + ' = 1;');
  var fenced = 'intro\n```js\n' + lines.join('\n') + '\n```\nend';
  var fchunks = chunkContent(fenced);
  check('fenced chunks within limit', fchunks.every(function (c) { return c.length <= 2000; }));
  check('fences balanced per chunk', fchunks.every(function (c) {
    return ((c.match(/```/g) || []).length % 2) === 0;
  }));
  check('fence reopens with language', fchunks.length > 1 && fchunks[1].indexOf('```js\n') === 0);

  var msg = failures ? failures + ' check(s) FAILED — see log.' : 'All checks passed.';
  console.log(msg);
  return msg;
}
