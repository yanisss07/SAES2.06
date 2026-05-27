import { join, extname } from "path";

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg":  "image/svg+xml",
    ".ico":  "image/x-icon",
    ".pdf":  "application/pdf",
    ".txt":  "text/plain; charset=utf-8",
};

const ROOT = import.meta.dir;

Bun.serve({
    port: 8000,
    async fetch(req) {
        const url = new URL(req.url);
        let pathname = decodeURIComponent(url.pathname);

        // Redirect .html URLs to clean paths
        if (pathname.endsWith(".html")) {
            const clean = pathname.slice(0, -5) || "/";
            return Response.redirect(new URL(clean, req.url).href, 301);
        }

        // Resolve to a file path
        let resolved = pathname;
        if (resolved === "/" || resolved === "") {
            resolved = "/index.html";
        } else {
            // /ligne_A/:station  or  /ligne_B/:station  → serve ligne_A.html / ligne_B.html
            const stationMatch = pathname.match(/^\/(ligne_[AB])\/[^/]+$/);
            if (stationMatch) {
                resolved = `/${stationMatch[1]}.html`;
            } else if (!extname(resolved)) {
                resolved = resolved + ".html";
            }
        }

        const filePath = join(ROOT, resolved);
        const file = Bun.file(filePath);

        if (!await file.exists()) {
            return new Response("404 Not Found", { status: 404 });
        }

        const ext = extname(resolved).toLowerCase();
        const type = MIME[ext] ?? "application/octet-stream";

        return new Response(file, { headers: { "Content-Type": type } });
    },
});

console.log("→ http://localhost:8000");
