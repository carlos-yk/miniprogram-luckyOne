# LUCK7 V2.0 Multi-Play UI Design

Date: 2026-06-03

## Goal

LUCK7 V2.0 expands the current single-play random number experience into a multi-play random number generator for five mainstream lottery-style formats:

- 双色球
- 超级大乐透
- 福彩3D
- 快乐8
- 排列5

The product must stay positioned as a random number generation and entertainment record tool. It must not provide purchase, betting, prediction, recommendation, prize calculation, trend analysis, or official lottery result query services in V2.0.

## Product Scope

V2.0 includes:

- Homepage play switching.
- Config-driven random number generation for all five plays.
- Different visual interaction for each play.
- Per-play current result summary.
- Per-play local history records.
- Safer product copy throughout the homepage, result modal, history sheet, and share text.

V2.0 does not include:

- Official draw data synchronization.
- Result matching against official lottery results.
- Winning level or prize calculation.
- Payment, purchase, betting, proxy purchase, QR code, or external purchase links.
- Prediction, hot/cold numbers, trend charts, AI recommendation, kill-number, banker-number, or expert-number features.

## Homepage Information Architecture

The homepage remains the only primary screen for V2.0. It should feel like one polished multi-play machine, not a lottery navigation portal.

Top-to-bottom structure:

1. Brand header
   - `LUCK7`
   - Current date
   - Current play name
   - Short safe positioning text

2. Home stats
   - 今日生成次数
   - 最近生成时间
   - 历史记录数

3. Play switcher
   - Horizontal capsule cards.
   - Visible plays: `双色球`, `大乐透`, `福彩3D`, `快乐8`, `排列5`.
   - Each card shows a compact rule label: `6+1`, `5+2`, `3位`, `选5/7/10`, `5位`.
   - Active play has stronger glow and border.

4. Main generation stage
   - Shared outer shell and title bar.
   - Play-specific inner machine.
   - One primary action: `生成一组`.
   - During generation, the button changes to `生成中` and repeat taps are disabled.

5. Current summary panel
   - Shared card layout.
   - Field labels vary by play.
   - Only objective numeric summaries are shown.

6. Recent records
   - Title: `最近记录`.
   - Records are filtered by active play.
   - Show up to three records in the homepage marquee.
   - Details open in a bottom sheet.

7. Safety note
   - Fixed text: `本工具仅用于随机数字生成与娱乐记录，不提供交易、建议或结果查询服务。`

## Unified Page Layout Rules

V2.0 keeps the current dark neon visual language but softens gambling-like wording and cues.

Unified elements:

- Deep navy/black gradient background.
- Red, blue, and gold ambient glow.
- Glass-metal panels with subtle borders.
- Consistent spacing between header, stats, play switcher, machine, summary, history, and safety note.
- Shared machine shell height.
- Shared primary button placement.
- Shared summary card and history card structure.
- Shared record detail bottom sheet.

Variable elements:

- Inner machine layout.
- Animation path.
- Result number layout.
- Accent color.
- Summary field labels.
- Play-specific hint text.

Design principle: the user should feel they are using one product with five different rooms, not five unrelated pages.

## Play-Specific Interaction Designs

### 双色球: Neon Reel Machine

双色球 keeps the current signature machine because it is already the product's strongest visual identity.

Interaction:

- User taps `生成一组` or pulls the lever.
- Six red numbers roll and lock from left to right.
- The blue number locks last with a stronger glow.
- Existing marquee lights and lever feedback are retained.

Result layout:

- Six red number reels in one row.
- One blue number reel separated on the right.
- Blue number gets a short pop animation when locked.

Summary fields:

- 红球和值
- 红球奇偶
- 红球大小
- 蓝球
- 时间

Safe copy:

- `随机生成中`
- `红球依次定格`
- `蓝球已定格`
- `本次号码摘要`

### 超级大乐透: Dual-Orbit Star Disk

超级大乐透 should not reuse the reel machine. It uses a two-zone orbital design to reflect `5+2`.

Interaction:

- The stage contains an outer orbit for front-zone numbers and an inner orbit for back-zone numbers.
- On generation, five front-zone light points rotate and settle first.
- Two back-zone star points settle last together.
- The animation should feel like a star disk aligning, not slot reels.

Result layout:

- Five front-zone numbers arranged on a slight arc or upper row.
- Two back-zone numbers shown as paired star chips below or to the right.
- Accent colors: gold and cyan-blue.

Summary fields:

- 前区和值
- 前区跨度
- 前区奇偶
- 后区组合
- 时间

Safe copy:

- `前区数字已定格`
- `后区双号已生成`
- `星盘记录完成`

### 福彩3D: Three-Digit Flip Machine

福彩3D uses three large mechanical flip reels because its core form is three ordered digits.

Interaction:

- The stage shows three large digit windows: 百位, 十位, 个位.
- On generation, all three windows spin quickly.
- Digits lock from left to right.
- Each lock may trigger a small visual pulse and light haptic feedback.

Result layout:

