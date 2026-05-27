# card noise animation tutorial

This covers how the pixel noise animations on the home page cards work.
There are two layers: an **idle** animation (always running) and a **hover** animation (triggered on mouseenter).
They crossfade between each other using alpha weights `iA` (idle alpha) and `hA` (hover alpha).

All of this runs on a `<canvas>` injected over the card:

```js
canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;mix-blend-mode:luminosity;image-rendering:pixelated;';
ctx.imageSmoothingEnabled = false;
```

Two things matter here:
- `mix-blend-mode: luminosity` -- the canvas is greyscale, blended onto the purple card. white pixels brighten, black pixels darken. no color bleed.
- `image-rendering: pixelated` + `imageSmoothingEnabled = false` -- pixels stay sharp squares. the "12px pixel" look is intentional.

The pixel grid is computed in canvas pixels (physical), not CSS pixels:

```js
var dpr = devicePixelRatio || 1;
var ps  = PIXEL_SIZE * dpr;  // PIXEL_SIZE = 12 (CSS px), ps = physical px
var cols = Math.ceil(canvas.width  / ps) + 1;
var rows = Math.ceil(canvas.height / ps) + 1;
```

---

## the state machine

```js
if (isHovered) {
    var elapsed = (now - hoverStart) * 0.001;  // seconds
    var pr = Math.min(elapsed / TRANS_DUR, 1); // TRANS_DUR = 0.35s
    iA   = 1 - pr;   // idle fades out
    hA   = pr;        // hover fades in
    hAge = elapsed;
    reveal = 1 - Math.pow(1 - Math.min(0.5 * elapsed, 1), 3);  // cubic ease-in reveal
} else if (leaveStart !== null) {
    var lp = Math.min((now - leaveStart) * 0.001 / LEAVE_DUR, 1); // LEAVE_DUR = 0.45s
    iA   = lp;        // idle fades back in
    hA   = 1 - lp;    // hover fades out
    hAge   = frozenHoverAge;  // freeze the perlin time at the moment of leave
    reveal = frozenReveal;
    if (lp >= 1) leaveStart = null;
} else {
    iA = 1; hA = 0;   // resting: full idle, no hover
}
```

On leave, `frozenHoverAge` and `frozenReveal` capture the exact state at the moment the mouse left,
so the hover pattern doesn't jump as it fades out.

---

## the hover: Perlin reveal (shared by all cards)

This is the special one. On hover, a circular ripple of Perlin noise pixels expands from the center.

```js
function drawHover(hAge, reveal, hA) {
    for (var e = 0; e < cols; e++) {
        for (var a = 0; a < rows; a++) {

            // Perlin gives smooth organic brightness variation
            // z = time * speed makes it slowly animate
            var l = perlin.noise(0.2*e, 0.2*a, 0.5*hAge*SPEED);

            // cheap hash for per-pixel randomness (no allocations)
            var s = 43758.5453 * Math.sin(12.9898*e + 78.233*a);
            s = s - Math.floor(s); // fract() -- 0..1

            // brightness = perlin + some random jitter
            var d = (l + (s*2 - 1) * RANDOMNESS + 1) * 0.75;

            // normalized position, aspect-ratio corrected
            var bx = (e+.5)/cols, by = (a+.5)/rows;
            var ar = cols/rows;
            var fx = (bx - 0.5)*ar, fy = by - 0.5;

            // distance from center + hash jitter makes the reveal edge ragged
            var dist = Math.sqrt(fx*fx + fy*fy)/ar + (s - 0.5)*RANDOMNESS*0.35;

            // soft edge: full opacity inside reveal, fade over 0.08 units
            var pA = 0;
            if (dist <= reveal)            pA = OPACITY;
            else if (dist <= reveal+0.08)  pA = OPACITY * (1-(dist-reveal)/0.08);

            if (pA < 0.001) continue;
            var j = Math.floor(255 * d);
            ctx.fillStyle = 'rgba('+j+','+j+','+j+','+(pA * hA)+')';
            ctx.fillRect(e*ps, a*ps, ps, ps);
        }
    }
}
```

`reveal` goes 0 -> 1 with a cubic ease-in over ~2 seconds:
```js
reveal = 1 - Math.pow(1 - Math.min(0.5 * elapsed, 1), 3);
```
At `reveal = 0` nothing is shown. At `reveal = 1` the whole card is covered.
The edge is ragged because `dist` has hash jitter added to it -- pixels near the boundary
flip on/off unpredictably, which looks organic instead of a clean circle.

