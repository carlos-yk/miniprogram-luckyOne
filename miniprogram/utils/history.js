const { formatSSQ } = require('./lottery');

const DEFAULT_HISTORY_LIMIT = 10;
const DEFAULT_TYPE = '双色球';

function createHistoryRecord(options) {
  const timestamp = options.timestamp || Date.now();
  const result = {
    reds: options.reds.slice(),
    blue: options.blue
  };

  return {
    id: `${timestamp}-${result.reds.join('')}-${result.blue}`,
    type: options.type || DEFAULT_TYPE,
    label: options.label || '今日幸运票根',
    timestamp,
    timeText: formatTime(timestamp),
    dateText: formatDate(timestamp),
    reds: result.reds,
    blue: result.blue,
    display: formatSSQ(result)
  };
}

function pushHistoryRecord(history, record, limit) {
  const max = limit || DEFAULT_HISTORY_LIMIT;
  const next = [record].concat(history || []);
  const unique = [];
  const seen = {};

  next.forEach((item) => {
    if (!item || seen[item.id]) {
      return;
    }

    seen[item.id] = true;
    unique.push(item);
  });

  return unique.slice(0, max);
}

function createHomeStats(history, now) {
  const records = history || [];
  const todayText = formatDate(now || Date.now());
  const todayCount = records.filter((item) => item && item.dateText === todayText).length;
  const latest = records[0];

  return {
    todayCountText: String(todayCount),
    latestTimeText: latest ? latest.timeText : '--:--',
    totalText: String(records.length)
  };
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

module.exports = {
  DEFAULT_HISTORY_LIMIT,
  createHistoryRecord,
  createHomeStats,
  pushHistoryRecord
};