- Three large equal-width numeric windows.
- Accent colors: orange-gold and warm white.
- The layout should feel like an electronic counter or flip clock.

Summary fields:

- 三位和值
- 奇偶分布
- 重复情况
- 首尾差
- 时间

Safe copy:

- `三位数字生成中`
- `数字已定格`
- `重复情况仅作记录`

### 快乐8: Number Star-Matrix

快乐8 has a large range, so its interaction should communicate selecting from a wide digital field.

Interaction:

- The stage contains an `8 x 10` lightweight matrix representing numbers `01-80`.
- Above or inside the stage, a segmented control lets users choose `选5`, `选7`, or `选10`.
- On generation, a scanner line sweeps across the matrix.
- Selected numbers light up one by one.
- Final selected numbers gather into a result strip.

Result layout:

- `选5`: one compact row.
- `选7`: two compact rows.
- `选10`: responsive number cloud with wrapping.
- Selected matrix cells remain highlighted after generation.
- Accent colors: violet-pink and cyan.

Summary fields:

- 选择数量
- 和值
- 区间分布
- 重复记录
- 时间

For V2.0, `重复记录` compares only against the user's most recent local record for the same play and mode. It must not refer to official draw results.

Safe copy:

- `选择数量`
- `数字星幕生成中`
- `随机数字已点亮`
- `仅作数字记录`

### 排列5: Five-Digit Password Lock

排列5 uses a five-digit password lock because its core form is five ordered digits.

Interaction:

- The stage shows five vertical digit cylinders.
- On generation, the cylinders roll like a password lock.
- Digits can lock from center outward or left to right.
- When all digits lock, a scanner line passes across the row.

Result layout:

- Five large equal-width numeric slots.
- Accent colors: electronic green and cold white.
- The result should feel like a digital code, not a lottery ticket.

Summary fields:

- 五位和值
- 奇偶分布
- 大小分布
- 重复数字
- 时间

Safe copy:

- `五位数字生成中`
- `数字筒已定格`
- `本次排列记录`

## Copy And Audit Safety

High-risk copy must be removed or replaced.

| Avoid | Use |
| --- | --- |
| 开奖 | 生成 / 定格 |
| 再来一注 | 再生成一组 |
| 好运票根 | 记录卡 |
| 中奖号码 | 随机号码 |
| 命中率 | 重合记录 |
| 预测走势 | 号码摘要 |
| 推荐号码 | 随机生成结果 |
| 购彩请理性 | 不提供交易、建议或结果查询服务 |

Forbidden in V2.0:

- Purchase or betting entry.
- External purchase links.
- QR codes for purchase or betting.
- Prize or winning level calculation.
- Official endorsement wording.
- Prediction, recommendation, trend, hot/cold, kill-number, banker-number, or expert-number content.
- Paid unlocks or share-to-unlock features.

## Component Inventory

Core components:

- Brand header.
- Stats strip.
- Play switcher.
- Shared machine shell.
- Play-specific machine inner view.
- Primary generate button.
- Number ball / digit block.
- Summary panel.
- Recent record card.
- Record detail bottom sheet.
- Result modal.
- Save/share action buttons.
- Safety note.

Recommended component boundaries:

- `PlaySwitcher`
- `MachineShell`
- `SSQMachine`
- `DLTOrbitMachine`
- `FC3DFlipMachine`
- `KL8MatrixMachine`
- `PL5PasswordMachine`
- `SummaryPanel`
- `RecordMarquee`
- `RecordSheet`
- `ResultModal`

## Mobile Experience Requirements

- Primary tappable areas should be at least `88rpx`.
- Generation animation should last about `1.8s` to `3s`.
- The app must prevent repeat taps while generating.
- 快乐8 selected results must wrap cleanly for `选10`.
- Summary fields must not overflow their cards.
- History records must clearly show the play name and mode.
- Bottom content must respect safe-area inset.
- Animations should avoid high-frequency full-screen `setData` updates.
- A future reduced-motion option should be possible without changing the product model.

## Acceptance Criteria

V2.0 is considered ready when:

- The homepage supports switching among all five plays.
- Each play generates valid numbers according to its rule.
- Each play has a visually distinct machine interaction.
- The shared layout, spacing, and card system remain consistent across plays.
- Current summaries show play-specific objective fields.
- Recent records are stored and displayed by play.
- Existing双色球 history is migrated or displayed without breaking.
- No V2.0 screen contains purchase, prediction, recommendation, prize, or betting copy.
- Unit tests cover generation rules, formatting, summary logic, and history migration.

## Implementation Order

1. Replace hard-coded双色球 model with a config-driven play model.
2. Add the unified history schema and migrate old local history.
3. Add generators, formatters, and summaries for all five plays.
4. Add homepage play switcher.
5. Update copy to safer wording.
6. Build play-specific machine inner views one by one:
   - 双色球
   - 超级大乐透
   - 福彩3D
   - 快乐8
   - 排列5
7. Update result modal and record sheet for generic play records.
8. Add tests.
