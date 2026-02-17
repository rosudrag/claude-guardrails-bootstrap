#!/usr/bin/env node
// Stop hook: summarize session learnings to ai-docs/learnings.md
// Appends timestamped entries and prunes entries older than 30 days
const fs = require('fs');
const path = require('path');

const LEARNINGS_FILE = path.join(process.cwd(), 'ai-docs', 'learnings.md');
const MAX_AGE_DAYS = 30;

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const transcript = input.transcript_summary || input.stop_reason || '';

    // Extract learning signals from the session transcript
    const learnings = extractLearnings(transcript);

    if (learnings.length > 0) {
      ensureDirectory(path.dirname(LEARNINGS_FILE));
      const existing = readExisting();
      const updated = pruneOldEntries(existing);
      const entry = formatEntry(learnings);
      fs.writeFileSync(LEARNINGS_FILE, updated + entry, 'utf8');
    }
  } catch {
    // Silently continue on errors - never block the session
  }
  console.log(data);
});

// Parse transcript for correction patterns, errors resolved, preferences
function extractLearnings(transcript) {
  const learnings = [];
  if (!transcript) return learnings;

  const patterns = [
    { regex: /correct(ed|ion)|fix(ed)?|wrong|mistake|actually/i, category: 'correction' },
    { regex: /error|exception|fail(ed|ure)?|crash|bug/i, category: 'error-resolved' },
    { regex: /prefer|instead|better|use .+ rather/i, category: 'preference' },
    { regex: /pattern|approach|technique|strategy|convention/i, category: 'pattern' },
  ];

  for (const { regex, category } of patterns) {
    if (regex.test(transcript)) {
      learnings.push({ category, signal: true });
    }
  }

  return learnings;
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readExisting() {
  if (!fs.existsSync(LEARNINGS_FILE)) {
    return '# Session Learnings\n\nAuto-maintained by session hooks. Edit freely to curate.\n\n';
  }
  return fs.readFileSync(LEARNINGS_FILE, 'utf8');
}

function pruneOldEntries(content) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  // Remove entries with dates older than cutoff
  const lines = content.split('\n');
  const pruned = [];
  let skipping = false;

  for (const line of lines) {
    const dateMatch = line.match(/^### (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      skipping = dateMatch[1] < cutoffStr;
    }
    if (!skipping) {
      pruned.push(line);
    }
  }

  return pruned.join('\n');
}

function formatEntry(learnings) {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toISOString().split('T')[1].slice(0, 5);
  const categories = learnings.map(l => l.category);
  const tags = [...new Set(categories)].map(c => `\`${c}\``).join(' ');

  return `### ${date} ${time}\n- Signals: ${tags}\n- _(Edit this entry to record what was learned)_\n\n`;
}
