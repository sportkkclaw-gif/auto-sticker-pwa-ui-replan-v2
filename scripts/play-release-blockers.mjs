import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');
const has = (path, pattern) => existsSync(resolve(process.cwd(), path)) && pattern.test(read(path));

const blockers = [];
const warnings = [];
const checks = [];

const block = (message) => blockers.push(message);
const warn = (message) => warnings.push(message);
const ok = (message) => checks.push(message);

if (has('app/api/auth/login/route.ts', /mock_token_|Demo User|Mock login/i)) {
  block('Mock auth route remains in source: app/api/auth/login/route.ts');
} else {
  ok('No mock auth marker found in login route.');
}

if (
  has('app/api/billing/mock-payment/route.ts', /mock-payment|createPayment|CREDIT_PACKAGES/i) ||
  has('app/api/billing/mock-payment/[id]/complete/route.ts', /completePayment|Mock payment/i)
) {
  block('Mock payment API remains in source: app/api/billing/mock-payment/*');
} else {
  ok('No mock payment API marker found.');
}

if (has('app/api/demo/reset/route.ts', /resetMockStore|resetLineStaticStore/i)) {
  block('Demo reset endpoint remains in source: app/api/demo/reset/route.ts');
} else {
  ok('No demo reset endpoint marker found.');
}

if (has('lib/mock-store.ts', /__AUTO_STICKER_MOCK_STORE__|MockPayment|MockWork/i)) {
  block('In-memory mock store remains in source: lib/mock-store.ts');
} else {
  ok('No in-memory mock store marker found.');
}

if (has('lib/mvpClientStore.ts', /localStorage/i)) {
  block('Client localStorage store remains in source: lib/mvpClientStore.ts');
} else {
  ok('No localStorage store marker found.');
}

if (existsSync(resolve(process.cwd(), 'lib/mock-guard.ts'))) {
  ok('Mock API guard exists: lib/mock-guard.ts');
} else {
  warn('Mock API guard is missing; mock endpoints may be callable in production.');
}

if (process.env.AUTO_STICKER_ENABLE_MOCK_ROUTES === '1') {
  warn('AUTO_STICKER_ENABLE_MOCK_ROUTES=1 is set. Do not use this for Google Play production.');
}

console.log('Google Play production blocker scan');
for (const check of checks) console.log(`  OK    ${check}`);
for (const warning of warnings) console.log(`  WARN  ${warning}`);
for (const blocker of blockers) console.log(`  BLOCK ${blocker}`);

if (blockers.length) {
  console.log('');
  console.log('Not ready for Google Play production until these blockers are removed, replaced, or explicitly scoped to a closed-test/demo track.');
}

const allow = process.env.PLAY_RELEASE_ALLOW_BLOCKERS === '1';
if (blockers.length && allow) {
  console.log('PLAY_RELEASE_ALLOW_BLOCKERS=1 set; returning success for documentation-only runs.');
}

process.exit(blockers.length && !allow ? 1 : 0);
