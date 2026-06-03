const {
  PLAY_TYPES,
  formatBall,
  formatPlayResult
} = require('./lottery');

const DEFAULT_HISTORY_LIMIT = 10;
const DEFAULT_TYPE = '双色球';
const CURRENT_SCHEMA_VERSION = 2;

function getPlay(gameId) {
  return PLAY_TYPES[gameId] || PLAY_TYPES.ssq;
}

function createHistoryRecord(options) {
  const timestamp = options.timestamp || Date.now();
  const gameId = options.gameId || 'ssq';
  const play = getPlay(gameId);
  const mode = options.mode || play.defaultMode || 'default';
  const groups = normalizeGroups(gameId, options.groups || createLegacyGroups(options));
  const display = options.display || formatPlayResult({ groups });
  const idValues = groups.map((group) => group.values.join('')).join('-');
  const legacy = createLegacyFields(gameId, groups);

  return {
    id: options.id || `${timestamp}-${gameId}-${mode}-${idValues}`,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    gameId,
    gameName: play.name,
    mode,
    modeLabel: options.modeLabel || getModeLabel(play, mode),
    type: options.type || play.shortName || DEFAULT_TYPE,
    label: options.label || '随机记录卡',
    timestamp,
    timeText: formatTime(timestamp),
    dateText: formatDate(timestamp),
    groups,
    display,
    ...legacy
  };
}

function normalizeHistory(history) {
  return (history || []).filter(Boolean).map((item) => {
    if (item.schemaVersion === CURRENT_SCHEMA_VERSION && item.groups) {
      return decorateExistingRecord(item);
    }

    if (item.reds && item.blue) {
      return createHistoryRecord({
        id: item.id,
        gameId: 'ssq',
        mode: 'default',
        groups: createLegacyGroups(item),
        timestamp: item.timestamp,
        label: safeLegacyLabel(item.label),
        type: item.type || DEFAULT_TYPE
      });
    }

    return decorateExistingRecord({
      ...item,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      gameId: item.gameId || 'ssq',
      mode: item.mode || 'default',
      groups: normalizeGroups(item.gameId || 'ssq', item.groups || [])
    });
  });
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

function filterHistoryByPlay(history, gameId, mode) {
  return (history || []).filter((item) => {
    if (!item || item.gameId !== gameId) {
      return false;
    }

    return !mode || item.mode === mode;
  });
}

function createHomeStats(history, now, gameId, mode) {
  const records = gameId ? filterHistoryByPlay(history || [], gameId, mode) : (history || []);
  const todayText = formatDate(now || Date.now());
  const todayCount = records.filter((item) => item && item.dateText === todayText).length;
  const latest = records[0];

  return {
    todayCountText: String(todayCount),
    latestTimeText: latest ? latest.timeText : '--:--',
    totalText: String(records.length)
  };
}

function getModeLabel(play, mode) {
  if (!play.modes) {
    return '';
  }

  const found = play.modes.find((item) => item.id === mode);
  return found ? found.label : '';
}

function normalizeGroups(gameId, groups) {
  const play = getPlay(gameId);
  const groupConfigs = play.groups || [];

  return (groups || []).map((group, index) => {
    const config = groupConfigs.find((item) => item.key === group.key) || groupConfigs[index] || {};
    const values = (group.values || []).slice();
    const textList = group.textList || values.map((value) => formatBall(value, config.pad || 2));

    return {
      key: group.key || config.key || `group-${index}`,
      label: group.label || config.label || '号码',
      values,
      textList,
      text: group.text || textList.join(' ')
    };
  });
}

function createLegacyGroups(options) {
  const reds = options.reds || [];
  const blue = options.blue === undefined ? [] : [options.blue];

  return [
    {
      key: 'red',
      label: '红球',
      values: reds.slice(),
      textList: reds.map((value) => formatBall(value)),
      text: reds.map((value) => formatBall(value)).join(' ')
    },
    {
      key: 'blue',
      label: '蓝球',
      values: blue,
      textList: blue.map((value) => formatBall(value)),
      text: blue.map((value) => formatBall(value)).join(' ')
    }
  ];
}

function createLegacyFields(gameId, groups) {
  if (gameId !== 'ssq') {
    return {};
  }

  const redGroup = groups.find((group) => group.key === 'red') || groups[0] || { values: [], textList: [], text: '' };
  const blueGroup = groups.find((group) => group.key === 'blue') || groups[1] || { values: [], textList: [], text: '' };

  return {
    reds: redGroup.values.slice(),
    blue: blueGroup.values[0],
    redsTextList: redGroup.textList.slice(),
    redsText: redGroup.text,
    blueText: blueGroup.text
  };
}

function decorateExistingRecord(record) {
  const gameId = record.gameId || 'ssq';
  const play = getPlay(gameId);
  const mode = record.mode || play.defaultMode || 'default';
  const groups = normalizeGroups(gameId, record.groups || []);
  const display = record.display || formatPlayResult({ groups });
  const legacy = createLegacyFields(gameId, groups);

  return {
    ...record,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    gameId,
    gameName: record.gameName || play.name,
    mode,
    modeLabel: record.modeLabel || getModeLabel(play, mode),
    type: record.type || play.shortName || DEFAULT_TYPE,
    label: safeLegacyLabel(record.label || '随机记录卡'),
    timeText: record.timeText || formatTime(record.timestamp),
    dateText: record.dateText || formatDate(record.timestamp),
    groups,
    display,
    ...legacy
  };
}

function safeLegacyLabel(label) {
  return String(label || '随机记录卡')
    .replace(/今日幸运票根/g, '随机记录卡')
    .replace(/今日好运票根/g, '随机记录卡')
    .replace(/幸运票根/g, '随机记录卡')
    .replace(/好运票根/g, '随机记录卡')
    .replace(/今日幸运/g, '随机数字')
    .replace(/开奖/g, '生成');
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
  CURRENT_SCHEMA_VERSION,
  createHistoryRecord,
  createHomeStats,
  filterHistoryByPlay,
  normalizeHistory,
  pushHistoryRecord
};
