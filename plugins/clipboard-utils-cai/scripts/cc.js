#!/usr/bin/env node
'use strict';

// Reads the most recent Claude Code session JSONL, extracts commands from the
// last assistant message, and copies them to clipboard in reverse order so the
// first command appears at the top of clipboard history (Raycast, Maccy, etc.)

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ── Find most recent session across all projects ─────────────────────────────

const projectsDir = path.join(process.env.HOME, '.claude', 'projects');

let latestFile = null;
let latestMtime = 0;

for (const project of fs.readdirSync(projectsDir)) {
  const dir = path.join(projectsDir, project);
  try {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.jsonl')) continue;
      const full = path.join(dir, file);
      const mtime = fs.statSync(full).mtimeMs;
      if (mtime > latestMtime) { latestMtime = mtime; latestFile = full; }
    }
  } catch { /* skip unreadable dirs */ }
}

if (!latestFile) {
  console.error('No Claude session files found.');
  process.exit(1);
}

// ── Find last assistant message with text content ────────────────────────────

const lines = fs.readFileSync(latestFile, 'utf8').trim().split('\n');

let lastText = null;
for (let i = lines.length - 1; i >= 0; i--) {
  let entry;
  try { entry = JSON.parse(lines[i]); } catch { continue; }
  if (entry.type !== 'assistant') continue;
  const content = entry.message?.content;
  if (!Array.isArray(content)) continue;
  const text = content.filter(c => c.type === 'text').map(c => c.text).join('\n');
  if (text.trim()) { lastText = text; break; }
}

if (!lastText) {
  console.log('No assistant message found.');
  process.exit(0);
}

// ── Extract commands ──────────────────────────────────────────────────────────

const commands = [];

// 1. Triple-backtick code blocks
const codeBlockRe = /```[^\n]*\n([\s\S]*?)```/g;
let m;
while ((m = codeBlockRe.exec(lastText)) !== null) {
  const block = m[1].trim();
  if (block) commands.push(block);
}

// Strip code blocks before scanning inline content
const noCode = lastText.replace(/```[\s\S]*?```/g, '');

// 2. Standalone slash commands (lines starting with /, no → annotation)
for (const raw of noCode.split('\n')) {
  const line = raw.replace(/^`|`$/g, '').trim(); // strip surrounding backticks
  if (line.startsWith('/') && !line.includes(' → ') && line.length > 1) {
    if (!commands.includes(line)) commands.push(line);
  }
}

// 3. Shell prompt lines prefixed with $ or >
for (const raw of noCode.split('\n')) {
  const line = raw.trim();
  if (/^[$>]\s/.test(line)) {
    const stripped = line.replace(/^[$>]\s*/, '').trim();
    if (stripped && !commands.includes(stripped)) commands.push(stripped);
  }
}

if (!commands.length) {
  console.log('No commands found.');
  process.exit(0);
}

// ── Copy in reverse order (last cmd first → first cmd ends up on top) ────────

const reversed = [...commands].reverse();
for (let i = 0; i < reversed.length; i++) {
  spawnSync('pbcopy', [], { input: reversed[i] });
  if (i < reversed.length - 1) spawnSync('sleep', ['0.3']);
}

// ── Report ────────────────────────────────────────────────────────────────────

console.log(`✓ ${commands.length} command(s) in clipboard:`);
commands.forEach((cmd, i) => {
  const preview = cmd.includes('\n') ? cmd.split('\n')[0] + ' …' : cmd;
  const short = preview.length > 70 ? preview.slice(0, 67) + '...' : preview;
  console.log(`  ${i + 1}. ${short}`);
});
