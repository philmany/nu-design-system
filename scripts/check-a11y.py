#!/usr/bin/env python3
"""Static accessibility checks for NU / Brutal Kit. No dependencies.

Usage: python scripts/check-a11y.py
  1. Contrast: every text/fill pairing the components use, computed from tokens.css (WCAG 2.2).
  2. Legibility floors: font sizes in styles.css, catalog.css and index.html inline styles.
     - nothing below 12px (--nu-type-min)
     - clickable controls at 14px or more (--nu-type-control); .nu-button--compact is the one 12px exception
Exits 1 on any failure. Run it after editing tokens.json or styles.css, and before tagging a release.
This is not a substitute for a browser audit (axe), keyboard testing, or a screen reader pass.
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FLOOR, CONTROL = 12, 14
# Selectors whose own text is clickable. Compact buttons are documented as the one exception.
CONTROLS = re.compile(r"\.nu-(button|tab|choice|toolbar)\b(?![-_])|\.catalog-nav a")
CONTROL_EXCEPTIONS = re.compile(r"--compact")

# (foreground, background, minimum ratio, where it appears)
PAIRS = [
    ("--nu-ink", "--nu-bg", 4.5, "body text on paper"),
    ("--nu-ink", "--nu-subtle", 4.5, "text on cream: alerts, empty states, hover"),
    ("--nu-muted", "--nu-bg", 4.5, "help text, meta, placeholders"),
    ("--nu-muted", "--nu-subtle", 4.5, "muted text on cream"),
    ("--nu-on-strong", "--nu-strong", 4.5, "primary button, selected tab/choice"),
    ("--nu-on-strong", "--nu-strong-hover", 4.5, "primary button hover"),
    ("--nu-ink", "--nu-accent", 4.5, "focused input, accent card, user message"),
    ("--nu-ink", "--nu-honey", 4.5, "accent button, badge, assistant message"),
    ("--nu-ink", "--nu-warning", 4.5, "warning alert"),
    ("--nu-on-danger", "--nu-danger", 4.5, "danger button, error alert/message"),
    ("--nu-on-success", "--nu-success", 4.5, "success alert"),
    ("--nu-bg", "--nu-strong", 4.5, "sold-out badge"),
    ("--nu-danger-text", "--nu-bg", 4.5, "field errors, sale price"),
    ("--nu-danger-text", "--nu-subtle", 4.5, "errors on cream surfaces"),
    ("--nu-ink", "--nu-rose", 4.5, "text on clay media"),
    # Non-text contrast (WCAG 1.4.11): boundaries and meaningful graphics need 3:1
    ("--nu-border", "--nu-bg", 3.0, "control borders"),
    ("--nu-danger", "--nu-bg", 3.0, "invalid-field border"),
    ("--nu-meter", "--nu-bg", 3.0, "progress fill vs track"),
]
# Pairings that are known to fail and are banned in the docs. Reported, never used.
BANNED = [
    ("--nu-muted", "--nu-accent", "muted on yellow"),
    ("--nu-muted", "--nu-honey", "muted on honey"),
    ("--nu-danger", "--nu-subtle", "--nu-danger as text on cream (use --nu-danger-text)"),
    ("--nu-honey", "--nu-bg", "honey as a meter or text on paper"),
]

def css_vars():
    text = (ROOT / "tokens.css").read_text()
    return dict(re.findall(r"(--[\w-]+):\s*([^;]+);", text))

def resolve(name, table, depth=0):
    value = table[name].strip()
    m = re.fullmatch(r"var\((--[\w-]+)\)", value)
    return resolve(m.group(1), table, depth + 1) if m and depth < 10 else value

def luminance(hex_):
    h = hex_.lstrip("#")
    rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]

def ratio(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

def to_px(token, table):
    token = token.strip()
    m = re.fullmatch(r"var\((--[\w-]+)\)", token)
    if m:
        token = resolve(m.group(1), table)
    if token.endswith("rem"):
        return float(token[:-3]) * 16
    if token.endswith("px"):
        return float(token[:-2])
    m = re.match(r"clamp\(([\d.]+)(rem|px)", token)
    if m:
        return float(m.group(1)) * (16 if m.group(2) == "rem" else 1)
    return None

SIZE = r"(var\(--[\w-]+\)|clamp\([^)]*\)|[\d.]+(?:px|rem))"
def sizes_in(decls):
    for m in re.finditer(r"font-size:\s*" + SIZE, decls):
        yield m.group(1)
    for m in re.finditer(r"(?<![-\w])font:\s*(?:[\w-]+\s+|var\([^)]*\)\s+)*?" + SIZE + r"\s*/", decls):
        yield m.group(1)

def main():
    table = css_vars()
    failures = []
    print("Contrast")
    for fg, bg, need, where in PAIRS:
        r = ratio(resolve(fg, table), resolve(bg, table))
        ok = r >= need
        print(f"  {'PASS' if ok else 'FAIL'} {r:5.2f}:1 (needs {need}) {fg} on {bg} — {where}")
        if not ok:
            failures.append(f"contrast {fg} on {bg}")
    print("Banned pairings (documented; must not appear in components)")
    for fg, bg, where in BANNED:
        print(f"  ---- {ratio(resolve(fg, table), resolve(bg, table)):5.2f}:1 {where}")

    print("Legibility floors")
    sources = {name: (ROOT / name).read_text() for name in ("styles.css", "catalog.css")}
    rules = []
    for name, text in sources.items():
        text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
        rules += [(name, sel.strip(), body) for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", text)]
    html = (ROOT / "index.html").read_text()
    rules += [("index.html", "inline style", m) for m in re.findall(r'style="([^"]*)"', html)]
    checked = 0
    for name, selector, body in rules:
        for raw in sizes_in(body):
            px = to_px(raw, table)
            if px is None:
                continue
            checked += 1
            sel = " ".join(selector.split())
            if px < FLOOR:
                failures.append(f"{name}: {sel} uses {px:g}px")
                print(f"  FAIL {name}: `{sel}` is {px:g}px (floor {FLOOR}px)")
            elif px < CONTROL and CONTROLS.search(sel) and not CONTROL_EXCEPTIONS.search(sel):
                failures.append(f"{name}: control {sel} uses {px:g}px")
                print(f"  FAIL {name}: control `{sel}` is {px:g}px (controls need {CONTROL}px)")
    print(f"  checked {checked} font-size declarations")
    if failures:
        print(f"\n{len(failures)} failure(s).")
        sys.exit(1)
    print("\nAll static checks passed.")

if __name__ == "__main__":
    main()
