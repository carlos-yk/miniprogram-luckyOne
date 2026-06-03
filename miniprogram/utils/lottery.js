const PLAY_ORDER = ['ssq', 'dlt', 'fc3d', 'kl8', 'pl5'];

const PLAY_TYPES = {
  ssq: {
    id: 'ssq',
    name: '双色球',
    shortName: '双色球',
    ruleText: '6+1',
    accent: 'ssq',
    defaultMode: 'default',
    machineTitle: 'NEON REEL MACHINE',
    groups: [
      { key: 'red', label: '红球', count: 6, min: 1, max: 33, unique: true, sorted: true, pad: 2 },
      { key: 'blue', label: '蓝球', count: 1, min: 1, max: 16, unique: true, sorted: true, pad: 2 }
    ]
  },
  dlt: {
    id: 'dlt',
    name: '超级大乐透',
    shortName: '大乐透',
    ruleText: '5+2',
    accent: 'dlt',
    defaultMode: 'default',
    machineTitle: 'DUAL ORBIT DISK',
    groups: [
      { key: 'front', label: '前区', count: 5, min: 1, max: 35, unique: true, sorted: true, pad: 2 },
      { key: 'back', label: '后区', count: 2, min: 1, max: 12, unique: true, sorted: true, pad: 2 }
    ]
  },
  fc3d: {
    id: 'fc3d',
    name: '福彩3D',
    shortName: '3D',
    ruleText: '3位',
    accent: 'fc3d',
    defaultMode: 'default',
    machineTitle: 'THREE DIGIT FLIP',
    groups: [
      { key: 'digits', label: '数字', count: 3, min: 0, max: 9, unique: false, sorted: false, pad: 1 }
    ]
  },
  kl8: {
    id: 'kl8',
    name: '快乐8',
    shortName: '快乐8',
    ruleText: '选5/7/10',
    accent: 'kl8',
    defaultMode: 'select5',
    machineTitle: 'NUMBER STAR MATRIX',
    modes: [
      { id: 'select5', label: '选5', count: 5 },
      { id: 'select7', label: '选7', count: 7 },
      { id: 'select10', label: '选10', count: 10 }
    ],
    groups: [
      { key: 'numbers', label: '号码', count: 5, min: 1, max: 80, unique: true, sorted: true, pad: 2 }
    ]
  },
  pl5: {
    id: 'pl5',
    name: '排列5',
    shortName: '排列5',
    ruleText: '5位',
    accent: 'pl5',
    defaultMode: 'default',
    machineTitle: 'PASSWORD LOCK',
    groups: [
      { key: 'digits', label: '数字', count: 5, min: 0, max: 9, unique: false, sorted: false, pad: 1 }
    ]
  }
};

function formatBall(n, pad) {
  return String(n).padStart(pad || 2, '0');
}

function getPlayType(gameId) {
  const play = PLAY_TYPES[gameId];

  if (!play) {
    throw new Error(`Unknown play type: ${gameId}`);
  }

  return play;
}

function getPlayMode(play, modeId) {
  const mode = modeId || play.defaultMode || 'default';

  if (!play.modes) {
    return {
      id: mode,
      label: '',
      count: null
    };
  }

  const found = play.modes.find((item) => item.id === mode);

  if (!found) {
    throw new Error(`Unknown play mode: ${play.id}/${mode}`);
  }

  return found;
}

function getGroupCount(groupConfig, mode) {
  if (mode && mode.count && groupConfig.key === 'numbers') {
    return mode.count;
  }

  return groupConfig.count;
}

function pickNumbers(groupConfig, mode) {
  const count = getGroupCount(groupConfig, mode);
  const values = [];

  while (values.length < count) {
    const value = Math.floor(Math.random() * (groupConfig.max - groupConfig.min + 1)) + groupConfig.min;

    if (!groupConfig.unique || !values.includes(value)) {
      values.push(value);
    }
  }

  if (groupConfig.sorted) {
    values.sort((a, b) => a - b);
  }

  return values;
}

