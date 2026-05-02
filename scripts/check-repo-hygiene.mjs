import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const strict = process.env.REPO_HYGIENE_STRICT === '1';
const warnings = [];
const failures = [];

function runGit(args) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    failures.push(`git ${args.join(' ')} failed: ${result.stderr.trim()}`);
    return '';
  }

  return result.stdout.trim();
}

function recordWarning(message) {
  warnings.push(message);
  if (strict) failures.push(message);
}

const trackedFiles = runGit(['ls-files']).split('\n').filter(Boolean);
const forbiddenTracked = trackedFiles.filter((file) => {
  return (
    file === 'deploy.tar.gz' ||
    file.endsWith('.tar.gz') ||
    /^backup-.*\.sql$/.test(file) ||
    file.startsWith('.claude/')
  );
});

if (forbiddenTracked.length > 0) {
  recordWarning(
    `Tracked deploy/local artifacts should be removed intentionally: ${forbiddenTracked.join(', ')}`,
  );
}

if (!existsSync('prisma/migrations/20260428000000_baseline/migration.sql')) {
  failures.push('Missing Prisma baseline migration.');
}

if (!existsSync('docs/PRELIVE_CHECKLIST.md')) {
  failures.push('Missing prelive checklist.');
}

if (!existsSync('scripts/smoke-local.mjs')) {
  failures.push('Missing local smoke script.');
}

if (existsSync('.antigravityignore')) {
  const antigravityIgnore = readFileSync('.antigravityignore', 'utf8');
  const requiredAntigravityPatterns = [
    '.claude/',
    '.git/',
    'node_modules/',
    '.next/',
    'package-lock.json',
    '*.tsbuildinfo',
  ];

  const missingPatterns = requiredAntigravityPatterns.filter(
    (pattern) => !antigravityIgnore.includes(pattern),
  );

  if (missingPatterns.length > 0) {
    recordWarning(
      `.antigravityignore is missing heavy workspace exclusions: ${missingPatterns.join(', ')}`,
    );
  }
} else {
  recordWarning('Missing .antigravityignore for AI workspace indexing hygiene.');
}

for (const warning of warnings) {
  console.warn(`warn - ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`fail - ${failure}`);
  }
  process.exit(1);
}

console.log('ok - repo hygiene checks passed');
