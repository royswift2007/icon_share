const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dataPath = path.join(rootDir, 'symbols-data.json');
const indexPath = path.join(rootDir, 'index.html');
const cnblogsPath = path.join(rootDir, 'cnblogs.html');

const unicode11CopyCategoryName = 'Unicode 1.1';
const unicode11MergedCategoryNames = new Set([
  'Unicode 1.1',
  'Unicode 1.1 · 严格筛选',
  'Unicode 1.1 · 实用扩展'
]);
const unicode11Symbols = [
  '#',
  '*',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '©',
  '®',
  '‼',
  '™',
  '↔',
  '↕',
  '↖',
  '↗',
  '↘',
  '↙',
  '↩',
  '↪',
  '⌚',
  '⌛',
  '⌨',
  'Ⓜ',
  '▪',
  '▫',
  '▶',
  '◀',
  '☀',
  '☁',
  '☂',
  '☃',
  '☄',
  '☎',
  '☑',
  '☝',
  '☠',
  '☢',
  '☣',
  '☦',
  '☪',
  '☮',
  '☯',
  '☸',
  '☹',
  '☺',
  '♀',
  '♂',
  '♈',
  '♉',
  '♊',
  '♋',
  '♌',
  '♍',
  '♎',
  '♏',
  '♐',
  '♑',
  '♒',
  '♓',
  '♟',
  '♠',
  '♣',
  '♥',
  '♦',
  '♨',
  '✂',
  '✈',
  '✉',
  '✌',
  '✍',
  '✏',
  '✒',
  '✔',
  '✖',
  '✝',
  '✡',
  '✳',
  '✴',
  '❄',
  '❇',
  '❣',
  '❤',
  '➡',
  '〰',
  '㊗',
  '㊙'
];

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function readJson(filePath) {
  return JSON.parse(stripBom(fs.readFileSync(filePath, 'utf8')));
}

function normalizeSymbolKey(symbol) {
  return String(symbol)
    .normalize('NFC')
    .replace(/[\uFE0E\uFE0F]/gu, '')
    .replace(/[\u{E0100}-\u{E01EF}]/gu, '');
}

function unique(values, keyFn = value => String(value)) {
  const seen = new Set();
  const output = [];

  values.forEach(value => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return;
    }

    const text = String(value);
    const key = keyFn(text);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    output.push(text);
  });

  return output;
}

function decodeHtml(text) {
  const entities = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    '#39': "'",
    nbsp: ' '
  };

  return text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, entity => entities[entity.slice(1, -1)] || entity);
}

function getCnblogsPostText() {
  const html = fs.readFileSync(cnblogsPath, 'utf8');
  const body = html.match(/<div id="cnblogs_post_body"[\s\S]*?<\/div>\s*<div class="clear">/)?.[0] || '';
  return decodeHtml(body).replace(/<[^>]+>/g, '');
}

function getExistingKeys(categories) {
  return new Set(categories.flatMap(category => category.symbols || []).map(normalizeSymbolKey));
}

function isRegionalIndicatorPair(symbol) {
  const codePoints = Array.from(symbol).map(char => char.codePointAt(0));
  return codePoints.length === 2 && codePoints.every(codePoint => codePoint >= 0x1F1E6 && codePoint <= 0x1F1FF);
}

function isTagFlag(symbol) {
  const codePoints = Array.from(symbol).map(char => char.codePointAt(0));
  return codePoints[0] === 0x1F3F4
    && codePoints.some(codePoint => codePoint >= 0xE0061 && codePoint <= 0xE007A)
    && codePoints.includes(0xE007F);
}

function isFlagZwjSequence(symbol) {
  return symbol.includes('\u200D') && /^[🏳🏴]/u.test(symbol);
}

function isEmojiCluster(symbol) {
  return /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u.test(symbol);
}

function extractMissingEmojiClusters(categories) {
  const text = getCnblogsPostText();
  const segmenter = new Intl.Segmenter('zh', { granularity: 'grapheme' });
  const existingKeys = getExistingKeys(categories);
  const clusters = [...segmenter.segment(text)]
    .map(segment => segment.segment)
    .filter(isEmojiCluster);

  const missing = unique(clusters, normalizeSymbolKey)
    .filter(symbol => !existingKeys.has(normalizeSymbolKey(symbol)));

  return {
    flags: missing.filter(symbol => isRegionalIndicatorPair(symbol) || isTagFlag(symbol) || isFlagZwjSequence(symbol)),
    combos: missing.filter(symbol => symbol.includes('\u200D') && !isFlagZwjSequence(symbol))
  };
}

function upsertCategory(categories, category) {
  const index = categories.findIndex(item => item.name === category.name);
  if (index === -1) {
    categories.push(category);
    return;
  }

  categories[index] = category;
}

