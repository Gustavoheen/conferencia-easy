import { mkdirSync, cpSync, copyFileSync, writeFileSync, existsSync } from "fs";

// Create output structure
mkdirSync(".vercel/output/static", { recursive: true });
mkdirSync(".vercel/output/functions/api.func", { recursive: true });

// Static frontend files
if (existsSync("dist/public")) {
  cpSync("dist/public", ".vercel/output/static", { recursive: true });
  console.log("✓ Static files copied");
}

// Serverless function
copyFileSync("dist/api.js", ".vercel/output/functions/api.func/index.js");
console.log("✓ Function copied");

// Vercel output config — API to function, SPA fallback to index.html
writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify({
    version: 3,
    routes: [
      // Static assets with long cache
      {
        src: "/assets/(.*)",
        headers: { "cache-control": "public, max-age=31536000, immutable" },
        dest: "/assets/$1",
      },
      // API and tRPC routes → Express function
      { src: "/api/(.*)", dest: "/api" },
      // Serve existing static files directly
      { handle: "filesystem" },
      // SPA fallback — any unmatched route → index.html
      { src: "/(.*)", dest: "/index.html" },
    ],
  })
);

// Function runtime config
writeFileSync(
  ".vercel/output/functions/api.func/.vc-config.json",
  JSON.stringify({
    runtime: "nodejs20.x",
    handler: "index.js",
    launcherType: "Nodejs",
    shouldAddHelpers: true,
  })
);

console.log("✓ Vercel output ready");
