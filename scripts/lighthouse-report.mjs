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
 *   LIGHTHOUSE_USER_AGENT — optional; defaults to a Chrome-Lighthouse mobile UA
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
const lighthouseUserAgent =
  process.env.LIGHTHOUSE_USER_AGENT ??
  [
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022))',
    'AppleWebKit/537.36 (KHTML, like Gecko)',
    'Chrome/136.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
  ].join(' ');
const lighthouseAcceptLanguage =
  process.env.LIGHTHOUSE_ACCEPT_LANGUAGE ?? 'ro-RO,ro;q=0.9,en;q=0.8';

const outDir = path.join(process.cwd(), 'reports', 'lighthouse');
fs.mkdirSync(outDir, { recursive: true });
const runStamp = new Date().toISOString().replace(/[:.]/g, '-');

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

function score(score) {
  return `${((score ?? 0) * 100).toFixed(0)}`;
}

function splitReports(report, lhr) {
  const reports = Array.isArray(report) ? report : [report];
  const strings = reports.map((item) => (typeof item === 'string' ? item : String(item)));
  const html =
    strings.find((item) => item.trimStart().startsWith('<!DOCTYPE html')) ??
    strings.find((item) => item.trimStart().startsWith('<html')) ??
    strings[0] ??
    '';
  const json =
    strings.find((item) => item.trimStart().startsWith('{')) ??
    JSON.stringify(lhr, null, 2);

  return { html, json };
}

function auditIssues(lhr, categoryId) {
  const category = lhr.categories?.[categoryId];
  if (!category) return [];

  return category.auditRefs
    .map((ref) => lhr.audits?.[ref.id])
    .filter((audit) => typeof audit?.score === 'number' && audit.score < 1)
    .map((audit) => ({
      id: audit.id,
      title: audit.title,
      score: audit.score,
      displayValue: audit.displayValue,
    }));
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
const summaryRows = [];

try {
  for (const p of paths) {
    const pathname = p.startsWith('/') ? p : `/${p}`;
    const url = new URL(pathname, `${baseUrl}/`).href;
    process.stdout.write(`lighthouse: ${url}\n`);

    const result = await lighthouse(url, {
      logLevel: 'error',
      port: chrome.port,
      output: ['html', 'json'],
      emulatedUserAgent: lighthouseUserAgent,
      extraHeaders: {
        'Accept-Language': lighthouseAcceptLanguage,
      },
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
      `  scores: perf ${score(perf)} | a11y ${score(a11y)} | bp ${score(bp)} | seo ${score(seo)}`,
    );

    if (!Number.isNaN(minPerfNum) && perf < minPerfNum) {
      console.error(`  FAIL: performance ${perf} < ${minPerfNum}`);
      failed = true;
    }

    const baseName = `${slug(pathname)}-${runStamp}`;
    const htmlPath = path.join(outDir, `${baseName}.html`);
    const jsonPath = path.join(outDir, `${baseName}.json`);
    const { html, json } = splitReports(result.report, result.lhr);
    fs.writeFileSync(htmlPath, html);
    fs.writeFileSync(jsonPath, json);
    console.log(`  report: ${htmlPath}`);
    console.log(`  json:   ${jsonPath}`);

    summaryRows.push({
      pathname,
      scores: { perf, a11y, bp, seo },
      htmlPath,
      jsonPath,
      issues: {
        performance: auditIssues(result.lhr, 'performance'),
        accessibility: auditIssues(result.lhr, 'accessibility'),
        'best-practices': auditIssues(result.lhr, 'best-practices'),
        seo: auditIssues(result.lhr, 'seo'),
      },
      warnings: result.lhr.runWarnings ?? [],
    });
  }
} finally {
  chrome.kill();
}

if (summaryRows.length > 0) {
  const summaryPath = path.join(outDir, `summary-${runStamp}.md`);
  const lines = [
    '# Lighthouse Report',
    '',
    `Base URL: ${baseUrl}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Path | Performance | Accessibility | Best Practices | SEO | HTML | JSON |',
    '| --- | ---: | ---: | ---: | ---: | --- | --- |',
  ];

  for (const row of summaryRows) {
    const htmlName = path.basename(row.htmlPath);
    const jsonName = path.basename(row.jsonPath);
    lines.push(
      `| ${row.pathname} | ${score(row.scores.perf)} | ${score(row.scores.a11y)} | ${score(row.scores.bp)} | ${score(row.scores.seo)} | ${htmlName} | ${jsonName} |`,
    );
  }

  for (const row of summaryRows) {
    lines.push('', `## ${row.pathname}`);
    if (row.warnings.length > 0) {
      lines.push('', 'Warnings:');
      for (const warning of row.warnings) lines.push(`- ${warning}`);
    }

    for (const [category, issues] of Object.entries(row.issues)) {
      if (issues.length === 0) continue;
      lines.push('', `${category}:`);
      for (const issue of issues.slice(0, 12)) {
        const display = issue.displayValue ? ` (${issue.displayValue})` : '';
        lines.push(`- ${issue.title}: score ${score(issue.score)}${display}`);
      }
    }
  }

  fs.writeFileSync(summaryPath, `${lines.join('\n')}\n`);
  console.log(`summary: ${summaryPath}`);
}

if (failed) process.exit(1);
console.log('ok - lighthouse reports written');
