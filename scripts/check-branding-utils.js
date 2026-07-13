#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('src/utils/branding.js', 'utf8')
  .replace(/export const /g, 'const ')
  .concat(`\nmodule.exports = {
    DEFAULT_BRANDING_NAME,
    normalizeBrandingName,
    normalizeBrandingImageUrl,
    normalizeOptionalBoolean,
    resolveBrandingShowName,
    normalizeBrandingImageSize,
  };\n`);

const sandbox = { module: { exports: {} } };
vm.runInNewContext(source, sandbox, { filename: 'src/utils/branding.js' });

const {
  normalizeBrandingName,
  normalizeBrandingImageUrl,
  normalizeOptionalBoolean,
  resolveBrandingShowName,
  normalizeBrandingImageSize,
} = sandbox.module.exports;

assert.strictEqual(normalizeBrandingName(undefined), 'MovieNight');
assert.strictEqual(normalizeBrandingName(null), 'MovieNight');
assert.strictEqual(normalizeBrandingName(''), 'MovieNight');
assert.strictEqual(normalizeBrandingName('   '), 'MovieNight');
assert.strictEqual(normalizeBrandingName(" Tom's Movie Club "), "Tom's Movie Club");
assert.strictEqual(normalizeBrandingName(123), 'MovieNight');

assert.strictEqual(normalizeBrandingImageUrl(undefined, 'fallback.png'), 'fallback.png');
assert.strictEqual(normalizeBrandingImageUrl(null, 'fallback.png'), 'fallback.png');
assert.strictEqual(normalizeBrandingImageUrl('', 'fallback.png'), 'fallback.png');
assert.strictEqual(normalizeBrandingImageUrl('   ', 'fallback.png'), 'fallback.png');
assert.strictEqual(normalizeBrandingImageUrl(' https://example.com/logo.png ', 'fallback.png'), 'https://example.com/logo.png');

const booleanCases = [
  [true, true],
  [false, false],
  ['true', true],
  ['false', false],
  [1, true],
  [0, false],
  ['1', true],
  ['0', false],
  ['', null],
  ['   ', null],
  [undefined, null],
  [null, null],
  ['maybe', null],
];

for (const [input, expected] of booleanCases) {
  assert.strictEqual(normalizeOptionalBoolean(input), expected, `boolean case ${String(input)}`);
}

assert.strictEqual(resolveBrandingShowName(undefined, undefined), true);
assert.strictEqual(resolveBrandingShowName('', 'false'), false);
assert.strictEqual(resolveBrandingShowName('   ', false), false);
assert.strictEqual(resolveBrandingShowName('invalid', 0), false);
assert.strictEqual(resolveBrandingShowName('true', false), true);
assert.strictEqual(resolveBrandingShowName(false, true), false);
assert.strictEqual(resolveBrandingShowName('0', '1'), false);
assert.strictEqual(resolveBrandingShowName('1', '0'), true);

const sizeCases = [
  [42, '42px'],
  ['42', '42px'],
  [' 42 ', '42px'],
  ['42px', '42px'],
  ['3rem', '3rem'],
  ['', '56px'],
  ['invalid', '56px'],
];

for (const [input, expected] of sizeCases) {
  assert.strictEqual(normalizeBrandingImageSize(input), expected, `size case ${String(input)}`);
}

console.log('PASS branding utility normalization and inheritance checks');
