// Full-page screenshot via Puppeteer.
// Usage: node screenshot.mjs <url> [label]
// Saves to "./temporary screenshots/screenshot-N.png" or "screenshot-N-label.png".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, 'temporary screenshots');

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label]');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// Next N = highest existing screenshot number + 1, so files are never overwritten.
const maxN = fs
  .readdirSync(OUT_DIR)
  .map((f) => /^screenshot-(\d+)(?:-.*)?\.png$/.exec(f))
  .filter(Boolean)
  .reduce((max, m) => Math.max(max, Number(m[1])), 0);
const n = maxN + 1;

const safeLabel = label ? label.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') : '';
const fileName = safeLabel ? `screenshot-${n}-${safeLabel}.png` : `screenshot-${n}.png`;
const outPath = path.join(OUT_DIR, fileName);

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 500)); // let fonts/animations settle
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`Saved: ${outPath}`);
} finally {
  await browser.close();
}
