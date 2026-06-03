const {
  PLAY_ORDER,
  PLAY_TYPES,
  createEmptyPlayResult,
  createPlaySummary,
  formatBall,
  formatPlayResult,
  generatePlayResult
} = require('../../utils/lottery');
const {
  createHistoryRecord,
  createHomeStats,
  filterHistoryByPlay,
  normalizeHistory,
  pushHistoryRecord
} = require('../../utils/history');

const HISTORY_KEY = 'LUCK7_HISTORY';
const HISTORY_LIMIT = 10;
const LEVER_TRIGGER = 28;
const TICKET_VISIBLE_COUNT = 3;
const TICKET_STEP_RPX = 96;
const TICKET_MARQUEE_INTERVAL = 2200;
const TICKET_MARQUEE_TRANSITION = 560;
const RECORD_LABELS = [
  '随机数字卡',
  '霓虹记录卡',
  '星盘记录完成',
  '数字已定格',
  '轻松记录卡',
  '今日生成记录'
];
const DEFAULT_GAME_ID = 'ssq';
const DEFAULT_MODE = 'default';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPlayList() {
  return PLAY_ORDER.map((id) => PLAY_TYPES[id]);
}

function createKl8Cells(selectedValues) {
  const selected = selectedValues || [];

  return Array.from({ length: 80 }, (_, index) => ({
    value: index + 1,
    text: formatBall(index + 1),
    selected: selected.includes(index + 1)
  }));
}

