---
name: cache-busting
description: Use ?v=N on JS/CSS script tags for cache busting; never immutable on unhashed filenames
metadata:
  type: feedback
---

When deploying JS or CSS updates, bump the query string version in the HTML reference: `bundle.js?v=2`, `?v=3`, etc.

**Why:** We set `Cache-Control: immutable` on `/assets/**` in vercel.json. That's correct for fonts (hashed filenames from Google Fonts) but dangerous for `bundle.js` — browsers cache it forever and won't refetch even after a redeploy. Got burned when users were stuck on old bundle.js with broken station URLs.

**How to apply:** Every time `bundle.js` or any other `/assets/` file without a content hash in its name is changed and deployed, bump `?v=N` in `carte.html` (and any other HTML that references it). Current version: `?v=2`.
