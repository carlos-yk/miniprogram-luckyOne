# LUCK7 V2.0 Multi-Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build LUCK7 V2.0 so the homepage supports 双色球、超级大乐透、福彩3D、快乐8、排列5 with play switching, play-specific random generation, objective summaries, per-play local records, and safer audit copy.

**Architecture:** Replace the current hard-coded 双色球 model with a small config-driven play engine. Keep the homepage as a single primary screen with a shared shell and play-specific inner stages. Preserve existing storage through a migration path from the old `reds/blue` record shape to a generic `groups` record shape.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JS, CommonJS utilities, `node:test`, local `wx` storage APIs.

---

## File Map

- Modify: `miniprogram/utils/lottery.js`
  - Owns play configuration, number generation, formatting, and summaries.
- Modify: `miniprogram/utils/history.js`
  - Owns generic history records, old 双色球 migration, filtering, stats, and capped insertion.
- Modify: `miniprogram/pages/index/index.js`
  - Owns active play state, generation flow, animation timers, record actions, and poster/share behavior.
- Modify: `miniprogram/pages/index/index.wxml`
  - Adds play switcher, generic result rendering, and play-specific stage markup.
- Modify: `miniprogram/pages/index/index.wxss`
  - Adds shared V2 layout styles plus distinct stage styles for each play.
- Modify: `tests/lottery.test.js`
  - Covers play generation, formatting, summaries.
- Modify: `tests/history.test.js`
  - Covers generic records, migration, filtering, stats.

## Task 1: Play Config And Generation Engine

**Files:**
- Modify: `miniprogram/utils/lottery.js`
- Modify: `tests/lottery.test.js`

- [ ] **Step 1: Add failing tests for all play generators**

Add tests that import `PLAY_TYPES`, `generatePlayResult`, `formatPlayResult`, and `createPlaySummary`.

```js
test('generatePlayResult creates valid multi-play results', () => {
  const cases = [
    { gameId: 'ssq', groupLengths: [6, 1], ranges: [[1, 33], [1, 16]] },
    { gameId: 'dlt', groupLengths: [5, 2], ranges: [[1, 35], [1, 12]] },
    { gameId: 'fc3d', groupLengths: [3], ranges: [[0, 9]] },
    { gameId: 'kl8', mode: 'select10', groupLengths: [10], ranges: [[1, 80]] },
    { gameId: 'pl5', groupLengths: [5], ranges: [[0, 9]] }
  ];

  cases.forEach((item) => {
    const result = generatePlayResult(item.gameId, item.mode);
    assert.equal(result.gameId, item.gameId);
    assert.equal(result.groups.length, item.groupLengths.length);

    item.groupLengths.forEach((length, index) => {
      const values = result.groups[index].values;
      const range = item.ranges[index];
      assert.equal(values.length, length);
      assert.ok(values.every((n) => n >= range[0] && n <= range[1]));
    });
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run: `npm test`

Expected: FAIL because `generatePlayResult` and related exports do not exist yet.

- [ ] **Step 3: Implement play config and generic generator**

Add a config object with these IDs:

```js
const PLAY_TYPES = {
  ssq: {
    id: 'ssq',
    name: '双色球',
    shortName: '双色球',
    ruleText: '6+1',
    accent: 'ssq',
    defaultMode: 'default',
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
    groups: [
      { key: 'digits', label: '数字', count: 5, min: 0, max: 9, unique: false, sorted: false, pad: 1 }
    ]
  }
};
```

Implement:

```js
function getPlayType(gameId) {}
function getPlayMode(play, modeId) {}
function generatePlayResult(gameId, modeId) {}
function formatPlayResult(result) {}
function createPlaySummary(result, previousRecord) {}
```

Keep compatibility exports:

```js
function generateSSQ() {
  const result = generatePlayResult('ssq');
  return {
    reds: result.groups[0].values,
    blue: result.groups[1].values[0]
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS for existing tests plus new generation tests.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/utils/lottery.js tests/lottery.test.js
git commit -m "feat: add multi-play lottery engine"
```

## Task 2: Generic History Schema And Migration

**Files:**
- Modify: `miniprogram/utils/history.js`
- Modify: `tests/history.test.js`

- [ ] **Step 1: Add failing tests for generic records and old record migration**

Add tests:

```js
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

  assert.equal(record.schemaVersion, 2);
  assert.equal(record.gameId, 'dlt');
  assert.equal(record.type, '大乐透');
  assert.equal(record.display, '01 08 13 24 35 | 02 12');
});

