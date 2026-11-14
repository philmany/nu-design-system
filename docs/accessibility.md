# Accessibility and legibility

Target: **WCAG 2.2 AA**. Run `python scripts/check-a11y.py` after any change to `tokens.json`, `styles.css`, or `catalog.css`. It checks contrast for every pairing the components use and the type floors below, and exits 1 on failure. It does not replace a browser audit (axe), keyboard testing, or a screen-reader pass.

## Type: legibility rules

Brutalist UI leans on small uppercase mono. That's part of the look, and it's also where legibility breaks first. These rules keep the look and protect the reader.

### 1. Size floors

| Role | Token | Size | Use for |
| --- | --- | --- | --- |
| Floor | `--nu-type-min` | 12px | Metadata only: kickers, badges, stat labels, table headers, compact buttons |
| Support | `--nu-type-support` | 13px | Text people read before they act: field labels, help, errors, cart meta, step labels, currency |
| Control | `--nu-type-control` | 14px | Anything clickable: buttons, tabs, options, **toolbar items**, nav links |
| Body | `--nu-type-body` | 14px | UI copy, alerts, messages |
| Prose | `--nu-type-prose` | 16px | Anything longer than ~3 lines. Add `.nu-prose` (1.6 line height, 70ch measure) |
| Input | `--nu-type-input` | 16px | Text inside inputs. Below 16px, iOS Safari zooms the page on focus |

- **Nothing below 12px. No exceptions.** `--nu-text-10` and `--nu-text-11` are deprecated for text and kept only so the Figma variables still match.
- Use the role tokens in components, not raw `--nu-text-*` sizes, so the floors move together.
- Type tokens are emitted in `rem`. Text follows the user's browser font-size setting as well as page zoom. Don't hard-code `px` font sizes in app code.

### 2. Small text has to earn its place

- **Uppercase + letter-spacing is only allowed at 12px and up.** At 12–13px, keep uppercase strings to about **3 words / 24 characters**. Longer than that, use sentence case.
- **Sentences in DM Mono start at 13px.** Mono's narrow, evenly spaced letters read smaller than Space Grotesk at the same size.
- **Never put muted text on a warm fill.** On yellow, honey, or amber, `--nu-muted` and `--nu-danger-text` automatically resolve to ink inside `.nu-card--accent`, messages, warning alerts, badges, and the current order step. If you build a new warm surface, add it to that rule in `styles.css`.
- **Small muted text needs a plain surface.** On `.nu-dot-grid`, put it on a card or add `.nu-plate`.
- **Don't carry meaning in 12px text alone.** If a user must notice it (stock limits, errors, price changes), it goes in support size or larger, with an icon or position change.

### 3. Dense UI: toolbars, tab bars, filter rows, table actions

Density comes from **fewer items and tighter spacing**, never from smaller text.

1. **Labels stay at 14px** (`--nu-type-control`) in sentence case. `.nu-toolbar` turns off uppercase and tracking for its buttons; dense rows of uppercase labels are hard to scan.
2. **Targets stay at 44px.** Spacing between items can drop to 4px; the targets themselves don't shrink.
3. **Don't use `.nu-button--compact` in toolbars, navigation, or for primary actions.** Compact (32px, 12px text) is only for low-frequency secondary actions inside dense data rows, such as "Edit" in a table row. Inside a toolbar it's reset to full size.
4. **When space runs out, do this in order:**
   1. Wrap to a second row (`.nu-toolbar` wraps by default).
   2. Collapse **well-known** icons to icon-only by wrapping the label in `.nu-toolbar__collapse`. Below 520px of toolbar width, the label is hidden visually but still read by screen readers. Only use this for search, close, menu, add, delete, and favourite. "Filters", "Archive", and "Export" icons aren't universal, so keep their labels.
   3. Move the remaining secondary actions into a "More" menu.
   4. **Never** reduce the font size to fit.
5. **Show at most about 5–7 items** at once. More than that is a menu.
6. **Keyboard:** `role="toolbar"` + `aria-label`, one Tab stop, arrow keys between items (see `catalog.js`). Group related toggles with `role="group"` + `aria-label` and use `aria-pressed` for on/off state.
7. **Tabs follow the same rule.** `.nu-tabs` scrolls sideways on narrow screens; the labels no longer shrink to 11px on mobile.