Page({
  data: {
    statusBarHeight: 0,
    todayText: '',
    bulbs: Array.from({ length: 12 }, (_, index) => index),
    particles: Array.from({ length: 72 }, (_, index) => {
      const left = (index * 23) % 100;
      const delay = (index % 24) * 0.18;
      const duration = 3.2 + (index % 5) * 0.28;
      const size = 10 + (index % 7) * 3;
      const color = ['#ff4d6d', '#ffd166', '#4f86ff', '#ffffff'][index % 4];
      return `left:${left}%;width:${size}rpx;height:${size}rpx;background:${color};color:${color};animation-delay:-${delay}s;animation-duration:${duration}s;`;
    }),
    plays: createPlayList(),
    activeGameId: DEFAULT_GAME_ID,
    activeMode: DEFAULT_MODE,
    activePlay: PLAY_TYPES[DEFAULT_GAME_ID],
    currentResult: createEmptyPlayResult(DEFAULT_GAME_ID, DEFAULT_MODE),
    kl8Cells: createKl8Cells(),
    digitPlaceholders3: ['百', '十', '个'],
    digitPlaceholders5: ['1', '2', '3', '4', '5'],
    phase: 'idle',
    phaseText: '等待随机生成',
    machineHint: '点击按钮生成一组数字',
    leverText: '下拉生成',
    startButtonText: '生成一组',
    leverAngle: 0,
    isDrawing: false,
    lockedCount: 0,
    lockedRedCount: 0,
    blueLocked: false,
    currentReds: ['--', '--', '--', '--', '--', '--'],
    currentBlue: '--',
    finalRecord: null,
    history: [],
    marqueeHistory: [],
    ticketMarqueeOffset: 0,
    ticketMarqueeTransition: true,
    ticketMarqueeEnabled: false,
    homeStats: {
      todayCountText: '0',
      latestTimeText: '--:--',
      totalText: '0'
    },
    activeHistory: [],
    currentSummary: createPlaySummary(createEmptyPlayResult(DEFAULT_GAME_ID, DEFAULT_MODE)),
    showResultModal: false,
    showTicketSheet: false,
    activeTicket: null
  },

  onLoad() {
    const system = wx.getSystemInfoSync();
    const rawHistory = wx.getStorageSync(HISTORY_KEY) || [];
    const normalizedHistory = normalizeHistory(rawHistory);
    const history = this.decorateHistory(normalizedHistory);
    const activeHistory = filterHistoryByPlay(history, this.data.activeGameId, this.data.activeMode);

    if (JSON.stringify(rawHistory) !== JSON.stringify(normalizedHistory)) {
      wx.setStorageSync(HISTORY_KEY, normalizedHistory);
    }

    this.setData({
      statusBarHeight: system.statusBarHeight || 0,
      todayText: this.getTodayText(),
      homeStats: createHomeStats(history, Date.now(), this.data.activeGameId, this.data.activeMode),
      history,
      activeHistory,
      ...this.getTicketMarqueeData(activeHistory)
    }, () => this.restartTicketMarquee(activeHistory.length));
  },

  onShow() {
    this.restartTicketMarquee((this.data.activeHistory || []).length);
  },

  onHide() {
    this.stopRolling();
    this.stopTicketMarquee();
  },

  onUnload() {
    this.stopRolling();
    this.stopTicketMarquee();
  },

  onShareAppMessage(event) {
    const recordId = event.target && event.target.dataset && event.target.dataset.recordId;
    const record = this.findRecord(recordId) || this.data.finalRecord;
    const display = record ? record.display : '随机数字卡';

    return {
      title: `LUCK7 随机号码卡：${display}`,
      path: '/pages/index/index'
    };
  },

  noop() {},

  getTodayText() {
    const date = new Date();
    return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  },

  onLeverTouchStart(event) {
    if (this.data.isDrawing) {
      return;
    }

    this.touchStartY = event.touches[0].clientY;
  },

  onLeverTouchMove(event) {
    if (this.data.isDrawing || this.touchStartY === undefined) {
      return;
    }

    const delta = Math.max(0, event.touches[0].clientY - this.touchStartY);
    const leverAngle = Math.min(42, Math.round(delta * 0.72));

    this.setData({
      leverAngle,
      leverText: leverAngle >= LEVER_TRIGGER ? '松手生成' : '向下拉'
    });
  },

  onLeverTouchEnd() {
    if (this.data.isDrawing) {
      return;
    }

    const shouldDraw = this.data.leverAngle >= LEVER_TRIGGER;
    this.touchStartY = undefined;

    if (shouldDraw) {
      this.startDraw();
      return;
    }

    this.setData({
      leverAngle: 0,
      leverText: '下拉生成'
    });
  },

  onLeverTap() {
    if (this.data.isDrawing) {
      return;
    }

    this.startDraw();
  },

  onStartButtonTap() {
    if (this.data.isDrawing) {
      return;
    }

    this.startDraw();
  },

  onPlayTap(event) {
    if (this.data.isDrawing) {
      return;
    }

    const gameId = event.currentTarget.dataset.gameId;
    const play = PLAY_TYPES[gameId];

    if (!play || gameId === this.data.activeGameId) {
      return;
    }

    const mode = play.defaultMode || 'default';
    const currentResult = createEmptyPlayResult(gameId, mode);
    const activeHistory = filterHistoryByPlay(this.data.history, gameId, mode);

    this.stopRolling();
    this.setData({
      activeGameId: gameId,
      activeMode: mode,
      activePlay: play,
      currentResult,
      kl8Cells: this.createKl8CellsForResult(currentResult),
      currentReds: this.getGroupTextList(currentResult, 0),
      currentBlue: this.getGroupText(currentResult, 1),
      currentSummary: createPlaySummary(currentResult),
      activeHistory,
      finalRecord: null,
      phase: 'idle',
      phaseText: '等待随机生成',
      machineHint: '点击按钮生成一组数字',
      leverText: '下拉生成',
      startButtonText: '生成一组',
      lockedCount: 0,
      lockedRedCount: 0,
      blueLocked: false,
      showResultModal: false,
      showTicketSheet: false,
      activeTicket: null,
      homeStats: createHomeStats(this.data.history, Date.now(), gameId, mode),
      ...this.getTicketMarqueeData(activeHistory)
    }, () => this.restartTicketMarquee(activeHistory.length));
  },

  onModeTap(event) {
    if (this.data.isDrawing) {
      return;
    }

    const mode = event.currentTarget.dataset.mode;

    if (!mode || mode === this.data.activeMode) {
      return;
    }

    const currentResult = createEmptyPlayResult(this.data.activeGameId, mode);
    const activeHistory = filterHistoryByPlay(this.data.history, this.data.activeGameId, mode);

    this.setData({
      activeMode: mode,
      currentResult,
      kl8Cells: this.createKl8CellsForResult(currentResult),
      currentSummary: createPlaySummary(currentResult),
      activeHistory,
      finalRecord: null,
      phase: 'idle',
      phaseText: '等待随机生成',
      machineHint: '点击按钮生成一组数字',
      startButtonText: '生成一组',
      lockedCount: 0,
      homeStats: createHomeStats(this.data.history, Date.now(), this.data.activeGameId, mode),
      ...this.getTicketMarqueeData(activeHistory)
    }, () => this.restartTicketMarquee(activeHistory.length));
  },

  async startDraw() {
    if (this.data.isDrawing) {
      return;
    }

    this.stopRolling();
    const result = generatePlayResult(this.data.activeGameId, this.data.activeMode);
    const display = formatPlayResult(result);
    const label = this.pickLuckyLabel();
    const record = this.decorateRecord(createHistoryRecord({
      gameId: result.gameId,
      mode: result.mode,
      modeLabel: result.modeLabel,
      groups: result.groups,
      display,
      label
    }));
    const emptyResult = createEmptyPlayResult(this.data.activeGameId, this.data.activeMode);

    this.setData({
      isDrawing: true,
      phase: 'drawing',
      phaseText: '随机生成中',
      machineHint: this.getDrawingHint(),
      leverText: '生成中',
      startButtonText: '生成中',
      leverAngle: 42,
      lockedCount: 0,
      lockedRedCount: 0,
      blueLocked: false,
      currentResult: emptyResult,
      kl8Cells: this.createKl8CellsForResult(emptyResult),
      currentReds: this.getGroupTextList(emptyResult, 0),
      currentBlue: this.getGroupText(emptyResult, 1),
      currentSummary: createPlaySummary(emptyResult),
      showResultModal: false,
      showTicketSheet: false,
      activeTicket: null
    });

    this.playHaptic('medium');
    await sleep(260);
    this.setData({ leverAngle: 0 });
    await sleep(380);

    this.startRolling(record);

    for (let i = 0; i < this.getTotalValueCount(record); i += 1) {
      await sleep(this.getLockDelay());
      this.setData({
        lockedCount: i + 1,
        lockedRedCount: Math.min(i + 1, 6),
        blueLocked: this.data.activeGameId === 'ssq' && i + 1 >= 7
      });
      this.playHaptic('light');
    }

    await sleep(520);
    this.stopRolling();
    this.setData({
      currentResult: this.createResultFromRecord(record),
      kl8Cells: this.createKl8CellsForResult(record),
      currentReds: this.getGroupTextList(record, 0),
      currentBlue: this.getGroupText(record, 1),
      blueLocked: true,
      phase: 'result',
      phaseText: '数字已定格',
      machineHint: '随机号码已生成'
    });
    this.playHaptic('heavy');

    await sleep(360);
    const previousRecord = (this.data.activeHistory || [])[0] || null;
    const history = pushHistoryRecord(this.data.history, record, HISTORY_LIMIT);
    const activeHistory = filterHistoryByPlay(history, this.data.activeGameId, this.data.activeMode);
    wx.setStorageSync(HISTORY_KEY, history);

    this.setData({
      history,
      activeHistory,
      finalRecord: record,
      currentSummary: createPlaySummary(record, previousRecord),
      homeStats: createHomeStats(history, Date.now(), this.data.activeGameId, this.data.activeMode),
      showResultModal: true,
      isDrawing: false,
      leverText: '下拉生成',
      startButtonText: '再生成一组',
      ...this.getTicketMarqueeData(activeHistory)
    }, () => this.restartTicketMarquee(activeHistory.length));
  },

  startRolling(record) {
    this.rollingTimer = setInterval(() => {
      const rollingResult = this.createRollingResult(record, this.data.lockedCount);

      this.setData({
        currentResult: rollingResult,
        kl8Cells: this.createKl8CellsForResult(rollingResult),
        currentReds: this.getGroupTextList(rollingResult, 0),
        currentBlue: this.getGroupText(rollingResult, 1)
      });
    }, 70);
  },

  stopRolling() {
    if (this.rollingTimer) {
      clearInterval(this.rollingTimer);
      this.rollingTimer = null;
    }
  },

  getDrawingHint() {
    const hints = {
      ssq: '红球依次定格，蓝球最后亮起',
      dlt: '前区光点旋转，后区双星落位',
      fc3d: '三位数字翻动后依次定格',
      kl8: '数字星幕扫描，随机点亮结果',
      pl5: '五位数字筒滚动后定格'
    };

    return hints[this.data.activeGameId] || '随机数字生成中';
  },

  getLockDelay() {
    const delays = {
      ssq: 390,
      dlt: 360,
      fc3d: 460,
      kl8: 170,
      pl5: 360
    };

    return delays[this.data.activeGameId] || 320;
  },

  getTotalValueCount(result) {
    return (result.groups || []).reduce((total, group) => total + (group.values || group.textList || []).length, 0);
  },

  createResultFromRecord(record) {
    return {
      gameId: record.gameId,
      gameName: record.gameName,
      mode: record.mode,
      modeLabel: record.modeLabel,
      groups: (record.groups || []).map((group) => ({
        key: group.key,
        label: group.label,
        values: (group.values || []).slice(),
        textList: (group.textList || []).slice(),
        text: group.text
      }))
    };
  },

  createRollingResult(record, lockedCount) {
    const play = PLAY_TYPES[record.gameId] || PLAY_TYPES.ssq;
    let globalIndex = 0;
    const groups = (record.groups || []).map((group, groupIndex) => {
      const config = (play.groups || [])[groupIndex] || {};
      const values = [];
      const textList = (group.textList || []).map((text, valueIndex) => {
        const isLocked = globalIndex < lockedCount;
        globalIndex += 1;
        if (isLocked && group.values && group.values[valueIndex] !== undefined) {
          values.push(group.values[valueIndex]);
        }
        return isLocked ? text : this.getRandomText(config);
      });

      return {
        key: group.key,
        label: group.label,
        values,
        textList,
        text: textList.join(' ')
      };
    });

    return {
      gameId: record.gameId,
      gameName: record.gameName,
      mode: record.mode,
      modeLabel: record.modeLabel,
      groups
    };
  },

  getRandomText(config) {
    const min = config.min === undefined ? 0 : config.min;
    const max = config.max === undefined ? 9 : config.max;
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    return formatBall(value, config.pad || 2);
  },

  getGroupTextList(result, index) {
    const group = result && result.groups && result.groups[index];
    return group && group.textList ? group.textList : [];
  },

  getGroupText(result, index) {
    const group = result && result.groups && result.groups[index];
    return group && group.text ? group.text : '--';
  },

  createKl8CellsForResult(result) {
    if (!result || result.gameId !== 'kl8' || !result.groups || !result.groups[0]) {
      return createKl8Cells();
    }

    return createKl8Cells(result.groups[0].values || []);
  },

  getTicketMarqueeData(history) {
    const ticketMarqueeEnabled = history.length > TICKET_VISIBLE_COUNT;
    const marqueeHistory = (ticketMarqueeEnabled ? history.concat(history) : history).map((item, index) => (
      Object.assign({}, item, {
        marqueeKey: `${item.id}-${index}`
      })
    ));

    return {
      marqueeHistory,
      ticketMarqueeEnabled,
      ticketMarqueeOffset: 0,
      ticketMarqueeTransition: true
    };
  },

  restartTicketMarquee(count) {
    this.stopTicketMarquee();
    this.ticketMarqueeIndex = 0;

    if (count <= TICKET_VISIBLE_COUNT) {
      return;
    }

    this.ticketMarqueeTimer = setInterval(() => {
      this.advanceTicketMarquee(count);
    }, TICKET_MARQUEE_INTERVAL);
  },

  advanceTicketMarquee(count) {
    const nextIndex = (this.ticketMarqueeIndex || 0) + 1;
    this.ticketMarqueeIndex = nextIndex;

    this.setData({
      ticketMarqueeTransition: true,
      ticketMarqueeOffset: nextIndex * TICKET_STEP_RPX
    });

    if (nextIndex < count) {
      return;
    }

    this.ticketMarqueeResetTimer = setTimeout(() => {
      this.ticketMarqueeIndex = 0;
      this.setData({
        ticketMarqueeTransition: false,
        ticketMarqueeOffset: 0
      });

      this.ticketMarqueeResumeTimer = setTimeout(() => {
        this.setData({ ticketMarqueeTransition: true });
      }, 40);
    }, TICKET_MARQUEE_TRANSITION);
  },

  stopTicketMarquee() {
    if (this.ticketMarqueeTimer) {
      clearInterval(this.ticketMarqueeTimer);
      this.ticketMarqueeTimer = null;
    }

    if (this.ticketMarqueeResetTimer) {
      clearTimeout(this.ticketMarqueeResetTimer);
      this.ticketMarqueeResetTimer = null;
    }

    if (this.ticketMarqueeResumeTimer) {
      clearTimeout(this.ticketMarqueeResumeTimer);
      this.ticketMarqueeResumeTimer = null;
    }
  },

  closeResultModal() {
    this.setData({ showResultModal: false });
  },

  drawAgain() {
    this.setData({ showResultModal: false });
    this.startDraw();
  },

  openTicketDetail(event) {
    const record = this.findRecord(event.currentTarget.dataset.id);

    if (!record) {
      return;
    }

    this.setData({
      activeTicket: record,
      showTicketSheet: true
    });
  },

  closeTicketSheet() {
    this.setData({
      showTicketSheet: false,
      activeTicket: null
    });
  },

  saveCurrentPoster() {
    if (this.data.finalRecord) {
      this.savePoster(this.data.finalRecord);
    }
  },

  saveActiveTicketPoster() {
    if (this.data.activeTicket) {
      this.savePoster(this.data.activeTicket);
    }
  },

  copyActiveTicket() {
    if (!this.data.activeTicket) {
      return;
    }

    wx.setClipboardData({
      data: this.data.activeTicket.display,
      success: () => {
        wx.showToast({
          title: '号码已复制',
          icon: 'success'
        });
      }
    });
  },

  savePoster(record) {
    wx.showLoading({ title: '生成中' });
    this.drawPoster(record, () => {
      wx.canvasToTempFilePath({
        canvasId: 'posterCanvas',
        width: 686,
        height: 900,
        destWidth: 686,
        destHeight: 900,
        success: (res) => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '已保存',
                icon: 'success'
              });
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({
                title: '开启相册权限后可保存',
                icon: 'none'
              });
            }
          });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({
            title: '保存失败，请稍后重试',
            icon: 'none'
          });
        }
      }, this);
    });
  },

  drawPoster(record, done) {
    const ctx = wx.createCanvasContext('posterCanvas', this);
    const groups = record.groups || [];

    ctx.setFillStyle('#090c16');
    ctx.fillRect(0, 0, 686, 900);

    const gradient = ctx.createLinearGradient(0, 0, 686, 900);
    gradient.addColorStop(0, '#222944');
    gradient.addColorStop(0.48, '#141827');
    gradient.addColorStop(1, '#090c16');
    ctx.setFillStyle(gradient);
    this.roundRect(ctx, 36, 36, 614, 828, 42);
    ctx.fill();

    ctx.setFillStyle('#ffd166');
    ctx.setFontSize(36);
    ctx.setTextAlign('center');
    ctx.fillText('LUCK7 · 随机数字卡', 343, 128);

    ctx.setFillStyle('#ffffff');
    ctx.setFontSize(48);
    ctx.fillText('号码已随机生成', 343, 210);

    ctx.setFillStyle('rgba(255,255,255,0.62)');
    ctx.setFontSize(26);
    ctx.fillText('可保存为记录卡，仅作娱乐记录。', 343, 260);

    ctx.setFillStyle('#ffd166');
    ctx.setFontSize(28);
    ctx.fillText(record.label, 343, 330);

    this.drawPosterGroups(ctx, groups);

    ctx.setFillStyle('rgba(255,255,255,0.12)');
    this.roundRect(ctx, 108, 560, 470, 96, 28);
    ctx.fill();

    ctx.setFillStyle('#ffffff');
    ctx.setFontSize(30);
    ctx.fillText(record.display, 343, 620);

    ctx.setFillStyle('rgba(255,255,255,0.52)');
    ctx.setFontSize(22);
    ctx.fillText(`${record.type} · ${record.dateText} ${record.timeText}`, 343, 724);
    ctx.fillText('仅用于随机数字生成，不提供购买、预测或结果查询服务。', 343, 778);

    ctx.draw(false, () => {
      setTimeout(done, 80);
    });
  },

  drawPosterGroups(ctx, groups) {
    const colors = {
      red: '#ff4d6d',
      blue: '#4f86ff',
      front: '#ffd166',
      back: '#55d7ff',
      digits: '#7fffd4',
      numbers: '#c77dff'
    };
    let y = groups.length > 1 ? 416 : 450;

    groups.forEach((group) => {
      const values = group.textList || [];
      const radius = values.length > 7 ? 22 : 28;
      const gap = values.length > 7 ? 50 : 68;
      const rowWidth = (values.length - 1) * gap;
      const startX = 343 - rowWidth / 2;

      ctx.setFillStyle('rgba(255,255,255,0.56)');
      ctx.setFontSize(22);
      ctx.fillText(group.label, 343, y - 44);

      values.forEach((text, index) => {
        this.drawPosterBall(ctx, startX + index * gap, y, radius, colors[group.key] || '#ffd166', text);
      });

      y += 104;
    });
  },

  drawPosterBall(ctx, x, y, radius, color, text) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.setFillStyle(color);
    ctx.fill();
    ctx.setFillStyle('#ffffff');
    ctx.setFontSize(24);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.fillText(text, x, y + 2);
    ctx.setTextBaseline('alphabetic');
  },

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  },

  findRecord(id) {
    if (!id) {
      return null;
    }

    return (this.data.history || []).find((item) => item.id === id) || null;
  },

  decorateHistory(history) {
    return history.map((record) => this.decorateRecord(record));
  },

  decorateRecord(record) {
    const groups = (record.groups || []).map((group) => ({
      key: group.key,
      label: group.label,
      values: (group.values || []).slice(),
      textList: (group.textList || (group.values || []).map((value) => formatBall(value))).slice(),
      text: group.text || (group.textList || (group.values || []).map((value) => formatBall(value))).join(' ')
    }));
    const redGroup = groups.find((group) => group.key === 'red') || groups[0] || { textList: [], text: '' };
    const blueGroup = groups.find((group) => group.key === 'blue') || groups[1] || { textList: [], text: '' };

    return Object.assign({}, record, {
      groups,
      display: record.display || formatPlayResult({ groups }),
      primaryText: groups[0] ? groups[0].text : '',
      secondaryText: groups[1] ? groups[1].text : '',
      marqueeKey: `${record.id}-${record.gameId}-${record.mode}`,
      redsTextList: redGroup.textList,
      redsText: redGroup.text,
      blueText: blueGroup.text
    });
  },

  pickLuckyLabel() {
    return RECORD_LABELS[Math.floor(Math.random() * RECORD_LABELS.length)];
  },

  playHaptic(type) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type });
    }
  }
});