test('normalizeHistory migrates old ssq records', () => {
  const oldRecord = createHistoryRecord({
    reds: [2, 15, 16, 24, 26, 27],
    blue: 16,
    timestamp: 1780053600000
  });

  delete oldRecord.schemaVersion;
  const result = normalizeHistory([oldRecord]);

  assert.equal(result[0].schemaVersion, 2);
  assert.equal(result[0].gameId, 'ssq');
  assert.equal(result[0].groups[0].key, 'red');
  assert.deepEqual(result[0].groups[0].values, [2, 15, 16, 24, 26, 27]);
});
```

- [ ] **Step 2: Run the failing tests**

Run: `npm test`

Expected: FAIL because `normalizeHistory` and the generic record shape are not implemented.

- [ ] **Step 3: Implement generic history helpers**

Add:

```js
function normalizeHistory(history) {}
function filterHistoryByPlay(history, gameId, mode) {}
function createHomeStats(history, now, gameId) {}
```

Rules:

- New records use `schemaVersion: 2`.
- Old records with `reds` and `blue` become `gameId: 'ssq'`.
- Keep old convenience fields for UI compatibility where cheap: `reds`, `blue`, `redsText`, `blueText`, `redsTextList`.
- `createHomeStats(history, now, gameId)` counts active-play records when `gameId` is provided, otherwise all records.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/utils/history.js tests/history.test.js
git commit -m "feat: add generic play history"
```

## Task 3: Homepage State Refactor For Active Play

**Files:**
- Modify: `miniprogram/pages/index/index.js`

- [ ] **Step 1: Refactor imports and data defaults**

Change imports to use generic helpers:

```js
const {
  PLAY_ORDER,
  PLAY_TYPES,
  createEmptyPlayResult,
  createPlaySummary,
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
```

Add data:

```js
activeGameId: 'ssq',
activeMode: 'default',
plays: PLAY_ORDER.map((id) => PLAY_TYPES[id]),
activePlay: PLAY_TYPES.ssq,
currentResult: createEmptyPlayResult('ssq'),
currentSummary: createPlaySummary(createEmptyPlayResult('ssq')),
activeHistory: []
```

- [ ] **Step 2: Load and normalize history**

In `onLoad`, replace direct storage read with:

```js
const storedHistory = wx.getStorageSync(HISTORY_KEY) || [];
const history = this.decorateHistory(normalizeHistory(storedHistory));
const activeHistory = filterHistoryByPlay(history, this.data.activeGameId, this.data.activeMode);
```

Persist normalized history back to storage when migration changed the shape.

- [ ] **Step 3: Add play switch handler**

Implement:

```js
onPlayTap(event) {
  if (this.data.isDrawing) {
    return;
  }

  const gameId = event.currentTarget.dataset.gameId;
  const play = PLAY_TYPES[gameId];
  const mode = play.defaultMode;
  const currentResult = createEmptyPlayResult(gameId, mode);
  const activeHistory = filterHistoryByPlay(this.data.history, gameId, mode);

  this.setData({
    activeGameId: gameId,
    activeMode: mode,
    activePlay: play,
    currentResult,
    currentSummary: createPlaySummary(currentResult),
    activeHistory,
    finalRecord: null,
    phase: 'idle',
    phaseText: '等待随机生成',
    machineHint: '点击按钮生成一组数字',
    startButtonText: '生成一组',
    ...this.getTicketMarqueeData(activeHistory)
  }, () => this.restartTicketMarquee(activeHistory.length));
}
```

