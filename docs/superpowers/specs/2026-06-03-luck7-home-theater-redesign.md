# LUCK7 Home Theater Redesign

Date: 2026-06-03

## Goal

Rework the V2 homepage from a dense information dashboard into a single-play immersive generation stage. The user should understand the current play, start generation quickly, and receive a polished random number card after generation.

## Design Direction

- Keep one homepage and keep all five plays playable from the homepage.
- Preserve the dark neon LUCK7 identity, but reduce competing borders, small cards, and tiny text.
- Make the main generation stage the visual center of the first screen.
- Demote statistics, summary, and records so they support the stage instead of competing with it.
- Make the result modal feel like a completed digital card, not a plain result list.

## First Screen Structure

1. Lightweight brand header
   - Brand: `LUCK7`
   - Subtitle: `随机数字卡`
   - Date and active play remain visible.

2. Lightweight play switcher
   - Keep five play choices on the homepage.
   - Use compact chips instead of heavy cards.
   - Active play gets one clear accent.

3. Immersive main stage
   - Larger visual area.
   - Current play name and rule are visible.
   - Play-specific stage remains different for each play.
   - The primary action is visually dominant.

4. Supporting info below the stage
   - Summary shows at most three compact metrics on the homepage.
   - Full summary details remain available in the result modal and history sheet.
   - Recent records show a single latest card preview on the homepage, with history details in the sheet.

5. Safety note
   - Keep the safe positioning copy.

## Play-Specific Stage Requirements

- 双色球: keep the lever identity, but make the reels and action feel more central.
- 大乐透: keep the dual-orbit star disk direction.
- 福彩3D: keep three large flip digits.
- 快乐8: keep selected numbers large; 80-cell matrix is background context only.
- 排列5: keep the password-lock direction.

## Result Card Requirements

- Title and card type must be visually clear.
- Result numbers should be the largest content in the modal.
- The modal should feel like the random number card has formed from the stage.
- Actions remain: save image, share, copy, generate again.

## Safety Requirements

Do not introduce copy or UI that implies purchase, betting, prediction, recommendation, official draw lookup, winning matching, or prize calculation. Keep language focused on random number generation and entertainment records.

## Acceptance Criteria

- On a 375x667-sized screen, the homepage does not show three stats, five summary tiles, and three history records all competing at once.
- The current play, generation action, and generated result area are understandable within 3 seconds.
- Main stage and CTA are visually dominant.
- Homepage summary uses no more than three visible metrics.
- Recent records are demoted to a single preview or lower section.
- 快乐8 selected numbers remain readable in select5, select7, and select10.
- Result modal looks like a finished digital card and has clean action buttons.
- Existing tests continue to pass and safety wording remains clean.
