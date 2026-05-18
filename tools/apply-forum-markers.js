const fs = require('fs');

const markerSourcePath = 'nd.md';
const indexPath = 'index.html';

function normalizeSymbolKey(symbol) {
  return String(symbol)
    .normalize('NFC')
    .replace(/[\uFE0E\uFE0F]/gu, '')
    .replace(/[\u{E0100}-\u{E01EF}]/gu, '');
}

function getMarkerSourceText() {
  return fs.readFileSync(markerSourcePath, 'utf8')
    .split(/\r?\n/)
    .find(line => line.trim().length > 0) || '';
}

function isEmojiLikeCluster(cluster) {
  const key = normalizeSymbolKey(cluster).trim();
  if (!key) {
    return false;
  }

  return Array.from(key).some(char => {
    const codePoint = char.codePointAt(0);
    return (codePoint >= 0x2300 && codePoint <= 0x23FF)
      || (codePoint >= 0x2500 && codePoint <= 0x27BF)
      || (codePoint >= 0x2B00 && codePoint <= 0x2BFF)
      || (codePoint >= 0x1F000 && codePoint <= 0x1FAFF)
      || [0x00A9, 0x00AE, 0x203C, 0x2049, 0x2122, 0x2139, 0x3030, 0x303D, 0x3297, 0x3299].includes(codePoint);
  });
}

function getMarkerKeys(text) {
  const segmenter = new Intl.Segmenter('zh', { granularity: 'grapheme' });
  const seen = new Set();
  const keys = [];

  [...segmenter.segment(text)].forEach(segment => {
    const cluster = segment.segment;
    const key = normalizeSymbolKey(cluster);

    if (!isEmojiLikeCluster(cluster) || seen.has(key)) {
      return;
    }

    seen.add(key);
    keys.push(key);
  });

  return keys;
}

function replaceManagedBlock(content, startMarker, endMarker, block, insertAfter) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end > start) {
    return content.slice(0, start) + block + content.slice(end + endMarker.length);
  }

  const insertIndex = content.indexOf(insertAfter);
  if (insertIndex === -1) {
    throw new Error(`Cannot find insertion point: ${insertAfter}`);
  }

  const afterIndex = insertIndex + insertAfter.length;
  return content.slice(0, afterIndex) + block + content.slice(afterIndex);
}

function buildCssBlock() {
  return `\n\n    /* forum-marker:start */\n    .symbol-item.forum-marked {\n      border-color: rgba(250, 204, 21, 0.88);\n      background:\n        linear-gradient(135deg, rgba(250, 204, 21, 0.16), rgba(30, 41, 59, 0.72) 58%),\n        rgba(30, 41, 59, 0.72);\n      box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.44), 0 12px 30px rgba(2, 8, 23, 0.24);\n    }\n\n    .symbol-item.forum-marked:hover,\n    .symbol-item.forum-marked:focus-visible {\n      border-color: rgba(250, 204, 21, 1);\n      box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.9), 0 16px 34px rgba(2, 8, 23, 0.32);\n    }\n    /* forum-marker:end */`;
}

function buildJsBlock(markerKeys) {
  const serializedKeys = JSON.stringify(markerKeys, null, 6).replace(/^/gm, '    ');
  return `\n\n    // forum-marker:start\n    const forumMarkedSymbolKeys = new Set(${serializedKeys.trimStart()});\n\n    function isForumMarkedSymbol(symbol) {\n      return forumMarkedSymbolKeys.has(normalizeSymbolKey(symbol));\n    }\n    // forum-marker:end`;
}

function updateBuildSymbolButton(content) {
  const search = `      button.type = 'button';\n      button.className = 'symbol-item';\n      button.title = '点击复制\\n' + codepoints(symbol);`;
  const replacement = `      button.type = 'button';\n      button.className = 'symbol-item';\n      if (isForumMarkedSymbol(symbol)) {\n        button.classList.add('forum-marked');\n      }\n      button.title = '点击复制\\n' + codepoints(symbol);`;

  if (content.includes(replacement)) {
    return content;
  }

  if (!content.includes(search)) {
    throw new Error('Cannot find buildSymbolButton insertion point.');
  }

  return content.replace(search, replacement);
}

const markerKeys = getMarkerKeys(getMarkerSourceText());
let html = fs.readFileSync(indexPath, 'utf8');

html = replaceManagedBlock(
  html,
  '    /* forum-marker:start */',
  '    /* forum-marker:end */',
  buildCssBlock(),
  `    .symbol-item {\n      width: 76px;\n      min-height: 70px;\n      padding: 8px 6px;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      gap: 6px;\n      text-align: center;\n      font-family: "Segoe UI", "Microsoft YaHei UI", "PingFang SC", sans-serif;\n      position: relative;\n      overflow: hidden;\n    }`
);

html = replaceManagedBlock(
  html,
  '    // forum-marker:start',
  '    // forum-marker:end',
  buildJsBlock(markerKeys),
  `    function normalizeSymbolKey(symbol) {\n      return String(symbol)\n        .normalize('NFC')\n        .replace(/[\\uFE0E\\uFE0F]/gu, '')\n        .replace(/[\\u{E0100}-\\u{E01EF}]/gu, '');\n    }`
);

html = updateBuildSymbolButton(html);
fs.writeFileSync(indexPath, html, 'utf8');

console.log(JSON.stringify({ markerCount: markerKeys.length }, null, 2));