- [ ] **Step 4: Update `startDraw` to use active play**

Replace `generateSSQ()` and `createSSQSummary()` with:

```js
const result = generatePlayResult(this.data.activeGameId, this.data.activeMode);
const record = this.decorateRecord(createHistoryRecord({
  gameId: result.gameId,
  mode: result.mode,
  groups: result.groups,
  display: formatPlayResult(result),
  label
}));
```

When saving:

```js
const history = pushHistoryRecord(this.data.history, record, HISTORY_LIMIT);
const activeHistory = filterHistoryByPlay(history, this.data.activeGameId, this.data.activeMode);
```

Update stats and marquee from `activeHistory`.

- [ ] **Step 5: Run syntax and tests**

Run:

```bash
node --check miniprogram/pages/index/index.js
npm test
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/index/index.js
git commit -m "feat: add active play state"
```

## Task 4: Homepage Markup For Play Switcher And Generic Records

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.js`

- [ ] **Step 1: Add play switcher markup**

Insert between stats and machine:

```xml
<scroll-view class="play-switcher" scroll-x enable-flex>
  <view class="play-tabs">
    <view
      wx:for="{{plays}}"
      wx:key="id"
      class="play-tab {{activeGameId === item.id ? 'active' : ''}} play-tab-{{item.accent}}"
      data-game-id="{{item.id}}"
      bindtap="onPlayTap"
    >
      <text class="play-tab-name">{{item.shortName}}</text>
      <text class="play-tab-rule">{{item.ruleText}}</text>
    </view>
  </view>
</scroll-view>
```

- [ ] **Step 2: Replace hard-coded date chip play name**

Use:

```xml
<text>{{todayText}}</text>
<text>{{activePlay.shortName}}</text>
```

- [ ] **Step 3: Replace history title and list source**

Use `activeHistory` for counts and empty state:

```xml
<text>最近记录</text>
<text>{{activeHistory.length}} / 10</text>
```

Change empty text:

```xml
<text>{{activePlay.shortName}}</text>
<text>等待生成</text>
<view class="ticket-label">点击生成，保存第一张记录卡</view>
```

- [ ] **Step 4: Update result modal and sheet copy**

Replace:

- `今日幸运号码` with `号码已随机生成`
- `好运已经降临，记得分享给朋友～` with `可保存为记录卡，仅作娱乐记录`
- `再来一注` with `再生成一组`
- `历史幸运票根` with `历史记录卡`
- `保存好运图` with `保存记录图`

- [ ] **Step 5: Run WXML balance check and tests**

Run:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('miniprogram/pages/index/index.wxml','utf8');const opens=(s.match(/<view\\b/g)||[]).length;const closes=(s.match(/<\\/view>/g)||[]).length;if(opens!==closes){throw new Error(`${opens} opens vs ${closes} closes`)}"
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/index/index.wxml miniprogram/pages/index/index.js
git commit -m "feat: add homepage play switcher"
```

## Task 5: Shared V2 Layout Styles

**Files:**
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] **Step 1: Add play switcher styles**

Add:

```css
.play-switcher {
  height: 104rpx;
  flex-shrink: 0;
  margin-top: 18rpx;
  white-space: nowrap;
}

.play-tabs {
  display: flex;
  gap: 14rpx;
  padding: 0 2rpx 8rpx;
}

.play-tab {
  width: 148rpx;
  height: 88rpx;
  padding: 14rpx 16rpx;
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.055);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.play-tab.active {
  border-color: rgba(255, 209, 102, 0.42);
  background: rgba(255, 209, 102, 0.12);
  box-shadow: 0 0 28rpx rgba(255, 209, 102, 0.18);
}

.play-tab-name {
  color: rgba(255, 255, 255, 0.88);
  font-size: 24rpx;
  font-weight: 900;
}

.play-tab-rule {
  margin-top: 6rpx;
  color: rgba(255, 255, 255, 0.44);
  font-size: 18rpx;
}
```

