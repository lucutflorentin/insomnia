#!/usr/bin/env node
/**
 * Run Lighthouse against a locally running server (production recommended).
 *
 * Terminal 1: npm run build && npm run start -- -p 3010
 * Terminal 2: npm run perf:lighthouse
 *
 * Env:
 *   LIGHTHOUSE_BASE_URL — default http://127.0.0.1:3010
 *   LIGHTHOUSE_PATHS — comma-separated paths (default /ro,/ro/booking,/ro/guest-data)
 *   LIGHTHOUSE_MIN_PERFORMANCE — optional 0–1 gate (e.g. 0.85)
 *   CHROME_PATH — optional; defaults to Playwright's Chromium (npx playwright install chromium)
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { chromium } from 'playwright';

const baseUrl = (process.env.LIGHTHOUSE_BASE_URL ?? 'http://127.0.0.1:3010').replace(
  /\/$/,
  '',
);
const paths = (process.env.LIGHTHOUSE_PATHS ?? '/ro,/ro/booking,/ro/guest-data')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const minPerfRaw = process.env.LIGHTHOUSE_MIN_PERFORMANCE;
const minPerfNum =
  minPerfRaw != null && minPerfRaw !== '' ? Number(minPerfRaw) : NaN;

const outDir = path.join(process.cwd(), 'reports', 'lighthouse');
fs.mkdirSync(outDir, { recursive: true });

function slug(p) {
  return p.replace(/^\//, '').replace(/\//g, '-') || 'root';
}

function resolveChromePath() {
  const fromEnv = process.env.CHROME_PATH?.trim();
  if (fromEnv) return fromEnv;
  try {
    return chromium.executablePath();
  } catch {
    return '';
  }
}

const chromeExecutable = resolveChromePath();
if (!chromeExecutable) {
  console.error(
    'No Chromium executable. Set CHROME_PATH or run: npx playwright install chromium',
  );
  process.exit(1);
}

const chrome = await launch({
  chromePath: chromeExecutable,
  chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
});

let failed = false;

try {
  for (const p of paths) {
    const pathname = p.startsWith('/') ? p : `/${p}`;
    const url = new URL(pathname, `${baseUrl}/`).href;
    process.stdout.write(`lighthouse: ${url}\n`);

    const result = await lighthouse(url, {
      logLevel: 'error',
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });

    if (!result?.lhr) {
      console.error(`  no LHR for ${url}`);
      failed = true;
      continue;
    }

    const { categories } = result.lhr;
    const perf = categories.performance?.score ?? 0;
    const a11y = categories.accessibility?.score ?? 0;
    const bp = categories['best-practices']?.score ?? 0;
    const seo = categories.seo?.score ?? 0;

    console.log(
      `  scores: perf ${(perf * 100).toFixed(0)} | a11y ${(a11y * 100).toFixed(0)} | bp ${(bp * 100).toFixed(0)} | seo ${(seo * 100).toFixed(0)}`,
    );

    if (!Number.isNaN(minPerfNum) && perf < minPerfNum) {
      console.error(`  FAIL: performance ${perf} < ${minPerfNum}`);
      failed = true;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const htmlPath = path.join(outDir, `${slug(pathname)}-${stamp}.html`);
    const html = result.report;
    fs.writeFileSync(
      htmlPath,
      typeof html === 'string' ? html : Array.isArray(html) ? html[0] : String(html),
    );
    console.log(`  report: ${htmlPath}`);
  }
} finally {
  chrome.kill();
}

if (failed) process.exit(1);
console.log('ok - lighthouse reports written');
