const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PLAY_TYPES,
  createEmptyPlayResult,
  createPlaySummary,
  createSSQSummary,
  generatePlayResult,
  generateSSQ,
  formatBall,
  formatPlayResult,
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

test('generatePlayResult creates valid multi-play results', () => {
  const cases = [
    { gameId: 'ssq', groupLengths: [6, 1], ranges: [[1, 33], [1, 16]], unique: [true, true] },
    { gameId: 'dlt', groupLengths: [5, 2], ranges: [[1, 35], [1, 12]], unique: [true, true] },
    { gameId: 'fc3d', groupLengths: [3], ranges: [[0, 9]], unique: [false] },
    { gameId: 'kl8', mode: 'select10', groupLengths: [10], ranges: [[1, 80]], unique: [true] },
    { gameId: 'pl5', groupLengths: [5], ranges: [[0, 9]], unique: [false] }
  ];

  cases.forEach((item) => {
    for (let i = 0; i < 50; i += 1) {
      const result = generatePlayResult(item.gameId, item.mode);

      assert.equal(result.gameId, item.gameId);
      assert.equal(result.groups.length, item.groupLengths.length);

      item.groupLengths.forEach((length, index) => {
        const values = result.groups[index].values;
        const range = item.ranges[index];

        assert.equal(values.length, length);
        assert.ok(values.every((n) => n >= range[0] && n <= range[1]));

        if (item.unique[index]) {
          assert.equal(new Set(values).size, values.length);
          assert.ok(values.every((n, valueIndex, arr) => valueIndex === 0 || arr[valueIndex - 1] < n));
        }
      });
    }
  });
});

test('formatPlayResult joins generic groups for display', () => {
  const result = {
    gameId: 'dlt',
    groups: [
      { key: 'front', text: '01 08 13 24 35' },
      { key: 'back', text: '02 12' }
    ]
  };

  assert.equal(formatPlayResult(result), '01 08 13 24 35 | 02 12');
});

test('createEmptyPlayResult follows the play and mode shape', () => {
  const empty = createEmptyPlayResult('kl8', 'select7');

  assert.equal(empty.gameId, 'kl8');
  assert.equal(empty.mode, 'select7');
  assert.equal(empty.groups[0].textList.length, 7);
  assert.equal(empty.groups[0].text, '-- -- -- -- -- -- --');
});

test('createPlaySummary keeps empty state labels specific to the play', () => {
  const summary = createPlaySummary(createEmptyPlayResult('dlt'));

  assert.deepEqual(summary.items.map((item) => item.label), [
    '前区和值',
    '前区跨度',
    '前区奇偶',
    '后区组合',
    '时间'
  ]);
});

test('createPlaySummary returns play-specific summary items', () => {
  const summary = createPlaySummary({
    gameId: 'fc3d',
    mode: 'default',
    groups: [
      { key: 'digits', values: [3, 3, 8], text: '3 3 8' }
    ],
    timeText: '21:08'
  });

  assert.equal(summary.title, '本次号码摘要');
  assert.deepEqual(summary.items, [
    { label: '三位和值', value: '14' },
    { label: '奇偶分布', value: '2:1' },
    { label: '重复情况', value: '3x2' },
    { label: '首尾差', value: '5' },
    { label: '时间', value: '21:08' }
  ]);
});

test('PLAY_TYPES exposes the five V2 play definitions', () => {
  assert.deepEqual(Object.keys(PLAY_TYPES), ['ssq', 'dlt', 'fc3d', 'kl8', 'pl5']);
  assert.equal(PLAY_TYPES.kl8.modes.length, 3);
});