- [ ] **Step 2: Adjust layout heights**

Because the play switcher adds vertical space, reduce the machine/history heights carefully:

```css
.brand-row {
  height: 144rpx;
}

.machine-shell {
  height: 35vh;
  min-height: 440rpx;
  max-height: 510rpx;
  margin-top: 16rpx;
}

.history-section {
  height: 330rpx;
}
```

- [ ] **Step 3: Run static checks**

Run: `npm test`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/index/index.wxss
git commit -m "style: add v2 homepage layout"
```

## Task 6: Play-Specific Stage Markup And Styles

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`
- Modify: `miniprogram/pages/index/index.js`

- [ ] **Step 1: Add stage data helpers**

In `index.js`, add data arrays:

```js
kl8Cells: Array.from({ length: 80 }, (_, index) => ({
  value: index + 1,
  text: String(index + 1).padStart(2, '0')
})),
digitPlaceholders3: ['百', '十', '个'],
digitPlaceholders5: ['1', '2', '3', '4', '5']
```

- [ ] **Step 2: Add conditional stage markup**

Keep the shared shell. Inside the stage, render:

- `ssq`: existing reel panel and lever.
- `dlt`: orbit rings and front/back result chips.
- `fc3d`: three flip windows.
- `kl8`: mode segmented control, 80-cell matrix, result cloud.
- `pl5`: five password reels.

Use `wx:if="{{activeGameId === 'ssq'}}"` and matching `wx:elif` blocks.

- [ ] **Step 3: Add KL8 mode handler**

Implement:

```js
onModeTap(event) {
  if (this.data.isDrawing) {
    return;
  }

  const mode = event.currentTarget.dataset.mode;
  const currentResult = createEmptyPlayResult(this.data.activeGameId, mode);
  const activeHistory = filterHistoryByPlay(this.data.history, this.data.activeGameId, mode);

  this.setData({
    activeMode: mode,
    currentResult,
    activeHistory,
    currentSummary: createPlaySummary(currentResult),
    ...this.getTicketMarqueeData(activeHistory)
  }, () => this.restartTicketMarquee(activeHistory.length));
}
```

- [ ] **Step 4: Add stage styles**

Add distinct classes:

- `.stage-orbit`, `.orbit-ring`, `.orbit-chip`, `.back-star`
- `.stage-flip`, `.flip-digit`
- `.stage-matrix`, `.kl8-mode-tabs`, `.matrix-cell`, `.result-cloud`
- `.stage-password`, `.password-digit`, `.scan-line`

Each stage must fit inside the existing `machine-shell` without changing external spacing.

- [ ] **Step 5: Run syntax, WXML, tests**

Run:

```bash
node --check miniprogram/pages/index/index.js
node -e "const fs=require('fs');const s=fs.readFileSync('miniprogram/pages/index/index.wxml','utf8');const opens=(s.match(/<view\\b/g)||[]).length;const closes=(s.match(/<\\/view>/g)||[]).length;if(opens!==closes){throw new Error(`${opens} opens vs ${closes} closes`)}"
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/index/index.js miniprogram/pages/index/index.wxml miniprogram/pages/index/index.wxss
git commit -m "feat: add distinct play stages"
```

## Task 7: Generic Result Modal, Sheet, Poster, And Share

