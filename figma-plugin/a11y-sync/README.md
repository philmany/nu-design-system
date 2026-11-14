# NU a11y sync (Figma plugin)

This plugin brings the Figma library in line with tokens v1.1.0 (PR #2: type floors, toolbar, contrast fixes). Run it once in the NUBRUT library file. It's safe to run again: it looks everything up by name before creating it.

**Run it** (needs the Figma desktop app)
1. Open the NUBRUT file.
2. Go to Plugins → Development → Import plugin from manifest…, and pick this folder's `manifest.json`.
3. Go to Plugins → Development → NU a11y sync (v1.1). A toast summarises what changed.
4. Check the **Legibility rules (v1.1)** frame on the Foundations page. It has the full change log and anything flagged for review.

If something looks wrong, use Edit → Undo, which rolls back the whole run.

**What it changes**
- **Variables:** adds `palette/red-text`, `color/danger-text`, `color/meter`, and `type/role/{min,support,control,body,prose,input}`, all with WEB code syntax. Marks `type/size/10` and `type/size/11` as deprecated.
- **Text styles:**
  - NU / Source button: 12 → 14px
  - NU / Micro: 11 → 12px
  - NU / Mono: 12 → 13px
  - NU / Source body: 13 → 14px
- **Component masters (unstyled text only):**
  - Controls go to 14px (compact stays at 12px).
  - Field, cart, step and price text goes from 12 to 13px.
  - Alerts and messages go from 13 to 14px.
  - Everything else is raised to at least 12px.
  - Error and sale text is rebound to `color/danger-text`, and progress fills to `color/meter`.
- **New components:** `Toolbar / Item` (Default / Pressed / Primary, with Label, Icon and Show icon properties) and an example `Toolbar`.

**After running:** if a fixed-width frame clips the now-larger button or tab labels, switch that frame to hug its contents.
