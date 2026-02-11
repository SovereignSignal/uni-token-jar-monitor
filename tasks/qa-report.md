# QA Report - UNI Jar Monitor Production Site

**Date:** 2026-02-09
**URL:** https://uni-token-jar-monitor-production.up.railway.app/
**Viewport Tested:** 1440x900 (desktop), 768x1024 (tablet), 375x812 (mobile)
**Browser:** Chrome (latest)

---

## 1. Testing Summary

Conducted a comprehensive front-end review of the UNI Jar Monitor production dashboard covering visual polish, interactive elements, responsive behavior, accessibility, data display, and footer links.

**Overall Health:** Good. The application loads quickly, API endpoints return 200, no console errors. The recent overhaul (SWR, accessibility, ASCII replacements, CSS cleanup) is solid. However, there are several visual polish issues, one backend degradation (Dune 404), and a few UX improvements that would elevate the experience.

---

## 2. Working Features (Confirmed)

- [x] Page loads without JavaScript errors or console warnings
- [x] API endpoints `/api/tokenjar` and `/api/burns` return 200 OK
- [x] SWR auto-refresh working (30-second interval observed via network requests)
- [x] Header banner renders with pixel-art styling and pink glow
- [x] Explainer text displays correctly with decorative icons on desktop
- [x] "How It Works" collapsible details element opens/closes correctly
- [x] Status indicator shows LIVE with green dot and UTC timestamp
- [x] REFRESH button works, shows spinner during fetch, updates timestamp
- [x] Jar visualization renders with correct fill level (0% at current $43 value)
- [x] Burn pile renders with "none" flame level (correct for 0.3% fill)
- [x] Arrow rotates 90 degrees on mobile (vertical layout)
- [x] Net Profit displays correctly as -$13.6K with red color and glow
- [x] "!! VERY UNPROFITABLE" status badge renders with red styling
- [x] Profit Threshold gauge shows 0.3% with correct colors
- [x] Breakdown card shows correct values: $43 collectible, -$13.6K burn, -$50 gas
- [x] Contracts card shows correct addresses with Etherscan links
- [x] Token Explorer tabs switch correctly between Priced/LP/Unknown
- [x] Tab keyboard navigation works (Arrow keys, Home, End)
- [x] "Show More / Show Less" button expands/collapses token lists
- [x] Token hover reveals Etherscan address link with opacity transition
- [x] Tooltips display on hover for breakdown labels (e.g., COLLECTIBLE VALUE)
- [x] Burn History section shows correct empty state message
- [x] Footer links (GitHub, Uniswap, TokenJar, Firepit) have correct URLs
- [x] Footer data attribution links (DeFiLlama, Dune Analytics) work
- [x] Skip-to-content link appears on Tab key press
- [x] Focus-visible outlines render on keyboard navigation (pink outline)
- [x] Mobile responsive layout stacks correctly (vertical flow)
- [x] Tablet layout adapts properly at 768px
- [x] Scrollable token lists work with custom scrollbar styling
- [x] All external links have target="_blank" and rel="noopener noreferrer"
- [x] All external links have descriptive aria-labels

---

## 3. Issues Found

### ISSUE 1: Dune Analytics Integration Returning 404
**Severity:** High
**Steps to Reproduce:**
1. Visit /api/health
2. Observe the Dune service status
**Expected Behavior:** Dune returns OK with valid data
**Actual Behavior:** Dune returns HTTP 404 "Query not found or private"
**Evidence:** Health endpoint shows dune status as "error" with message "HTTP 404: not found: Query not found or private"
**Impact:** No Dune-sourced data (collectibleUsd, unclaimedValueUsd, tokenJarBalanceUsd, topPools, uniToThreshold) is available. The dashboard falls back to Alchemy data, which means the "Top Pools by Fees" section is completely hidden, and the Breakdown card lacks the Unclaimed/In TokenJar sub-breakdown.
**Potential Root Cause:** The Dune query referenced by the application has been deleted, made private, or the query ID has changed.

---

### ISSUE 2: Burn Pile Glow Background Creates Visible Gray Rectangle
**Severity:** Medium
**Steps to Reproduce:**
1. Load the page and scroll to the "BURN vs VAULT" visualization
2. Observe the burn pile on the left side
**Expected Behavior:** The burn pile should have a subtle glow effect that blends into the dark background
**Actual Behavior:** The burn pile's `blur-3xl` glow div creates a visible rectangular gray area behind the coin sprites, creating an unwanted "card-within-a-card" appearance. The jar on the right does not have this issue because its glow is better calibrated.
**Evidence:** The dark gray rectangle is clearly visible in desktop and mobile screenshots around the burn pile coins.
**Potential Root Cause:** In `PixelJar.tsx` (BurnPile component, line 160-168), the glow div uses `background: radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)` with width 160% and height 140%. When the flame level is "none", the opacity is 0.3, but the brownish-orange glow color still creates a visible rectangle once blurred.
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/components/PixelJar.tsx`, lines 157-170

---

### ISSUE 3: Burn Pile and Jar Visual Size Asymmetry
**Severity:** Medium
**Steps to Reproduce:**
1. Load the page and scroll to the "BURN vs VAULT" section on desktop
2. Compare the relative sizes of the burn pile (left) and jar (right)
**Expected Behavior:** Both visual elements should appear balanced and vertically centered relative to each other
**Actual Behavior:** The jar sprite (320x480) is significantly taller than the burn pile sprite (280x280), creating a top-heavy right side. The burn pile appears to float in the lower half of its container while the jar extends much higher. On desktop, the vertical center alignment via `items-center justify-center` helps but the height difference is still visually striking.
**Potential Root Cause:** The jar image has a 2:3 aspect ratio while the burn pile is 1:1. The `scale-[0.85] md:scale-100` class on both containers doesn't address the height mismatch.
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/components/PixelJar.tsx`, lines 146-148 and 55-57