function normalizeCategory(category) {
  const symbols = Array.isArray(category.symbols) ? [...category.symbols] : [];
  return {
    ...category,
    count: symbols.length,
    symbols
  };
}

function buildUnicode11CopyCategory(previousUnicode11Categories) {
  return {
    name: unicode11CopyCategoryName,
    navSymbol: '☑',
    group: '图案与表情',
    count: unicode11Symbols.length,
    sources: unique(previousUnicode11Categories.flatMap(category => category.sources || [])),
    aliases: unique([
      '复制集合：符合 Unicode 1.1 的符号；原分类保留不变',
      ...previousUnicode11Categories.flatMap(category => category.aliases || [])
        .filter(alias => !String(alias).startsWith('复制集合：')),
      '只按 Unicode 1.1 与官方 emoji/变体规则死筛',
      'Unicode 1.1 · 实用扩展',
      '仍限定在 Unicode 1.1 内，但更偏签名/装饰场景里常用、好用、好看的彩色符号'
    ]),
    symbols: [...unicode11Symbols]
  };
}

function buildEmojiCategory(name, navSymbol, aliases, symbols) {
  const uniqueSymbols = unique(symbols, normalizeSymbolKey);
  return {
    name,
    navSymbol,
    group: '图案与表情',
    count: uniqueSymbols.length,
    sources: ['cnblogs'],
    aliases,
    symbols: uniqueSymbols
  };
}

function buildData(data) {
  const previousUnicode11Categories = data.categories.filter(category => unicode11MergedCategoryNames.has(category.name));
  const retainedCategories = data.categories
    .filter(category => !unicode11MergedCategoryNames.has(category.name))
    .filter(category => !['🏳️ 国旗与地区旗帜', '🧩 组合 Emoji'].includes(category.name))
    .map(normalizeCategory);

  const categories = [buildUnicode11CopyCategory(previousUnicode11Categories), ...retainedCategories];
  const missingEmoji = extractMissingEmojiClusters(categories);

  upsertCategory(categories, buildEmojiCategory(
    '🏳️ 国旗与地区旗帜',
    '🏳️',
    ['常用emoji符号', '国旗符号', '从 cnblogs 按完整 emoji 字素簇补充'],
    missingEmoji.flags
  ));
  upsertCategory(categories, buildEmojiCategory(
    '🧩 组合 Emoji',
    '🧩',
    ['常用emoji符号', '零宽连接符组合 emoji', '从 cnblogs 按完整 emoji 字素簇补充'],
    missingEmoji.combos
  ));

  const categoryItemCount = categories.reduce((sum, category) => sum + category.symbols.length, 0);
  const uniqueSymbolCount = new Set(categories.flatMap(category => category.symbols).map(normalizeSymbolKey)).size;

  return {
    ...data,
    stats: {
      ...data.stats,
      categoryCount: categories.length,
      categoryItemCount,
      uniqueSymbolCount
    },
    categories
  };
}

function replaceInlineData(html, data) {
  const marker = '<script id="symbols-data" type="application/json">';
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error('Cannot find symbols-data script block in index.html');
  }

  const dataStart = start + marker.length;
  const end = html.indexOf('</script>', dataStart);
  if (end === -1) {
    throw new Error('Cannot find closing script tag for symbols-data block in index.html');
  }

  return html.slice(0, dataStart) + JSON.stringify(data, null, 2) + html.slice(end);
}

const before = readJson(dataPath);
const after = buildData(before);

fs.writeFileSync(dataPath, `${JSON.stringify(after, null, 2)}\n`, 'utf8');
fs.writeFileSync(indexPath, replaceInlineData(fs.readFileSync(indexPath, 'utf8'), after), 'utf8');

const unicode11Category = after.categories.find(category => category.name === unicode11CopyCategoryName);
const otherCategoriesContainAllUnicode11Symbols = unicode11Symbols.every(symbol => {
  const key = normalizeSymbolKey(symbol);
  return after.categories
    .filter(category => category.name !== unicode11CopyCategoryName)
    .some(category => category.symbols.some(item => normalizeSymbolKey(item) === key));
});

const flagCategory = after.categories.find(category => category.name === '🏳️ 国旗与地区旗帜');
const comboCategory = after.categories.find(category => category.name === '🧩 组合 Emoji');

console.log(JSON.stringify({
  before: before.stats,
  after: after.stats,
  unicode11Count: unicode11Category ? unicode11Category.symbols.length : 0,
  otherCategoriesContainAllUnicode11Symbols,
  addedFlags: flagCategory ? flagCategory.symbols.length : 0,
  addedCombos: comboCategory ? comboCategory.symbols.length : 0
}, null, 2));
