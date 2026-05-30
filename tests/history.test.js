const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createHistoryRecord,
  createHomeStats,
  pushHistoryRecord
} = require('../miniprogram/utils/history');

test('createHistoryRecord stores display metadata for a lucky ticket', () => {
  const record = createHistoryRecord({
    reds: [2, 15, 16, 24, 26, 27],
    blue: 16,
    timestamp: 1780053600000,
    label: '今日欧气上上签'
  });

  assert.equal(record.type, '双色球');
  assert.equal(record.label, '今日欧气上上签');
  assert.equal(record.display, '02 15 16 24 26 27 | 16');
  assert.deepEqual(record.reds, [2, 15, 16, 24, 26, 27]);
  assert.equal(record.blue, 16);
  assert.ok(record.id.includes('1780053600000'));
});

test('pushHistoryRecord keeps newest records first and caps history', () => {
  const existing = Array.from({ length: 10 }, (_, index) => ({
    id: `old-${index}`,
    display: `old-${index}`
  }));
  const next = { id: 'newest', display: 'newest' };

  const result = pushHistoryRecord(existing, next, 10);

  assert.equal(result.length, 10);
  assert.equal(result[0].id, 'newest');
  assert.equal(result[9].id, 'old-8');
  assert.equal(result.some((item) => item.id === 'old-9'), false);
});

test('createHomeStats counts today records and latest history metadata', () => {
  const todayNewest = createHistoryRecord({
    reds: [2, 15, 16, 24, 26, 27],
    blue: 16,
    timestamp: new Date(2026, 4, 29, 20, 48).getTime()
  });
  const todayEarlier = createHistoryRecord({
    reds: [3, 5, 17, 20, 28, 31],
    blue: 9,
    timestamp: new Date(2026, 4, 29, 9, 12).getTime()
  });
  const yesterday = createHistoryRecord({
    reds: [1, 8, 14, 19, 22, 33],
    blue: 5,
    timestamp: new Date(2026, 4, 28, 23, 50).getTime()
  });

  const stats = createHomeStats(
    [todayNewest, todayEarlier, yesterday],
    new Date(2026, 4, 29, 21, 0).getTime()
  );

  assert.deepEqual(stats, {
    todayCountText: '2',
    latestTimeText: '20:48',
    totalText: '3'
  });
});