---

### ISSUE 4: LP Tokens All Display as "UNI-V2" with No Differentiation
**Severity:** Medium
**Steps to Reproduce:**
1. Click the "LP Tokens" tab in the Token Explorer
2. Observe the 75 LP tokens listed
**Expected Behavior:** LP tokens should be distinguishable from each other (e.g., by underlying pair names or contract addresses)
**Actual Behavior:** All 75 LP tokens display as "UNI-V2" with identical pink dot colors and only different balance amounts. Users cannot tell which LP position is which without hovering to reveal the truncated contract address.
**Evidence:** Screenshot shows rows 1-7 all reading "UNI-V2" with varying token counts but no other differentiator visible by default.
**Potential Root Cause:** Uniswap V2 LP tokens all share the symbol "UNI-V2". The `TokenRow` component uses `token.symbol` as the display name. It would need to resolve the underlying pair (e.g., "UNI-V2: WETH/USDC") by querying the pair contract's token0/token1, which is not currently done.
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/components/TokenTabs.tsx`, lines 90-155

---

### ISSUE 5: LP Tokens Tab Label Wraps on Mobile
**Severity:** Low
**Steps to Reproduce:**
1. Resize browser to 375px width (mobile viewport)
2. Scroll to Token Explorer
3. Observe the three tab buttons
**Expected Behavior:** All tab labels should fit on a single line within their tab button
**Actual Behavior:** The "LP Tokens" tab shows "<> LP" with "Tokens" wrapping to a second line. The other tabs ("$ Pri" and "? Unk") fit on one line because they use short labels.
**Evidence:** Mobile screenshot clearly shows the LP tab text spanning two lines.
**Potential Root Cause:** At xs (375px) breakpoint, the component shows `shortLabel` for Priced ("Pri") and Unknown ("Unk"), but the LP shortLabel is "LP" which combined with the icon "<>" and the count badge causes the container to need more space. The issue is that on xs screens, the full "LP Tokens" label is showing instead of just "LP".
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/components/TokenTabs.tsx`, lines 259-277

---

### ISSUE 6: Profit Threshold Gauge Nearly Invisible at Low Percentages
**Severity:** Low
**Steps to Reproduce:**
1. View the Profit Threshold gauge (currently at 0.3%)
2. Observe the progress bar fill
**Expected Behavior:** Some visual indication of progress should be visible even at very low percentages
**Actual Behavior:** At 0.3%, the filled portion of the gauge is only about 2-3 pixels wide, making it virtually invisible. Only the text "0.3%" on the right and "$13.5K needed" in the center provide any indication of the current state.
**Potential Root Cause:** The gauge uses `width: ${progress}%` directly, which at 0.3% on an ~800px wide container results in about 2.4px of fill. A minimum width of ~4-6px would ensure visibility.
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/app/page.tsx`, lines 162-175

---

### ISSUE 7: Footer Pipe Separator Trails on Mobile Wrapping
**Severity:** Low
**Steps to Reproduce:**
1. View the footer on a 375px mobile viewport
2. Observe the footer links layout
**Expected Behavior:** Pipe separators should only appear between links, not trailing at the end of a wrapped line
**Actual Behavior:** The footer links wrap to two lines on mobile: "GitHub | Uniswap | TokenJar Contract |" on line 1 and "Firepit Contract" on line 2. The pipe character trails at the end of the first line.
**Potential Root Cause:** The pipe separators are separate `<span>` elements between each link. On small screens when the flex container wraps, the pipe at the end of a line appears as a trailing character. Using CSS `gap` instead of explicit pipe characters would solve this, or conditionally hiding them.
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/app/page.tsx`, lines 1121-1161

---

