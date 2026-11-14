# NU / Brutal Kit

**Soft paper. Hard edges. Build your own thing.**

A framework-free component library based on [philmany/nunutrition](https://github.com/philmany/nunutrition), with reusable app and commerce additions. Editable Figma components live in the [Figma library](https://www.figma.com/design/4fo7YNMa0iH4Yydo2YwGSe).

## Start here

Open `index.html` for the visual catalog. Everything—including fonts and icons—is local. For development, serve the folder with `python -m http.server 8080` and visit `http://localhost:8080`.

Copy this folder into your repository, for example `design-system/`, then load:

```html
<link rel="stylesheet" href="/design-system/styles.css">

<main class="nu-root">
  <button class="nu-button nu-button--primary" type="button">
    Add to bag
  </button>
</main>
```

In a bundler, import `styles.css` and keep its relative `tokens.css` and `assets/fonts/` paths intact. The CSS works with plain HTML, React, Vue, Svelte, or server-rendered templates. Convert `class` to your framework’s equivalent. No runtime library is required.

## What to use

| File | Purpose |
| --- | --- |
| `tokens.json` | Canonical primitive values, semantic aliases, CSS names, and source/addition provenance |
| `tokens.css` | Generated CSS variables; do not edit by hand |
| `styles.css` | Scoped `.nu-*` components and layout utilities |
| `index.html` | Copyable semantic markup and a visual component catalog |
| `catalog.js` / `catalog.css` | Catalog-only demonstrations and presentation; exclude from product apps |
| `assets/icons/` | 16 editable Lucide SVGs, a sprite, exact upstream revision, and source manifest |
| `assets/fonts/` | Self-hosted Space Grotesk and DM Mono |
| `docs/components.md` | Component roles, states, and button copy |
| `docs/flows.md` | Ecommerce flow recipes and recovery paths |
| `docs/design-guidelines.md` | Visual and content rules |
| `figma-map.json` | Figma file and component mapping; intentionally not a live sync |
| `AI_CONTEXT.md` | Small context file for future coding agents |

## Change the theme

Use semantic names in app code. Keep original palette names as primitives.

```css
.my-store {
  --nu-accent: #e8c84a;
  --nu-honey: #d4a85c;
  --nu-bg: #fdf6ec;
  --nu-surface: #fdf6ec;
  --nu-ink: #1a1510;
  --nu-border: #1a1510;
}
```

Wrap the UI in `<main class="nu-root my-store">`. Check contrast after changing colors. The default semantic set is light; no untested dark mode is supplied.

For a permanent system change, edit `tokens.json` and regenerate:

```sh
python scripts/build-tokens.py
```

The JSON uses a small DTCG-style structure with explicit CSS bindings; the supplied generator is the supported build path. Do not assume every third-party token importer accepts it without an adapter.

## Icons

The simplest option is to inline a supplied SVG and give it `class="nu-icon" aria-hidden="true"`. For an icon-only button, put the accessible name on the button:

```html
<button class="nu-button nu-button--icon" type="button" aria-label="Open bag">
  <svg class="nu-icon" aria-hidden="true">
    <use href="/design-system/assets/icons/sprite.svg#icon-shopping-bag"></use>
  </svg>
</button>
```

External sprites should be served over HTTP. The catalog embeds its sprite so it also works as a local file. Use `alt=""` for decorative SVG images; supply text when an image carries meaning.

## Figma → code → Figma

Use Figma for composition and visual decisions. Use this package for implementation context, exact values, and component behavior contracts. Figma and CSS share a visual contract: palette, type, outlines, shadows, and component roles. Each platform represents layout, interaction, and states differently; do not assume one-to-one variant parity. This is a reviewed snapshot, **not automatic synchronization**. When a token or component contract changes, update the package and the Figma source together; retain the change in version control.

The Figma file has nine pages: Start, Foundations, Icons, Buttons, Forms, App patterns, Commerce, Flow recipes, and Handoff. It contains local reusable components. To reuse them across Figma files, publish the library in Figma and enable it in the destination file, or copy the component masters with their variables. The library was created as a design file; publishing is a separate action. `figma-map.json` provides a portable lookup. It is not a published native Code Connect integration.

## Accessibility notes

Measured contrast for the default palette (WCAG AA needs 4.5:1 for text under 24px):

| Pairing | Ratio | Use |
| --- | --- | --- |
| Ink on paper | 16.9 | Everything |
| Muted on paper | 5.05 | Secondary text |
| Muted on cream | 4.55 | Secondary text, just passing |
| Muted on yellow | 3.30 | **Do not use**; use ink on accent fills |
| Ink on amber / honey | 5.52 / 8.25 | Fills with ink text |
| Amber on paper | 3.06 | **Fill only**, never text |
| White on green | 3.81 | **Fill only**; use `--nu-success` for text-bearing surfaces |

**Dot grid.** `.nu-dot-grid` paints 1px specks every 22px. Ink text is unaffected, but small muted text (11–12px mono) collides with the specks. Put it on a surface (card, alert), or add `.nu-plate` to paint a paper-colored plate behind it. The dots use `--nu-dot` (`--dots-soft`), which is lighter than the original `--dots` so muted text keeps about 3:1 against a speck. Dots are decorative and carry no information.

**Theming shadows.** Shadows follow `--nu-border`. Set it on the same element as `.nu-root` (`<main class="nu-root my-store">`) and borders and shadows change together.

## Before shipping

Give controls real behavior, validate server-side, and connect inventory/payment/order state to your backend. The catalog’s interactions are demonstrations. Native buttons, labels, radios, checkboxes, dialog, and progress elements are intentional: preserve their semantics when adapting to a framework. Verify keyboard use, focus order, zoom, small screens, and your actual text/colors in the finished app.

Source baseline: `index.html` at commit `de8800a6f6bc1619c1c728dfacf3c458ab32c3cb`. See [provenance](docs/provenance.md) and [licenses](LICENSES.md).
