#!/usr/bin/env bash
# Converts station artwork images to progressive JPEGs.
# Progressive JPEGs load the whole image at low quality first, then sharpen natively.
# Skips background.png (handled separately with blur-up thumbnails).
# Run once from project root: bash convert-to-progressive-jpeg.sh

MEDIA="./media"

for dir in "$MEDIA"/*/; do
    id=$(basename "$dir")

    # main.png → main.jpg (progressive JPEG)
    if [ -f "${dir}main.png" ]; then
        magick "${dir}main.png" -interlace Plane -quality 85 "${dir}main.jpg"
        echo "✓ $id/main.jpg"
    fi

    # Numbered extra images 1–8 → progressive JPEG
    for i in $(seq 1 8); do
        for ext in png jpg jpeg; do
            src="${dir}${i}.${ext}"
            if [ -f "$src" ]; then
                magick "$src" -interlace Plane -quality 85 "${dir}${i}.jpg"
                echo "✓ $id/${i}.jpg"
                break
            fi
        done
    done
done

echo ""
echo "Done! All artwork images converted to progressive JPEG."
