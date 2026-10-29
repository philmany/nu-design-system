# NU / Brutal Kit — context for future app work

Read `tokens.json`, `docs/components.md`, and `docs/flows.md` first. Use the Figma file for visual composition or exact component structure; do not require Figma MCP for every implementation task.

- Source: `philmany/nunutrition`, commit `de8800a6f6bc1619c1c728dfacf3c458ab32c3cb`.
- Visual DNA: warm paper, ink, yellow/honey/clay; zero corners; 3px border; 3/5/7px hard shadows; Space Grotesk + DM Mono.
- Reuse `.nu-*` CSS and semantic `--nu-*` tokens. Original palette names are preserved as primitives.
- `tokens.json` is canonical for values. Run `python scripts/build-tokens.py` after changes. Do not hand-edit generated `tokens.css`.
- `styles.css` is product CSS. `catalog.css` and `catalog.js` are demonstrations, not application architecture.
- Use native semantics: button versus link, visible labels, real radios/checkboxes, dialog, progress. Preserve focus, disabled/loading, error, and unavailable states.
- Default controls: 44px. Inputs: 16px. Small text on warm accent backgrounds uses ink, not muted gray.
- Keep purchase language clear. Put personality in headings and empty states. Never invent stock, discounts, shipping promises, or successful payments.
- Commerce data, payment, tax, inventory, authentication, and persistence are not implemented by this kit. Integrate the app’s real services.
- Use original Lucide SVGs from `assets/icons/`. Keep upstream notices. Use icon swaps, not a separate component variant for every icon.
- Use `figma-map.json` for current file/node references. The package and Figma share a visual contract with per-platform representation; do not assume one-to-one state parity or automatic synchronization. The manifest is a lookup, not native published Code Connect.
- Add new behavior by extending the component contract and docs; avoid silently overriding core visual rules.
