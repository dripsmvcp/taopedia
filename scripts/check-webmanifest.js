import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(projectRoot, 'public', 'site.webmanifest');
const distDir = path.join(projectRoot, 'dist');

// ---- 1) Source file must exist and be valid JSON ----------------------------
assert.ok(fs.existsSync(manifestPath), 'public/site.webmanifest not found');
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch {
  assert.fail('site.webmanifest is not valid JSON');
}

// ---- 2) Required W3C Web App Manifest fields --------------------------------
assert.ok(typeof manifest.name === 'string' && manifest.name.length > 0, 'manifest must have a non-empty "name"');
assert.ok(
  typeof manifest.short_name === 'string' && manifest.short_name.length > 0,
  'manifest must have a non-empty "short_name"',
);
assert.ok(typeof manifest.start_url === 'string', 'manifest must declare "start_url"');
assert.equal(manifest.start_url, '/', 'start_url should be "/" for a site-wide manifest');

const validDisplayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
assert.ok(validDisplayModes.includes(manifest.display), `manifest "display" must be one of ${validDisplayModes.join(', ')}`);

// ---- 3) Color fields must be valid CSS hex colors ---------------------------
const hexColorRe = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
assert.ok(
  typeof manifest.theme_color === 'string' && hexColorRe.test(manifest.theme_color),
  'manifest "theme_color" must be a valid hex color',
);
assert.ok(
  typeof manifest.background_color === 'string' && hexColorRe.test(manifest.background_color),
  'manifest "background_color" must be a valid hex color',
);

// ---- 4) Icons: at least one icon, each with src/sizes/type, file exists -----
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'manifest must declare at least one icon');
for (const icon of manifest.icons) {
  assert.ok(typeof icon.src === 'string' && icon.src.length > 0, 'each icon must have a "src"');
  assert.ok(typeof icon.sizes === 'string' && /^\d+x\d+$/.test(icon.sizes), `icon "${icon.src}" must have a valid "sizes" (e.g. "32x32")`);
  assert.ok(typeof icon.type === 'string' && icon.type.startsWith('image/'), `icon "${icon.src}" must have an image/* "type"`);

  // Icon src is an absolute path rooted at public/
  const iconFile = path.join(projectRoot, 'public', icon.src.replace(/^\//, ''));
  assert.ok(fs.existsSync(iconFile), `icon file "${icon.src}" referenced in manifest must exist in public/`);
}

// ---- 5) Built output: manifest is copied to dist/ and discoverable ----------
if (fs.existsSync(distDir)) {
  const distManifest = path.join(distDir, 'site.webmanifest');
  assert.ok(fs.existsSync(distManifest), 'site.webmanifest must be present in dist/ after build');

  // Verify at least one built HTML page includes the discovery <link>.
  const indexHtml = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    const html = fs.readFileSync(indexHtml, 'utf8');
    assert.ok(
      html.includes('rel="manifest"') && html.includes('site.webmanifest'),
      'built index.html must include <link rel="manifest" href="/site.webmanifest" /> for PWA discovery',
    );
  }
}

console.log(`Web manifest check passed (${manifest.icons.length} icon(s) validated)`);
