const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CURRENT_SCHEMA_VERSION,
  createHistoryRecord,
  createHomeStats,
  filterHistoryByPlay,
  normalizeHistory,
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
  assert.equal(record.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(record.gameId, 'ssq');
  assert.equal(record.label, '今日欧气上上签');
  assert.equal(record.display, '02 15 16 24 26 27 | 16');
  assert.deepEqual(record.reds, [2, 15, 16, 24, 26, 27]);
  assert.equal(record.blue, 16);
  assert.equal(record.groups[0].text, '02 15 16 24 26 27');
  assert.equal(record.groups[1].text, '16');
  assert.ok(record.id.includes('1780053600000'));
});

test('createHistoryRecord stores generic play groups', () => {
  const record = createHistoryRecord({
    gameId: 'dlt',
    mode: 'default',
    groups: [
      { key: 'front', label: '前区', values: [1, 8, 13, 24, 35], text: '01 08 13 24 35' },
      { key: 'back', label: '后区', values: [2, 12], text: '02 12' }
    ],
    display: '01 08 13 24 35 | 02 12',
    timestamp: 1780053600000,
    label: '星盘记录完成'
  });

  assert.equal(record.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(record.gameId, 'dlt');
  assert.equal(record.type, '大乐透');
  assert.equal(record.display, '01 08 13 24 35 | 02 12');
  assert.equal(record.groups[0].text, '01 08 13 24 35');
  assert.equal(record.groups[1].text, '02 12');
});

test('normalizeHistory migrates old ssq records', () => {
  const oldRecord = {
    id: 'legacy-1',
    type: '双色球',
    label: '今日幸运票根',
    timestamp: 1780053600000,
    timeText: '20:40',
    dateText: '05.29',
    reds: [2, 15, 16, 24, 26, 27],
    blue: 16,
    display: '02 15 16 24 26 27 | 16'
  };

  const result = normalizeHistory([oldRecord]);

  assert.equal(result[0].schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(result[0].gameId, 'ssq');
  assert.equal(result[0].id, 'legacy-1');
  assert.equal(result[0].label, '随机记录卡');
  assert.equal(result[0].groups[0].key, 'red');
  assert.deepEqual(result[0].groups[0].values, [2, 15, 16, 24, 26, 27]);
  assert.equal(result[0].groups[1].text, '16');
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

test('filterHistoryByPlay and createHomeStats can scope records to a play', () => {
  const ssqRecord = createHistoryRecord({
    reds: [2, 15, 16, 24, 26, 27],
    blue: 16,
    timestamp: new Date(2026, 4, 29, 20, 48).getTime()
  });
  const dltRecord = createHistoryRecord({
    gameId: 'dlt',
    groups: [
      { key: 'front', label: '前区', values: [1, 8, 13, 24, 35], text: '01 08 13 24 35' },
      { key: 'back', label: '后区', values: [2, 12], text: '02 12' }
    ],
    display: '01 08 13 24 35 | 02 12',
    timestamp: new Date(2026, 4, 29, 21, 10).getTime()
  });

  const history = [dltRecord, ssqRecord];

  assert.deepEqual(filterHistoryByPlay(history, 'dlt'), [dltRecord]);
  assert.deepEqual(createHomeStats(history, new Date(2026, 4, 29, 22, 0).getTime(), 'dlt'), {
    todayCountText: '1',
    latestTimeText: '21:10',
    totalText: '1'
  });
});
