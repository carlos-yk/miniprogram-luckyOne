const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createSSQSummary,
  generateSSQ,
  formatBall,
  formatSSQ
} = require('../miniprogram/utils/lottery');

test('generateSSQ returns six unique sorted red balls and one valid blue ball', () => {
  for (let i = 0; i < 100; i += 1) {
    const result = generateSSQ();

    assert.equal(result.reds.length, 6);
    assert.equal(new Set(result.reds).size, 6);
    assert.ok(result.reds.every((n) => n >= 1 && n <= 33));
    assert.ok(result.reds.every((n, index, arr) => index === 0 || arr[index - 1] < n));
    assert.ok(result.blue >= 1 && result.blue <= 16);
  }
});

test('formatBall pads numbers to two digits', () => {
  assert.equal(formatBall(1), '01');
  assert.equal(formatBall(12), '12');
});

test('formatSSQ formats red and blue balls for display', () => {
  assert.equal(formatSSQ({ reds: [3, 8, 12, 19, 27, 31], blue: 9 }), '03 08 12 19 27 31 | 09');
});

test('createSSQSummary describes a generated ticket for the home summary panel', () => {
  const summary = createSSQSummary({
    reds: [2, 15, 16, 24, 26, 27],
    blue: 16,
    timeText: '20:48'
  });

  assert.deepEqual(summary, {
    title: '本次号码摘要',
    sumText: '110',
    parityText: '2:4',
    sizeText: '3:3',
    timeText: '20:48'
  });
});
