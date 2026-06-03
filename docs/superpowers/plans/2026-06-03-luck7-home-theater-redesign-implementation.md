# LUCK7 Home Theater Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the LuckyOne homepage into a cleaner immersive generation stage with lighter supporting information and a stronger result card experience.

**Architecture:** Keep the existing single-page WeChat mini program architecture. Update `index.wxml` and `index.wxss` for layout and visual hierarchy, and make only small `index.js` changes for derived display data if needed. Existing generation, history, share, poster, and storage logic remain intact.

**Tech Stack:** WeChat mini program WXML/WXSS/JavaScript, existing Node test suite.

---

### Task 1: Homepage Information Hierarchy

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] **Step 1: Demote the stats block**

Move the three home stats out of the top visual priority. Convert them into a compact rail below the main stage or a small support strip.

- [ ] **Step 2: Lighten the play switcher**

Keep five plays visible, but reduce card height, border weight, and glow so the switcher reads as navigation rather than the main content.

- [ ] **Step 3: Verify first-screen hierarchy**

Check that the visual order is brand, play selector, main stage, CTA, then support info.

### Task 2: Immersive Main Stage

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] **Step 1: Add a stage header**

Show active play name, rule text, and current phase inside the main stage so the user does not rely on the old heavy marquee.

- [ ] **Step 2: Reduce machine chrome**

Soften the outer machine frame and marquee. Increase visual room for the play-specific content.

- [ ] **Step 3: Make the CTA dominant**

Use a larger single primary button and make sure all plays share a clear generation action.

### Task 3: Supporting Summary and Records

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] **Step 1: Show only three summary metrics on the homepage**

Render only the first three summary items on the homepage while preserving full summary data for result and history details.

- [ ] **Step 2: Demote recent records**

Show a single latest record preview on the homepage. Keep tapping into the existing history sheet behavior.

- [ ] **Step 3: Preserve empty state**

When there is no record, show one compact empty preview that invites generation without adding prediction or purchase wording.

### Task 4: Result Digital Card

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] **Step 1: Reframe modal as a digital card**

Update the result modal title, meta, number grouping, and visual chrome so it feels like a completed random number card.

- [ ] **Step 2: Keep action buttons clean**

Maintain save, share, copy, and generate-again actions with stable button sizing.

- [ ] **Step 3: Verify readability for all play shapes**

Ensure two-group plays, digit plays, and 快乐8 select10 fit inside the card without tiny text.

### Task 5: Verification and Commit

**Files:**
- Test: `tests/*.test.js`

- [ ] **Step 1: Run tests**

Run: `npm test`

- [ ] **Step 2: Run syntax checks**

Run: `node --check miniprogram/app.js && node --check miniprogram/pages/index/index.js && node --check miniprogram/utils/lottery.js && node --check miniprogram/utils/history.js`

- [ ] **Step 3: Run WXML balance check**

Run a simple `view` open/close count check against `miniprogram/pages/index/index.wxml`.

- [ ] **Step 4: Run safety copy scan**

Search for unsafe purchase, prediction, draw, and winning wording in `miniprogram`, `project.config.json`, and `tests`.

- [ ] **Step 5: Commit and push**

Commit only tracked redesign files and documentation. Do not include untracked logo assets unless the user explicitly asks.
