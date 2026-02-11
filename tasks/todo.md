# Improvement Plan - UNI Jar Monitor

Based on QA review conducted 2026-02-09.

---

## Phase 1: Critical Fixes (Do First)

### Task 1: Fix Dune Analytics Integration (404 Error)
- [ ] Investigate why the Dune query returns "Query not found or private"
- [ ] Verify the Dune query ID in `src/lib/dune.ts` is still valid
- [ ] If query was deleted/moved, create a new query or find the updated ID
- [ ] Add fallback handling so the UI doesn't silently degrade when Dune is down
- [ ] Consider adding a visible indicator when Dune data is unavailable (e.g., "Dune data unavailable" badge on the Breakdown card)
- [ ] Test with Dune restored to verify Top Pools section, Unclaimed/In TokenJar breakdown reappear
**Files:** `src/lib/dune.ts`, `src/app/api/tokenjar/route.ts`
**Impact:** High - restores Top Pools section, collectible value breakdown, UNI to threshold display

---

## Phase 2: Visual Polish (High Impact)

### Task 2: Fix Burn Pile Glow Background Rectangle
- [ ] Reduce opacity or change color of the burn pile glow div when flame level is "none"
- [ ] Consider using a more transparent/subtle gradient that doesn't create a visible gray box
- [ ] Match the glow aesthetic of the jar component (which doesn't have this problem)
- [ ] Test across all flame levels (none, small, medium) to ensure consistency
**Files:** `src/components/PixelJar.tsx` (BurnPile component, lines 157-170)
**Impact:** Medium - removes the most noticeable visual artifact

### Task 3: Improve Burn Pile / Jar Visual Balance
- [ ] Consider increasing burn pile sprite dimensions to better match jar height
- [ ] Or add padding/margin to the jar container to reduce the height difference
- [ ] Alternatively, add a base/platform graphic under the burn pile
- [ ] Ensure the arrow ("BURN TO CLAIM") remains centered between both elements
**Files:** `src/components/PixelJar.tsx` (BurnPile dimensions, line 146-148)
**Impact:** Medium - improves the main visual focal point of the dashboard

### Task 4: Add Minimum Width to Profit Threshold Gauge
- [ ] Set a minimum width of ~6px on the gauge fill to ensure visibility at very low percentages
- [ ] Example: `width: Math.max(0.5, progress) + '%'` or use `min-w-1.5` class
- [ ] Consider adding a small dot/marker at the current position for very low values
**Files:** `src/app/page.tsx` (ProfitGauge component, lines 162-175)
**Impact:** Low-Medium - improves legibility of the main progress indicator

---

## Phase 3: UX Improvements (Medium Impact)

### Task 5: Differentiate LP Tokens in Token Explorer
- [ ] Show truncated contract address below "UNI-V2" for all LP tokens by default (not just on hover)
- [ ] Or resolve underlying pair names (token0/token1) from the pair contracts
- [ ] Pair name resolution would require additional RPC calls in `src/lib/ethereum.ts`
- [ ] Short-term: always show the address for LP tokens since they all share the same symbol
- [ ] Long-term: add pair resolution to the token discovery pipeline
**Files:** `src/components/TokenTabs.tsx`, `src/lib/ethereum.ts`
**Impact:** Medium - 75 of 97 tokens are currently indistinguishable

### Task 6: Fix LP Tab Label Wrapping on Mobile
- [ ] The "LP Tokens" short label shows the icon "<>" which causes wrapping at 375px
- [ ] Option A: Change the LP icon to a single character (e.g., "~" or "/")
- [ ] Option B: Hide the icon on xs screens using `hidden xs:inline`
- [ ] Option C: Reduce tab padding on xs screens
- [ ] Verify all three tabs fit on one line at 320px and 375px viewports
**Files:** `src/components/TokenTabs.tsx` (lines 259-277)
**Impact:** Low - cosmetic issue on smallest viewports only

### Task 7: Make Etherscan Links Accessible on Touch Devices
- [ ] On mobile (touch devices), show the truncated address always instead of hover-only
- [ ] Use `@media (hover: none)` or Tailwind `touch:` variant to always show on touch
- [ ] Or always show the address at `opacity-60` and brighten on hover
- [ ] Ensure tap targets are at least 44x44px per WCAG guidelines
**Files:** `src/components/TokenTabs.tsx` (lines 125-129)
**Impact:** Low-Medium - improves mobile usability for a key navigation feature

---

## Phase 4: Minor Polish (Low Impact)

### Task 8: Fix Footer Pipe Separator Trailing on Mobile
- [ ] Replace explicit pipe `<span>` separators with CSS `gap` and `::before` pseudo-elements
- [ ] Or use CSS `flex-wrap` with a technique that hides trailing separators
- [ ] Or use a centered dot or bullet instead of pipe for better wrapping behavior
- [ ] Test at 320px, 375px, and 414px viewports
**Files:** `src/app/page.tsx` (footer section, lines 1121-1161)
**Impact:** Low - cosmetic, only visible on narrow mobile viewports

### Task 9: Fix Timestamp "UTC" Wrapping at Tablet Width
- [ ] Add `whitespace-nowrap` to the timestamp span
- [ ] Or combine the time and "UTC" into a single non-breaking span
- [ ] Test at 640px-768px range where the wrap occurs
**Files:** `src/app/page.tsx` (lines 469-473)
**Impact:** Low - cosmetic issue at specific tablet widths

### Task 10: Add Progressbar ARIA to Profit Threshold Gauge
- [ ] Add `role="progressbar"` to the gauge container
- [ ] Add `aria-valuenow={progress}`, `aria-valuemin={0}`, `aria-valuemax={100}`
- [ ] Add `aria-label="Profit threshold progress"`
- [ ] This makes the gauge accessible to screen reader users
**Files:** `src/app/page.tsx` (ProfitGauge component, lines 161-175)
**Impact:** Low - accessibility improvement for assistive technology users

### Task 11: Add Group Label to Burn Filter Buttons
- [ ] Wrap the ALL / 4,000 UNI filter buttons in a container with `role="group"` and `aria-label="Filter burn history"`
- [ ] This helps screen reader users understand the button group context
**Files:** `src/app/page.tsx` (lines 864-890)
**Impact:** Low - accessibility improvement

---

## Notes

- No automated test framework exists. Consider adding Playwright or Cypress for regression testing.
- The `"How It Works"` section is open by default on first page load (native `<details>` behavior). This is acceptable but could be changed to collapsed by default if vertical space is a concern.
- The `content-visibility: auto` optimization is well-placed on token/burn rows.
- The SWR integration is clean and handles stale-while-revalidate correctly.
- All ASCII replacements from the recent overhaul look correct ("!!", "**", "..", ">>", "<<", ">", "<>", "?", "$", "[i]", "[!]").
