#!/usr/bin/env bash
# Generates tiny thumbnail placeholders for progressive image loading.
# Run once from the project root: bash generate-thumbs.sh
# Requires ImageMagick 7+ (magick command).

MEDIA="./media"

for dir in "$MEDIA"/*/; do
    id=$(basename "$dir")

    # main.jpg → main_thumb.jpg  (blurry placeholder shown instantly while main.jpg streams in)
    if [ -f "${dir}main.jpg" ]; then
        magick "${dir}main.jpg" -resize 20x -quality 60 "${dir}main_thumb.jpg"
        echo "✓ $id/main_thumb.jpg"
    fi

    # background.png → background_thumb.jpg  (blurry bg shown until full background.png loads)
    if [ -f "${dir}background.png" ]; then
        magick "${dir}background.png" -resize 30x -quality 60 "${dir}background_thumb.jpg"
        echo "✓ $id/background_thumb.jpg"
    fi
done

echo ""
echo "Done! All thumbnails generated."