```html
<div class="nu-toolbar" role="toolbar" aria-label="Product list actions">
  <div class="nu-toolbar__group">
    <button class="nu-button" type="button">
      <svg class="nu-icon" aria-hidden="true"><use href="#icon-search"/></svg>
      <span class="nu-toolbar__collapse">Search</span>
    </button>
    <button class="nu-button" type="button">
      <svg class="nu-icon" aria-hidden="true"><use href="#icon-settings"/></svg><span>Filters</span>
    </button>
  </div>
  <div class="nu-toolbar__group" role="group" aria-label="View">
    <button class="nu-button" type="button" aria-pressed="true">Grid</button>
    <button class="nu-button" type="button" aria-pressed="false">List</button>
  </div>
  <span class="nu-toolbar__spacer"></span>
  <button class="nu-button nu-button--primary" type="button">
    <svg class="nu-icon" aria-hidden="true"><use href="#icon-plus"/></svg><span>Add product</span>
  </button>
</div>
```

## Colour contrast

Computed from `tokens.css` by `scripts/check-a11y.py`.

| Pairing | Ratio | Rule |
| --- | --- | --- |
| Ink on paper / cream | 16.89 / 15.23 | Everything |
| Muted on paper | 5.05 | Secondary text |
| Muted on cream | 4.55 | Passes, but only just; don't darken cream |
| Yellow on ink (primary, selected) | 11.04 | Text OK |
| Ink on yellow / honey / amber | 11.04 / 8.25 / 5.52 | Text on warm fills is always ink |
| Paper on red (danger) | 4.79 | Text OK |
| Paper on dark green (success) | 7.99 | Text OK |
| `--nu-danger-text` on paper / cream | 5.51 / 4.97 | Field errors, sale prices |
| `--nu-meter` (amber) vs paper | 3.06 | Progress fill (non-text, needs 3:1) |
| **Muted on yellow / honey** | 3.30 / 2.46 | **Banned.** Handled automatically on built-in warm surfaces |
| **`--nu-danger` as text on cream** | 4.32 | **Banned.** Use `--nu-danger-text` |
| **Honey vs paper** | 2.05 | **Banned for meters and text.** Fill behind ink only |
| **Amber text on paper** | 3.06 | Fill only |

## Other guarantees in `styles.css`

- **Focus:** a 3px ink outline offset 4px on every control. Tabs draw it inside, because the tab list scrolls, and switch it to yellow on the selected ink fill.
- **Forced colours (Windows High Contrast):** selected tabs, choices, toolbar toggles, the current order step, switches, and progress fills map to `Highlight`/`CanvasText`. Without this they'd disappear, because they're drawn as fills.
- **Reduced motion:** turns off button transitions and the loading spinner.
- **Icons:** scale with text (`max(20px, 1.25em)`), so they keep up when users raise their font size.

## Audit log

**2026-11-14:** axe-core 4 (WCAG 2.0/2.1/2.2 A/AA + best practice) on `index.html` at 1280px and 375px: **0 violations** (was 1: heading order in the hero cards). Also checked at 200% user font size at 1280px and 320px, and in emulated forced-colours mode.

| Finding | Severity | Fix |
| --- | --- | --- |
| Buttons and tabs used 12px labels; compact buttons, badges, stat labels, and currency used 11px; mobile tabs shrank to 11px; catalog icon names and poster captions were 9px | Legibility | Role tokens and floors above; tabs scroll instead of shrinking |
| Type in px ignored the browser font-size setting | WCAG 1.4.4 | Type tokens emitted in rem |
| Progress fill (honey) was 2.05:1 against its track | WCAG 1.4.11 | `--nu-meter` (amber, 3.06:1) |
| Error and sale-price red was 4.32:1 on cream | WCAG 1.4.3 | `--nu-danger-text` (#b03e19) |
| Muted text on accent surfaces was only fixed for `.nu-card--accent` stat labels | WCAG 1.4.3 | Scoped token override on every warm surface |
| Selected tabs, choices, switch thumbs, and progress fills disappeared in forced colours | WCAG 1.4.11 | `forced-colors` mappings |
| `.nu-badge--sold` used the `--white` primitive directly | Token hygiene | `--nu-bg` |
| No toolbar pattern, so teams reached for compact buttons | Legibility | `.nu-toolbar` component + rules |

**Open items**

- The Figma library still shows the old sizes (12px buttons and tabs, 11px badges). Update its text styles to match the role tokens.
- DM Mono ships only 400/500, so `.nu-summary__total` renders a synthetic bold in mono. Use Space Grotesk for the total or ship DM Mono Medium only.
- Fonts are TTF. WOFF2 would cut font weight by roughly 50–60%.
- At 200% font size on a 320px screen, the catalog's code table overflows by about 1px. It's catalog-only.
