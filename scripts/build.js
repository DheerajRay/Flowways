const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  "styles.css",
  "src/app.js",
  "src/domain.js",
  "sw.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "vercel.json"
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing required build files: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Static build validation passed.");
