const { createSSQSummary, formatBall, generateSSQ } = require('../../utils/lottery');
const { createHistoryRecord, createHomeStats, pushHistoryRecord } = require('../../utils/history');

const HISTORY_KEY = 'LUCK7_HISTORY';
const HISTORY_LIMIT = 10;
const LEVER_TRIGGER = 28;
const TICKET_VISIBLE_COUNT = 3;
const TICKET_STEP_RPX = 96;
const TICKET_MARQUEE_INTERVAL = 2200;
const TICKET_MARQUEE_TRANSITION = 560;
const LUCKY_LABELS = [
  '今日欧气上上签',
  '接好运专用票',
  '蓝球高光时刻',
  '幸运频率 77%',
  '今日手气正旺',
  '好运正在靠近'
];
const EMPTY_SUMMARY = {
  title: '本次号码摘要',
  sumText: '--',
  parityText: '--',
  sizeText: '--',
  timeText: '--:--'
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    phase: 'idle',
    phaseText: '等待今日好运',
    machineHint: '下拉右侧摇杆开奖',
    leverText: '下拉开奖',
    startButtonText: '点击开奖',
    leverAngle: 0,
    isDrawing: false,
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
    currentSummary: EMPTY_SUMMARY,
    showResultModal: false,
    showTicketSheet: false,
    activeTicket: null
  },

  onLoad() {
    const system = wx.getSystemInfoSync();
    const history = this.decorateHistory(wx.getStorageSync(HISTORY_KEY) || []);

    this.setData({
      statusBarHeight: system.statusBarHeight || 0,
      todayText: this.getTodayText(),
      homeStats: createHomeStats(history),
      history,
      ...this.getTicketMarqueeData(history)
    }, () => this.restartTicketMarquee(history.length));
  },

  onShow() {
    this.restartTicketMarquee((this.data.history || []).length);
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
    const display = record ? record.display : '今天的好运，就这一注';

    return {
      title: `LUCK7 今日幸运号码：${display}`,
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
      leverText: leverAngle >= LEVER_TRIGGER ? '松手开奖' : '向下拉'
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
      leverText: '下拉开奖'
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

  async startDraw() {
    if (this.data.isDrawing) {
      return;
    }

    this.stopRolling();
    const result = generateSSQ();
    const label = this.pickLuckyLabel();
    const record = this.decorateRecord(createHistoryRecord({
      reds: result.reds,
      blue: result.blue,
      label
    }));

    this.setData({
      isDrawing: true,
      phase: 'drawing',
      phaseText: '好运滚动中',
      machineHint: '跑马灯加速，等待蓝球压轴',
      leverText: '开奖中',
      startButtonText: '开奖中',
      leverAngle: 42,
      lockedRedCount: 0,
      blueLocked: false,
      currentSummary: EMPTY_SUMMARY,
      showResultModal: false,
      showTicketSheet: false,
      activeTicket: null
    });

    this.playHaptic('medium');
    await sleep(260);
    this.setData({ leverAngle: 0 });
    await sleep(380);

    this.startRolling(record);

    for (let i = 0; i < 6; i += 1) {
      await sleep(420);
      this.setData({ lockedRedCount: i + 1 });
      this.playHaptic('light');
    }

    await sleep(900);
    this.stopRolling();
    this.setData({
      currentReds: record.redsTextList,
      currentBlue: record.blueText,
      blueLocked: true,
      phase: 'result',
      phaseText: '今日好运已定格',
      machineHint: '好运已经降临'
    });
    this.playHaptic('heavy');

    await sleep(360);
    const history = pushHistoryRecord(this.data.history, record, HISTORY_LIMIT);
    wx.setStorageSync(HISTORY_KEY, history);

    this.setData({
      history,
      finalRecord: record,
      currentSummary: createSSQSummary(record),
      homeStats: createHomeStats(history),
      showResultModal: true,
      isDrawing: false,
      leverText: '下拉开奖',
      startButtonText: '再摇一注',
      ...this.getTicketMarqueeData(history)
    }, () => this.restartTicketMarquee(history.length));
  },

  startRolling(record) {
    this.rollingTimer = setInterval(() => {
      const locked = this.data.lockedRedCount;
      const currentReds = record.redsTextList.map((value, index) => {
        if (index < locked) {
          return value;
        }

        return formatBall(Math.floor(Math.random() * 33) + 1);
      });
      const currentBlue = this.data.blueLocked
        ? record.blueText
        : formatBall(Math.floor(Math.random() * 16) + 1);

      this.setData({
        currentReds,
        currentBlue
      });
    }, 70);
  },

  stopRolling() {
    if (this.rollingTimer) {
      clearInterval(this.rollingTimer);
      this.rollingTimer = null;
    }
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
    const reds = record.redsTextList;

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
    ctx.fillText('LUCK7 · 今日一注', 343, 128);

    ctx.setFillStyle('#ffffff');
    ctx.setFontSize(48);
    ctx.fillText('今日幸运号码', 343, 210);

    ctx.setFillStyle('rgba(255,255,255,0.62)');
    ctx.setFontSize(26);
    ctx.fillText('今天的好运，就这一注。', 343, 260);

    ctx.setFillStyle('#ffd166');
    ctx.setFontSize(28);
    ctx.fillText(record.label, 343, 330);

    reds.forEach((n, index) => {
      this.drawPosterBall(ctx, 104 + index * 76, 445, 28, '#ff4d6d', n);
    });
    this.drawPosterBall(ctx, 570, 445, 32, '#4f86ff', record.blueText);

    ctx.setFillStyle('rgba(255,255,255,0.12)');
    this.roundRect(ctx, 108, 560, 470, 96, 28);
    ctx.fill();

    ctx.setFillStyle('#ffffff');
    ctx.setFontSize(30);
    ctx.fillText(record.display, 343, 620);

    ctx.setFillStyle('rgba(255,255,255,0.52)');
    ctx.setFontSize(22);
    ctx.fillText(`${record.type} · ${record.dateText} ${record.timeText}`, 343, 724);
    ctx.fillText('号码随机生成，仅供娱乐。购彩请理性。', 343, 778);

    ctx.draw(false, () => {
      setTimeout(done, 80);
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
    const redsTextList = record.reds.map(formatBall);
    const blueText = formatBall(record.blue);

    return Object.assign({}, record, {
      redsTextList,
      redsText: redsTextList.join(' '),
      blueText
    });
  },

  pickLuckyLabel() {
    return LUCKY_LABELS[Math.floor(Math.random() * LUCKY_LABELS.length)];
  },

  playHaptic(type) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type });
    }
  }
});