function decorateGroup(groupConfig, values) {
  const textList = values.map((value) => formatBall(value, groupConfig.pad));

  return {
    key: groupConfig.key,
    label: groupConfig.label,
    values: values.slice(),
    textList,
    text: textList.join(' ')
  };
}

function generatePlayResult(gameId, modeId) {
  const play = getPlayType(gameId);
  const mode = getPlayMode(play, modeId);
  const groups = play.groups.map((groupConfig) => decorateGroup(groupConfig, pickNumbers(groupConfig, mode)));

  return {
    gameId: play.id,
    gameName: play.name,
    mode: mode.id,
    modeLabel: mode.label || '',
    groups
  };
}

function createEmptyPlayResult(gameId, modeId) {
  const play = getPlayType(gameId);
  const mode = getPlayMode(play, modeId);
  const groups = play.groups.map((groupConfig) => {
    const count = getGroupCount(groupConfig, mode);
    const textList = Array.from({ length: count }, () => groupConfig.pad > 1 ? '--' : '-');

    return {
      key: groupConfig.key,
      label: groupConfig.label,
      values: [],
      textList,
      text: textList.join(' ')
    };
  });

  return {
    gameId: play.id,
    gameName: play.name,
    mode: mode.id,
    modeLabel: mode.label || '',
    groups
  };
}

function formatPlayResult(result) {
  return (result.groups || []).map((group) => group.text || '').join(' | ');
}

function sum(values) {
  return (values || []).reduce((total, n) => total + n, 0);
}

function countOdd(values) {
  return (values || []).filter((n) => n % 2 === 1).length;
}

function countBig(values, threshold) {
  return (values || []).filter((n) => n >= threshold).length;
}

function formatRatio(first, second) {
  return `${first}:${second}`;
}

function getRepeatText(values) {
  const counts = {};
  (values || []).forEach((value) => {
    counts[value] = (counts[value] || 0) + 1;
  });
  const repeated = Object.keys(counts).filter((key) => counts[key] > 1);

  if (!repeated.length) {
    return '无重复';
  }

  return repeated.map((key) => `${key}x${counts[key]}`).join(' ');
}

function createSummary(title, items) {
  const normalizedItems = items.map((item) => ({
    label: item.label,
    value: String(item.value)
  }));

  return {
    title,
    items: normalizedItems,
    sumText: normalizedItems[0] ? normalizedItems[0].value : '--',
    parityText: normalizedItems[1] ? normalizedItems[1].value : '--',
    sizeText: normalizedItems[2] ? normalizedItems[2].value : '--',
    timeText: normalizedItems[3] ? normalizedItems[3].value : '--:--'
  };
}

