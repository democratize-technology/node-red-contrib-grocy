#!/usr/bin/env node
'use strict';

/**
 * Packaging script for node-red-contrib-grocy.
 *
 * Usage:
 *   node scripts/pack.js            # run unit tests, then pack
 *   node scripts/pack.js --no-test  # skip tests, just pack
 *   node scripts/pack.js --live     # run unit + live tests, then pack
 *
 * Output goes to dist/<name>-<version>.tgz
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));

const args = process.argv.slice(2);
const skipTests = args.includes('--no-test');
const runLive  = args.includes('--live');

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(msg)  { console.log(`\n  ${msg}`); }
function ok(msg)   { console.log(`  ✔  ${msg}`); }
function warn(msg) { console.log(`  ⚠  ${msg}`); }
function fail(msg) { console.error(`\n  ✖  ${msg}\n`); process.exit(1); }

function run(cmd, opts = {}) {
    const result = spawnSync(cmd, { shell: true, cwd: ROOT, stdio: 'inherit', ...opts });
    if (result.status !== 0) fail(`Command failed: ${cmd}`);
}

function capture(cmd) {
    return execSync(cmd, { cwd: ROOT }).toString().trim();
}

// ─── Git status check ────────────────────────────────────────────────────────

function checkGit() {
    try {
        const dirty = capture('git status --porcelain');
        if (dirty) {
            warn('Uncommitted changes detected:');
            dirty.split('\n').forEach(l => console.log(`       ${l}`));
            console.log();
        } else {
            ok('Working tree clean');
        }
        const branch = capture('git rev-parse --abbrev-ref HEAD');
        const sha    = capture('git rev-parse --short HEAD');
        ok(`Branch: ${branch}  (${sha})`);
    } catch {
        warn('git not available — skipping git checks');
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

function runTests() {
    log('Running unit tests…');
    // NODE_ENV=ci activates the stable test set (excludes flaky Node-RED helper tests)
    run('npx jest --config config/jest.config.js --ci --runInBand --passWithNoTests', {
        env: { ...process.env, NODE_ENV: 'ci' }
    });
    ok('Unit tests passed');

    if (runLive) {
        log('Running live tests against real Grocy server…');
        run('npx jest --config config/jest.live.config.js --runInBand --forceExit');
        ok('Live tests passed');
    }
}

// ─── Pack ────────────────────────────────────────────────────────────────────

function pack() {
    const distDir = path.join(ROOT, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    // Remove any old tgz for this version
    const expectedName = `${pkg.name}-${pkg.version}.tgz`;
    const oldFile = path.join(ROOT, expectedName);
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);

    log('Packing…');
    // npm pack writes the tgz to cwd (ROOT), then we move it to dist/
    run('npm pack');

    const packed = path.join(ROOT, expectedName);
    if (!fs.existsSync(packed)) fail(`Expected ${expectedName} not found after npm pack`);

    const dest = path.join(distDir, expectedName);
    fs.renameSync(packed, dest);

    const bytes = fs.statSync(dest).size;
    const kb    = (bytes / 1024).toFixed(1);

    ok(`Package ready: dist/${expectedName}  (${kb} kB)`);
    return dest;
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log(`\n  node-red-contrib-grocy  v${pkg.version}`);
console.log('  ─────────────────────────────────');

checkGit();

if (skipTests) {
    warn('Tests skipped (--no-test)');
} else {
    runTests();
}

const outFile = pack();

console.log(`\n  Install in Node-RED:`);
console.log(`  Menu → Manage Palette → Install → Upload → select the file above\n`);