### ISSUE 8: Timestamp/UTC Wrapping at Tablet Width
**Severity:** Low
**Steps to Reproduce:**
1. Resize browser to 768px width
2. Observe the status HUD area
**Expected Behavior:** "17:01:44 UTC" should display on a single line
**Actual Behavior:** The timestamp "17:01:44" appears on one line and "UTC" wraps to the next line
**Potential Root Cause:** The `text-[8px] xs:text-[9px]` font size combined with the flex layout at this specific width doesn't have enough horizontal space. Adding `whitespace-nowrap` to the timestamp span would fix this.
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/app/page.tsx`, lines 469-473

---

### ISSUE 9: Token Explorer Etherscan Links Invisible Without Hover
**Severity:** Low
**Steps to Reproduce:**
1. View any token row in the Token Explorer
2. Observe that the Etherscan contract address link is hidden
3. Only appears with `opacity-0 group-hover:opacity-100` transition
**Expected Behavior:** On touch devices, hover states don't exist. Users should have a way to access the Etherscan link without hovering.
**Actual Behavior:** The truncated address link (e.g., "0x00f3...a917 >") only appears on mouse hover. On mobile/touch devices, this link is effectively inaccessible, though users can still navigate via keyboard tab order.
**Potential Root Cause:** The `opacity-0 group-hover:opacity-100` CSS approach doesn't work on touch devices. A tap/click to reveal or always-visible on mobile approach would be better.
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/components/TokenTabs.tsx`, lines 125-129

---

### ISSUE 10: First Unknown Token Has Rendering Issue with Symbol
**Severity:** Low
**Steps to Reproduce:**
1. Switch to the "Unknown" tab in Token Explorer
2. Observe the first token (rank 1)
**Expected Behavior:** Token symbol should display as readable text
**Actual Behavior:** The first token's symbol appears as a small special character (looks like an asterisk or command symbol). The accessibility tree reads it as a unicode character. The Etherscan link text reads "View &#x2318; on Etherscan" suggesting it's the unicode command symbol U+2318.
**Potential Root Cause:** This is a spam/airdrop token with a non-standard symbol. The app correctly displays whatever symbol the ERC-20 contract returns, but some tokens use unusual unicode characters that may render differently across platforms. Not a bug per se, but the small font size makes these characters hard to read.
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/components/TokenTabs.tsx`, lines 90-97

---

### ISSUE 11: Missing "0%" Fill Percentage Label Readability on Jar
**Severity:** Low
**Steps to Reproduce:**
1. Scroll to the jar visualization
2. Observe the "0%" text overlaid on the jar
**Expected Behavior:** The percentage label should be clearly legible
**Actual Behavior:** The "0%" text is rendered on top of the gold coins at the bottom of the jar. While the text shadow helps, the white text on the bright gold coins can be hard to read. This is more of a concern at mid-range fill levels where the text might overlap with more jar contents.
**File:** `/Users/home/GitHub/uni-token-jar-monitor/src/components/PixelJar.tsx`, lines 84-103

---

## 4. Accessibility Assessment

### Working Well
- Skip-to-content link present and functional
- `lang="en"` attribute on HTML element
- Visually hidden h1 for screen readers
- ARIA labels on all external links with "(opens in new tab)" notation
- `role="tablist"`, `role="tab"`, `role="tabpanel"` on Token Explorer
- `aria-selected`, `aria-controls`, `tabIndex` management for tabs
- `aria-pressed` on burn filter buttons
- `aria-expanded` on Show More/Less button
- `aria-label` and `aria-busy` on Refresh button
- `aria-describedby` on tooltip trigger elements
- `role="tooltip"` on tooltip content
- `:focus-visible` styling with pink outline (2px solid)
- `:focus:not(:focus-visible)` removes outline for mouse users
- Keyboard tab navigation through all interactive elements

### Areas for Improvement
- The `<details>/<summary>` "How It Works" section is not announced as a collapsible by all screen readers without additional ARIA
- Tooltip trigger elements use `tabIndex={0}` which makes non-interactive text focusable (minor tab-stop clutter for keyboard users)
- The burn filter buttons lack an accessible group label (consider wrapping in a `role="group"` with `aria-label="Filter burns"`)
- Progress bar (Profit Threshold) lacks `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Color contrast: some very small text at 7px and 8px sizes may not meet WCAG contrast ratios against the dark background (gray-600 text on dark background)

---

## 5. Performance Observations

- Page load is fast (no visible FOUT with Press Start 2P font due to `display: swap`)
- `content-visibility: auto` applied to burn-row-item and token-row-item (good virtualization hint)
- SWR provides stale-while-revalidate behavior correctly
- Next.js Image component used for all images with proper `priority` flags
- No unnecessary re-renders observed during auto-refresh (startTransition used for timer ticks)

---

## 6. Data Accuracy Notes

- **UNI Price:** $3.39 - appears reasonable
- **Total Jar Value:** $43.00 - very low; only 3 tokens have prices (ICP, SUPERGROK, INF)
- **Burn Cost:** $13,560.94 - correct at 4000 UNI * $3.39
- **Gas Estimate:** $50 - static, matches the constant in code
- **Token Count:** 97 total (3 priced, 75 LP, 19 unknown) - reasonable
- **Burn History:** Empty - "No burns recorded yet" message shown. The burn Etherscan link points to the dead address, which is correct.
- **Data Source:** "alchemy.com (cached)" - Dune is down so it falls back to Alchemy