function createPlaySummary(result, previousRecord) {
  const gameId = result.gameId || 'ssq';
  const groups = result.groups || [];
  const primary = groups[0] || { values: [], text: '--' };
  const secondary = groups[1] || { values: [], text: '--' };
  const values = primary.values || [];
  const timeText = result.timeText || '--:--';

  if (!values.length) {
    return createSummary('本次号码摘要', getEmptySummaryItems(gameId, timeText));
  }

  if (gameId === 'dlt') {
    const oddCount = countOdd(values);
    const span = Math.max.apply(null, values) - Math.min.apply(null, values);

    return createSummary('本次号码摘要', [
      { label: '前区和值', value: sum(values) },
      { label: '前区跨度', value: span },
      { label: '前区奇偶', value: formatRatio(oddCount, values.length - oddCount) },
      { label: '后区组合', value: secondary.text || '--' },
      { label: '时间', value: timeText }
    ]);
  }

  if (gameId === 'fc3d') {
    const oddCount = countOdd(values);
    const edgeDiff = Math.abs(values[0] - values[values.length - 1]);

    return createSummary('本次号码摘要', [
      { label: '三位和值', value: sum(values) },
      { label: '奇偶分布', value: formatRatio(oddCount, values.length - oddCount) },
      { label: '重复情况', value: getRepeatText(values) },
      { label: '首尾差', value: edgeDiff },
      { label: '时间', value: timeText }
    ]);
  }

  if (gameId === 'kl8') {
    const rangeCounts = [0, 0, 0, 0];
    values.forEach((value) => {
      rangeCounts[Math.min(3, Math.floor((value - 1) / 20))] += 1;
    });
    const previousValues = previousRecord && previousRecord.groups && previousRecord.groups[0]
      ? previousRecord.groups[0].values
      : [];
    const repeated = values.filter((value) => previousValues.includes(value)).length;

    return createSummary('本次号码摘要', [
      { label: '选择数量', value: result.modeLabel || `${values.length}个` },
      { label: '和值', value: sum(values) },
      { label: '区间分布', value: rangeCounts.join('/') },
      { label: '重复记录', value: `${repeated}个` },
      { label: '时间', value: timeText }
    ]);
  }

  if (gameId === 'pl5') {
    const oddCount = countOdd(values);
    const bigCount = countBig(values, 5);

    return createSummary('本次号码摘要', [
      { label: '五位和值', value: sum(values) },
      { label: '奇偶分布', value: formatRatio(oddCount, values.length - oddCount) },
      { label: '大小分布', value: formatRatio(bigCount, values.length - bigCount) },
      { label: '重复数字', value: getRepeatText(values) },
      { label: '时间', value: timeText }
    ]);
  }

  const oddCount = countOdd(values);
  const bigCount = countBig(values, 17);

  return createSummary('本次号码摘要', [
    { label: '红球和值', value: sum(values) },
    { label: '红球奇偶', value: formatRatio(oddCount, values.length - oddCount) },
    { label: '红球大小', value: formatRatio(bigCount, values.length - bigCount) },
    { label: '蓝球', value: secondary.text || '--' },
    { label: '时间', value: timeText }
  ]);
}

function getEmptySummaryItems(gameId, timeText) {
  const items = {
    dlt: [
      { label: '前区和值', value: '--' },
      { label: '前区跨度', value: '--' },
      { label: '前区奇偶', value: '--' },
      { label: '后区组合', value: '--' },
      { label: '时间', value: timeText }
    ],
    fc3d: [
      { label: '三位和值', value: '--' },
      { label: '奇偶分布', value: '--' },
      { label: '重复情况', value: '--' },
      { label: '首尾差', value: '--' },
      { label: '时间', value: timeText }
    ],
    kl8: [
      { label: '选择数量', value: '--' },
      { label: '和值', value: '--' },
      { label: '区间分布', value: '--' },
      { label: '重复记录', value: '--' },
      { label: '时间', value: timeText }
    ],
    pl5: [
      { label: '五位和值', value: '--' },
      { label: '奇偶分布', value: '--' },
      { label: '大小分布', value: '--' },
      { label: '重复数字', value: '--' },
      { label: '时间', value: timeText }
    ],
    ssq: [
      { label: '红球和值', value: '--' },
      { label: '红球奇偶', value: '--' },
      { label: '红球大小', value: '--' },
      { label: '蓝球', value: '--' },
      { label: '时间', value: timeText }
    ]
  };

  return items[gameId] || items.ssq;
}

function generateSSQ() {
  const result = generatePlayResult('ssq');

  return {
    reds: result.groups[0].values,
    blue: result.groups[1].values[0]
  };
}

function formatSSQ(result) {
  return `${result.reds.map((value) => formatBall(value)).join(' ')} | ${formatBall(result.blue)}`;
}

function createSSQSummary(result) {
  const reds = result.reds || [];
  const oddCount = countOdd(reds);
  const bigCount = countBig(reds, 17);

  return {
    title: '本次号码摘要',
    sumText: String(sum(reds)),
    parityText: formatRatio(oddCount, reds.length - oddCount),
    sizeText: formatRatio(bigCount, reds.length - bigCount),
    timeText: result.timeText || '--:--'
  };
}

module.exports = {
  PLAY_ORDER,
  PLAY_TYPES,
  createEmptyPlayResult,
  createPlaySummary,
  createSSQSummary,
  formatBall,
  formatPlayResult,
  formatSSQ,
  generatePlayResult,
  generateSSQ,
  getPlayMode,
  getPlayType
};
