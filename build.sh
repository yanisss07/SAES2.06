#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Quai des Arts — Build script
#  Run once after adding/changing any source image or font.
#  Requires: ffmpeg, python3, curl
# ─────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

ok()   { echo "  ✓ $*"; }
skip() { echo "  · $* (skip)"; }
hdr()  { echo ""; echo "[ $* ]"; }

# ─────────────────────────────────────────────────────────────
# 1. FONTS  — self-host Roboto, no Google CDN dependency
# ─────────────────────────────────────────────────────────────
hdr "Fonts"
mkdir -p "$ROOT/assets/fonts"
python3 - <<'PYEOF'
import urllib.request, re, os, hashlib

ROOT = os.environ.get("ROOT") or os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(ROOT, "assets", "fonts")

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
URL = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap"

req = urllib.request.Request(URL, headers={"User-Agent": UA, "Accept": "text/css"})
css = urllib.request.urlopen(req).read().decode()

# Extract all unique woff2 URLs
urls = sorted(set(re.findall(r'https://fonts\.gstatic\.com[^\)\'"\s]+\.woff2', css)))
url_to_local = {}

for url in urls:
    fname = url.split("/")[-1]
    dest = os.path.join(FONT_DIR, fname)
    if not os.path.exists(dest):
        urllib.request.urlretrieve(url, dest)
        print(f"  ✓ {fname}")
    else:
        print(f"  · {fname} (cached)")
    url_to_local[url] = f"/assets/fonts/{fname}"

# Rewrite CSS with local paths
local_css = css
for url, local in url_to_local.items():
    local_css = local_css.replace(url, local)

# Add font-display: swap to every @font-face
local_css = re.sub(r'(@font-face\s*\{)', r'\1\n  font-display: swap;', local_css)

out = os.path.join(ROOT, "assets", "fonts.css")
with open(out, "w") as f:
    f.write(local_css)
print("  ✓ assets/fonts.css written")
PYEOF

# ─────────────────────────────────────────────────────────────
# 2. STATION IMAGES  — media/*/
#    source: background.png + main.jpg + 1.jpg 2.jpg …
#    output: background.webp (q82) + main.webp (q85) + N.webp
#            background_thumb.jpg (20px) + main_thumb.jpg (20px)
# ─────────────────────────────────────────────────────────────
hdr "Station images"
shopt -s nullglob

for dir in "$ROOT/media"/*/; do
    station=$(basename "$dir")

    # Background: PNG → WebP
    if [ -f "$dir/background.png" ]; then
        ffmpeg -i "$dir/background.png" -quality 82 "$dir/background.webp" -y 2>/dev/null
        ok "$station/background.webp"
    fi

    # Background thumbnail (tiny, ~20px wide)
    src_bg=""
    [ -f "$dir/background.png" ]  && src_bg="$dir/background.png"
    [ -f "$dir/background.webp" ] && src_bg="$dir/background.webp"
    if [ -n "$src_bg" ] && [ ! -f "$dir/background_thumb.jpg" ]; then
        ffmpeg -i "$src_bg" -vf "scale=20:-1" -q:v 10 "$dir/background_thumb.jpg" -y 2>/dev/null
        ok "$station/background_thumb.jpg"
    fi

    # Main artwork: JPG → WebP
    if [ -f "$dir/main.jpg" ]; then
        ffmpeg -i "$dir/main.jpg" -quality 85 "$dir/main.webp" -y 2>/dev/null
        ok "$station/main.webp"
    fi

    # Main thumbnail
    if [ -f "$dir/main.jpg" ] && [ ! -f "$dir/main_thumb.jpg" ]; then
        ffmpeg -i "$dir/main.jpg" -vf "scale=20:-1" -q:v 10 "$dir/main_thumb.jpg" -y 2>/dev/null
        ok "$station/main_thumb.jpg"
    fi

    # Detail images: 1.jpg 2.jpg … → WebP
    for img in "$dir"[0-9].jpg; do
        name=$(basename "$img" .jpg)
        ffmpeg -i "$img" -quality 85 "${img%.jpg}.webp" -y 2>/dev/null
        ok "$station/${name}.webp"
    done
done

# ─────────────────────────────────────────────────────────────
# 3. VILLES IMAGES  — villes/*/
#    source: *.png
#    output: *.webp (q85) + *_thumb.webp (40px wide, q60)
# ─────────────────────────────────────────────────────────────
hdr "Villes images"

for dir in "$ROOT/villes"/*/; do
    city=$(basename "$dir")
    for img in "$dir"*.png; do
        [ -f "$img" ] || continue
        name=$(basename "$img" .png)
        base="${img%.png}"

        # Full WebP
        ffmpeg -i "$img" -quality 85 "${base}.webp" -y 2>/dev/null
        ok "$city/${name}.webp"

        # Thumbnail WebP (40px wide)
        ffmpeg -i "$img" -vf "scale=40:-1" -quality 60 "${base}_thumb.webp" -y 2>/dev/null
        ok "$city/${name}_thumb.webp"
    done
done

# ─────────────────────────────────────────────────────────────
# 4. JS BUNDLE
# ─────────────────────────────────────────────────────────────
hdr "JS bundle"
cd "$ROOT"
bun build ./src/main.js --outfile ./assets/bundle.js --minify
ok "assets/bundle.js"

echo ""
echo "Build complete."
