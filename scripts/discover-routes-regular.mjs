#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

const repoRoot = process.cwd();
const cacheDir = path.join(repoRoot, 'CONTEXT_CACHE');
const dbPath = path.join(cacheDir, 'ui_audit.db');
const artifactsDir = path.join(repoRoot, 'artifacts', 'regular');
const artifactPath = path.join(artifactsDir, 'discovery.json');

function log(msg) { console.log(`[discover-regular] ${msg}`); }
function fail(msg, code = 1) { console.error(`[discover-regular] ${msg}`); process.exit(code); }

function execP(cmd) { return new Promise((resolve, reject) => exec(cmd, (e, stdout, stderr) => e ? reject(new Error(stderr || e?.message || 'exec failed')) : resolve({ stdout, stderr }))); }

function normalizePath(p) {
  if (!p) return '/';
  let out = p.trim();
  if (!out.startsWith('/')) out = '/' + out;
  out = out.replace(/\\+/g, '/');
  out = out.replace(/\s+/g, '');
  out = out.replace(/\/+/g, '/');
  out = out.toLowerCase();
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1);
  return out;
}

function uniq(arr) { return Array.from(new Set(arr)); }

// Extract paths from packages/core/constants/routes.ts (static regex on path: "...")
function extractPathsFromConstants() {
  const constantsPath = path.join(repoRoot, 'packages', 'core', 'constants', 'routes.ts');
  if (!fs.existsSync(constantsPath)) return [];
  const content = fs.readFileSync(constantsPath, 'utf8');
  const regex = /\bpath:\s*"([^"]+)"/g;
  const paths = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    paths.push(m[1]);
  }
  return paths.map(normalizePath);
}

// Derive paths from Expo Router filesystem under apps/expo/app
function extractPathsFromExpoRouter() {
  const appDir = path.join(repoRoot, 'apps', 'expo', 'app');
  if (!fs.existsSync(appDir)) return [];

  const results = new Set();

  function isRoutableFile(fp) {
    const name = path.basename(fp);
    if (name.startsWith('_')) return false; // _layout etc.
    if (!/\.(tsx|ts|jsx|js)$/.test(name)) return false;
    return true;
  }

  function segmentFromName(name) {
    // [id] -> :id, [[...rest]] -> :rest, (group) -> '' (skip)
    if (name.startsWith('(') && name.endsWith(')')) return '';
    if (name.startsWith('[') && name.endsWith(']')) {
      const inner = name.slice(1, -1);
      // catch rest params like ...slug
      const cleaned = inner.replace(/^\.\.\./, '');
      return `:${cleaned}`;
    }
    if (name === 'index') return '';
    return name;
  }

  function walk(dir, parts = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    // If there is an index file at this level, record the current path
    const hasIndex = entries.some(e => e.isFile() && /^(index)\.(tsx|ts|jsx|js)$/.test(e.name));
    if (hasIndex) results.add(normalizePath('/' + parts.filter(Boolean).join('/')));

    for (const ent of entries) {
      if (ent.isDirectory()) {
        const seg = segmentFromName(ent.name);
        if (seg === '') {
          // grouping dir or index — traverse without adding segment
          walk(path.join(dir, ent.name), parts);
        } else {
          walk(path.join(dir, ent.name), [...parts, seg]);
        }
        continue;
      }
      if (ent.isFile() && isRoutableFile(ent.name)) {
        const base = ent.name.replace(/\.(tsx|ts|jsx|js)$/, '');
        if (base === 'index') {
          results.add(normalizePath('/' + parts.filter(Boolean).join('/')));
        } else if (!base.startsWith('_')) {
          const seg = segmentFromName(base);
          const full = normalizePath('/' + [...parts, seg].filter(Boolean).join('/'));
          results.add(full);
        }
      }
    }
  }

  walk(appDir, []);
  return Array.from(results);
}

async function upsertRoutes(userLevel, routes) {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(dbPath)) fail(`SQLite DB not found at ${dbPath}. Run bootstrap first.`);

  // Build a single SQL script for performance
  const statements = [
    'BEGIN;'
  ];
  for (const r of routes) {
    const routeEsc = r.replace(/'/g, "''");
    const levelEsc = userLevel.replace(/'/g, "''");
    statements.push(
      `INSERT INTO routes(user_level, route, status) VALUES ('${levelEsc}','${routeEsc}','discovered') ` +
      `ON CONFLICT(user_level, route) DO UPDATE SET status='discovered', discovered_at=datetime('now');`
    );
  }
  statements.push('COMMIT;');
  const sql = statements.join('\n');

  await execP(`sqlite3 ${dbPath} <<'SQL'\n${sql}\nSQL`);
}

(async () => {
  log('Starting route discovery for user-level: regular');
  const fromConstants = extractPathsFromConstants();
  const fromExpo = extractPathsFromExpoRouter();

  const merged = uniq([...fromConstants, ...fromExpo]).filter(Boolean);

  // Ensure artifacts directory
  fs.mkdirSync(artifactsDir, { recursive: true });

  // Write artifacts
  const artifact = {
    userLevel: 'regular',
    counts: {
      fromConstants: fromConstants.length,
      fromExpo: fromExpo.length,
      unique: merged.length,
    },
    routes: merged.sort(),
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  log(`Wrote artifact: ${artifactPath}`);

  // Upsert into SQLite
  await upsertRoutes('regular', merged);
  log(`Upserted ${merged.length} routes into SQLite at ${dbPath}`);
})();


