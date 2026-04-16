#!/usr/bin/env bash
# Generates tiny thumbnail placeholders for progressive image loading.
# Run once from the project root: bash generate-thumbs.sh
# Requires ImageMagick 7+ (magick command).

MEDIA="./media"

for dir in "$MEDIA"/*/; do
    id=$(basename "$dir")

    # main.png → main_thumb.jpg (20px wide)
    if [ -f "${dir}main.png" ]; then
        magick "${dir}main.png" -resize 20x -quality 60 "${dir}main_thumb.jpg"
        echo "✓ $id/main_thumb.jpg"
    fi

    # background.png → background_thumb.jpg (30px wide)
    if [ -f "${dir}background.png" ]; then
        magick "${dir}background.png" -resize 30x -quality 60 "${dir}background_thumb.jpg"
        echo "✓ $id/background_thumb.jpg"
    fi

    # Numbered extra images 1–8
    for i in $(seq 1 8); do
        for ext in png jpg jpeg; do
            if [ -f "${dir}${i}.${ext}" ]; then
                magick "${dir}${i}.${ext}" -resize 20x -quality 60 "${dir}${i}_thumb.jpg"
                echo "✓ $id/${i}_thumb.jpg"
                break
            fi
        done
    done
done

echo ""
echo "Done! All thumbnails generated."
