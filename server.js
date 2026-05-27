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
        if (pathname === "/" || pathname === "") pathname = "/index.html";

        const filePath = join(ROOT, pathname);
        const file = Bun.file(filePath);

        if (!await file.exists()) {
            return new Response("404 Not Found", { status: 404 });
        }

        const ext = extname(pathname).toLowerCase();
        const type = MIME[ext] ?? "application/octet-stream";

        return new Response(file, {
            headers: { "Content-Type": type }
        });
    },
});

console.log("→ http://localhost:8000");