---

## idle A: wave-noisy (New Project card)

A diagonal sine wave sweeping across the card, with per-pixel hash noise mixed in.

```js
} else if (idleType === 'wave-noisy') {
    for (var e = 0; e < cols; e++) {
        for (var a = 0; a < rows; a++) {
            // diagonal: e+a puts equal weight on x and y, so the wave goes top-left -> bottom-right
            var phase = (e + a) / (cols + rows) * Math.PI * 5 - t * 1.1;
            var base  = (Math.sin(phase) + 1) * 0.5;  // 0..1

            // same hash as hover -- fract(sin(dot(coord, magic)))
            var rnd = 43758.5453 * Math.sin(12.9898*e + 78.233*a);
            rnd = rnd - Math.floor(rnd);  // 0..1

            // 70% wave, 30% random noise
            var v = base * 0.7 + rnd * 0.3;
            v = v * v;  // square for contrast

            var j = Math.floor(255 * (0.3 + v * 0.7));
            ctx.fillStyle = 'rgba('+j+','+j+','+j+','+(OPACITY * 0.85 * iA)+')';
            ctx.fillRect(e*ps, a*ps, ps, ps);
        }
    }
}
```

The `* Math.PI * 5` controls how many wave bands cross the card (more = tighter bands).
`t * 1.1` is the scroll speed. Squaring `v` increases contrast -- mid-greys flatten, highlights pop.
The 30% hash mix breaks up the bands so they don't look too clean.

---

## idle B: sparkle-dense (Open from Computer card)

Each pixel gets a random on/off state, a random speed, and a random phase at init time.
They all independently sine-fade in and out.

```js
// init (once per card, stored in pixStates)
for (var i = 0; i < cols * rows; i++) {
    st.push({
        phase:  Math.random() * Math.PI * 2,  // where in the cycle it starts
        speed:  minSpeed + Math.random() * (maxSpeed - minSpeed),
        bright: 0.4 + Math.random() * 0.6,
        on:     Math.random() < density       // density = 0.45 for sparkle-dense
    });
}
```

```js
// draw loop
var p = getPixStates(0.45, 1.0, 2.5);  // density=45%, speed 1x..2.5x
for (var e = 0; e < cols; e++) {
    for (var a = 0; a < rows; a++) {
        var idx = e + a * p.cols;
        if (!p.st[idx].on) continue;  // most pixels are off
        var s = p.st[idx];
        var v = (Math.sin(t * s.speed + s.phase) + 1) * 0.5;
        if (v < 0.1) continue;  // skip near-zero (saves fillRect calls)
        var j = Math.floor(255 * (0.2 + s.bright * 0.8));
        ctx.fillStyle = 'rgba('+j+','+j+','+j+','+(OPACITY * 0.75 * v * iA)+')';
        ctx.fillRect(e*ps, a*ps, ps, ps);
    }
}
```

`sparkle-dense` uses `density=0.45` (45% of pixels active) and fast speeds (1.0-2.5x),
giving the snappy flicker feel. `sparkle-og` uses `density=0.25` and slower speeds for a calmer version.

---

## the hash function

Used everywhere for cheap per-pixel randomness without an allocation:

```js
var s = 43758.5453 * Math.sin(12.9898*e + 78.233*a);
var rnd = s - Math.floor(s);  // fract -- result is 0..1
```

This is the classic GLSL `fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453)` hash,
ported to JS. The magic numbers produce good distribution. The result is deterministic per
`(e, a)` grid position -- same pixel always gets the same "random" value, which is what you want
for stable noise (no flickering from frame to frame unless you intend it).

---

## tuning cheatsheet

| param | effect |
|-------|--------|
| `PIXEL_SIZE` | physical block size in CSS px (12 = chunky retro pixels) |
| `OPACITY` | max alpha of the overlay (0.35 = subtle) |
| `SPEED` | how fast the Perlin field animates on hover |
| `RANDOMNESS` | how ragged the hover reveal edge is (0 = clean circle) |
| `TRANS_DUR` | idle->hover crossfade duration in seconds |
| `LEAVE_DUR` | hover->idle crossfade duration in seconds |
| wave `Math.PI * N` | number of wave bands across the card |
| wave `t * speed` | wave scroll speed |
| sparkle `density` | fraction of pixels that are active |
| sparkle speed range | min/max of per-pixel cycle speed |
