#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Quai des Arts — Build script
#  Usage:
#    ./build.sh          # everything
#    ./build.sh js       # JS bundle only
#    ./build.sh fonts    # fonts only
#    ./build.sh images   # station + villes images only
#  Requires: ffmpeg, python3, bun
# ─────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

ok()   { echo "  ✓ $*"; }
skip() { echo "  · $* (skip)"; }
hdr()  { echo ""; echo "[ $* ]"; }

TARGET="${1:-all}"

# ─────────────────────────────────────────────────────────────
# FONTS
# ─────────────────────────────────────────────────────────────
build_fonts() {
    hdr "Fonts"
    mkdir -p "$ROOT/assets/fonts"
    python3 - <<'PYEOF'
import urllib.request, re, os

ROOT = os.environ.get("ROOT") or os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(ROOT, "assets", "fonts")

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
URL = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap"

req = urllib.request.Request(URL, headers={"User-Agent": UA, "Accept": "text/css"})
css = urllib.request.urlopen(req).read().decode()

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

local_css = css
for url, local in url_to_local.items():
    local_css = local_css.replace(url, local)

local_css = re.sub(r'(@font-face\s*\{)', r'\1\n  font-display: swap;', local_css)

out = os.path.join(ROOT, "assets", "fonts.css")
with open(out, "w") as f:
    f.write(local_css)
print("  ✓ assets/fonts.css written")
PYEOF
}

# ─────────────────────────────────────────────────────────────
# IMAGES
# ─────────────────────────────────────────────────────────────
build_images() {
    hdr "Station images"
    shopt -s nullglob

    for dir in "$ROOT/media"/*/; do
        station=$(basename "$dir")

        if [ -f "$dir/background.png" ]; then
            ffmpeg -i "$dir/background.png" -quality 82 "$dir/background.webp" -y 2>/dev/null
            ok "$station/background.webp"
        fi

        src_bg=""
        [ -f "$dir/background.png" ]  && src_bg="$dir/background.png"
        [ -f "$dir/background.webp" ] && src_bg="$dir/background.webp"
        if [ -n "$src_bg" ] && [ ! -f "$dir/background_thumb.jpg" ]; then
            ffmpeg -i "$src_bg" -vf "scale=20:-1" -q:v 10 "$dir/background_thumb.jpg" -y 2>/dev/null
            ok "$station/background_thumb.jpg"
        fi

        if [ -f "$dir/main.jpg" ]; then
            ffmpeg -i "$dir/main.jpg" -quality 85 "$dir/main.webp" -y 2>/dev/null
            ok "$station/main.webp"
        fi

        if [ -f "$dir/main.jpg" ] && [ ! -f "$dir/main_thumb.jpg" ]; then
            ffmpeg -i "$dir/main.jpg" -vf "scale=20:-1" -q:v 10 "$dir/main_thumb.jpg" -y 2>/dev/null
            ok "$station/main_thumb.jpg"
        fi

        for img in "$dir"[0-9].jpg; do
            name=$(basename "$img" .jpg)
            ffmpeg -i "$img" -quality 85 "${img%.jpg}.webp" -y 2>/dev/null
            ok "$station/${name}.webp"
        done
    done

    hdr "Villes images"

    for dir in "$ROOT/villes"/*/; do
        city=$(basename "$dir")
        for img in "$dir"*.png; do
            [ -f "$img" ] || continue
            name=$(basename "$img" .png)
            base="${img%.png}"
            ffmpeg -i "$img" -quality 85 "${base}.webp" -y 2>/dev/null
            ok "$city/${name}.webp"
            ffmpeg -i "$img" -vf "scale=40:-1" -quality 60 "${base}_thumb.webp" -y 2>/dev/null
            ok "$city/${name}_thumb.webp"
        done
    done
}

# ─────────────────────────────────────────────────────────────
# JS BUNDLE
# ─────────────────────────────────────────────────────────────
build_js() {
    hdr "JS bundle"
    cd "$ROOT"
    bun build ./src/main.js --outfile ./assets/bundle.js --minify
    ok "assets/bundle.js"
}

# ─────────────────────────────────────────────────────────────
# DISPATCH
# ─────────────────────────────────────────────────────────────
case "$TARGET" in
    js)     build_js ;;
    fonts)  build_fonts ;;
    images) build_images ;;
    all)    build_fonts; build_images; build_js ;;
    *)      echo "Usage: $0 [js|fonts|images|all]"; exit 1 ;;
esac

echo ""
echo "Done."
