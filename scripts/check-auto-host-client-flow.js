#!/usr/bin/env node
const fs = require('fs');

const source = fs.readFileSync('src/store/modules/synclounge/actions.js', 'utf8');

const requiredSnippets = [
  'userInitiated: false',
  'const shouldWaitForAutoHostDecision = userInitiated == null',
  '&& getters.IS_AUTO_HOST_ENABLED',
  '&& !getters.AM_I_HOST',
  'if (!userInitiated && !shouldWaitForAutoHostDecision)',
];

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    throw new Error(`Missing expected Auto-Host client-flow guard: ${snippet}`);
  }
}

const shouldSyncAfterMediaUpdate = ({ userInitiated, isAutoHostEnabled, amIHost }) => {
  const shouldWaitForAutoHostDecision = userInitiated == null
    && isAutoHostEnabled
    && !amIHost;

  return !userInitiated && !shouldWaitForAutoHostDecision;
};

const cases = [
  {
    label: 'external Plex detection waits for server Auto-Host decision',
    input: { userInitiated: null, isAutoHostEnabled: true, amIHost: false },
    expected: false,
  },
  {
    label: 'sync-directed playback remains explicitly non-user-initiated',
    input: { userInitiated: false, isAutoHostEnabled: true, amIHost: false },
    expected: true,
  },
  {
    label: 'Auto-Host disabled keeps previous non-user-initiated sync behavior',
    input: { userInitiated: null, isAutoHostEnabled: false, amIHost: false },
    expected: true,
  },
  {
    label: 'current host still treats polled media changes as local state to sync',
    input: { userInitiated: null, isAutoHostEnabled: true, amIHost: true },
    expected: true,
  },
];

for (const { label, input, expected } of cases) {
  const actual = shouldSyncAfterMediaUpdate(input);
  if (actual !== expected) {
    throw new Error(`${label}: expected shouldSync=${expected}, got ${actual}`);
  }
}

console.log('PASS Auto-Host client-flow guard checks');