**Files:**
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`

- [ ] **Step 1: Update record decorators**

Ensure `decorateRecord(record)` returns:

```js
{
  ...record,
  marqueeKey: `${record.id}-${record.gameId}-${record.mode}`,
  primaryText: record.groups[0] ? record.groups[0].text : '',
  secondaryText: record.groups[1] ? record.groups[1].text : '',
  modeText: record.modeLabel || ''
}
```

Keep `redsTextList` and `blueText` only for old 双色球-compatible rendering.

- [ ] **Step 2: Update modal and sheet to render generic groups**

Use:

```xml
<view class="result-group" wx:for="{{finalRecord.groups}}" wx:key="key">
  <text class="result-group-label">{{item.label}}</text>
  <view class="result-group-values">
    <view wx:for="{{item.textList}}" wx:key="index" class="result-ball {{item.key}}">
      <text>{{item}}</text>
    </view>
  </view>
</view>
```

- [ ] **Step 3: Update share title**

Use:

```js
title: `LUCK7 随机号码卡：${display}`,
path: '/pages/index/index'
```

- [ ] **Step 4: Update copy/poster text**

Poster title should use `随机号码卡`.

Safety line should use:

```js
const note = '仅用于随机数字生成与娱乐记录，不提供交易、建议或结果查询服务。';
```

- [ ] **Step 5: Run checks**

Run:

```bash
node --check miniprogram/pages/index/index.js
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/index/index.js miniprogram/pages/index/index.wxml
git commit -m "feat: generalize result records"
```

## Task 8: Audit-Safe Copy Pass

**Files:**
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] **Step 1: Search high-risk copy**

Run:

```bash
rg -n "开奖|一注|票根|中奖|命中|预测|推荐|投注|购彩|稳赚|概率|频率" miniprogram/pages miniprogram/utils
```

Expected remaining risky terms only appear in tests or compatibility comments, not UI copy.

- [ ] **Step 2: Replace UI copy**

Replace:

- `今日一注` -> `随机数字卡`
- `开奖中` -> `生成中`
- `点击开奖` -> `生成一组`
- `下拉开奖` -> `下拉生成`
- `再来一注` -> `再生成一组`
- `最近好运票根` -> `最近记录`
- `历史幸运票根` -> `历史记录卡`
- `今日幸运号码` -> `号码已随机生成`
- `购彩请理性` -> `不提供交易、建议或结果查询服务`

- [ ] **Step 3: Run copy search again**

Run:

```bash
rg -n "开奖|一注|票根|中奖|命中|预测|推荐|投注|购彩|稳赚|概率|频率" miniprogram/pages miniprogram/utils
```

Expected: no high-risk terms in user-facing UI strings.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/pages/index/index.js miniprogram/pages/index/index.wxml miniprogram/pages/index/index.wxss
git commit -m "chore: make copy audit safe"
```

## Task 9: Final Verification

**Files:**
- No planned source edits unless verification finds a defect.

- [ ] **Step 1: Run full tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run JS syntax checks**

Run:

```bash
node --check miniprogram/pages/index/index.js
node --check miniprogram/utils/lottery.js
node --check miniprogram/utils/history.js
```

Expected: PASS.

- [ ] **Step 3: Run WXML structural check**

Run:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('miniprogram/pages/index/index.wxml','utf8');const opens=(s.match(/<view\\b/g)||[]).length;const closes=(s.match(/<\\/view>/g)||[]).length;if(opens!==closes){throw new Error(`${opens} opens vs ${closes} closes`)}"
```

Expected: PASS.

- [ ] **Step 4: Run final status check**

Run: `git status --short`

Expected: only intentionally untracked logo assets remain if they are still outside this feature scope.

- [ ] **Step 5: Push**

Run:

```bash
git push origin main
```

Expected: push succeeds.

## Spec Coverage Review

This plan covers:

- Homepage play switching: Tasks 3, 4, 5.
- Five V2.0 plays: Tasks 1, 6.
- Distinct interaction designs: Task 6.
- Unified summaries: Task 1.
- Per-play history records: Tasks 2, 3, 4, 7.
- Audit-safe copy: Tasks 4, 7, 8.
- Tests and verification: Tasks 1, 2, 3, 4, 6, 7, 8, 9.

V2.0 official draw data synchronization is intentionally excluded per the approved scope.
