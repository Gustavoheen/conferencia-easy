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

// Vercel output config — routes all traffic to the Express function
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
      // Serve existing static files directly
      { handle: "filesystem" },
      // Everything else → Express function
      { src: "/(.*)", dest: "/api" },
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
