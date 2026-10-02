#!/usr/bin/env node
// Post-build script: makes dist/index.html compatible with file:// protocol
// by removing `type="module"` and `crossorigin` from the main script tag
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, '..', 'dist', 'index.html');

let html = readFileSync(htmlPath, 'utf-8');
const before = html;

// Remove type="module" and crossorigin attributes from script tags
html = html.replace(
  /<script type="module" crossorigin src="(\.\/assets\/[^"]+)"><\/script>/g,
  '<script src="$1"></script>'
);

if (html !== before) {
  writeFileSync(htmlPath, html);
  console.log('✅ dist/index.html patched for file:// compatibility');
} else {
  console.log('ℹ dist/index.html already compatible (or no module scripts found)');
}
