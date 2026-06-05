import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = resolve(process.cwd(), 'play-assets');
const screenshotsDir = join(root, 'phone-screenshots');
const featureGraphic = join(root, 'feature-graphic.png');
const allowedImageExt = new Set(['.png', '.jpg', '.jpeg']);

const checks = [];
const warnings = [];
const errors = [];

const ok = (message) => checks.push(message);
const warn = (message) => warnings.push(message);
const fail = (message) => errors.push(message);

if (!existsSync(root)) {
  fail('play-assets/ is missing.');
} else {
  ok('play-assets/ exists.');
}

if (!existsSync(screenshotsDir)) {
  fail('play-assets/phone-screenshots/ is missing.');
} else {
  const screenshots = readdirSync(screenshotsDir)
    .filter((name) => allowedImageExt.has(extname(name).toLowerCase()))
    .map((name) => ({ name, size: statSync(join(screenshotsDir, name)).size }));
  if (screenshots.length >= 2) ok(`Phone screenshots present: ${screenshots.length}.`);
  else fail(`At least 2 phone screenshots are required; found ${screenshots.length}.`);
  for (const shot of screenshots) {
    if (shot.size > 8 * 1024 * 1024) warn(`${shot.name} is larger than 8 MB; verify Play Console upload limits.`);
  }
}

if (existsSync(featureGraphic)) {
  ok('Feature graphic exists: play-assets/feature-graphic.png.');
} else {
  fail('Feature graphic is missing: play-assets/feature-graphic.png.');
}

console.log('Google Play listing asset doctor');
for (const check of checks) console.log(`  OK   ${check}`);
for (const warning of warnings) console.log(`  WARN ${warning}`);
for (const error of errors) console.error(`  ERR  ${error}`);

if (errors.length) {
  console.log('');
  console.log('Expected structure:');
  console.log('  play-assets/feature-graphic.png');
  console.log('  play-assets/phone-screenshots/01-home.png');
  console.log('  play-assets/phone-screenshots/02-create.png');
  console.log('  play-assets/phone-screenshots/03-templates.png');
  console.log('  play-assets/phone-screenshots/04-works.png');
}

process.exit(errors.length ? 1 : 0);
