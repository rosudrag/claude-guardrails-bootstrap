#!/usr/bin/env node
// Notification hook: load recent session learnings at session start
// Reads ai-docs/learnings.md and outputs the 10 most recent entries
const fs = require('fs');
const path = require('path');

const LEARNINGS_FILE = path.join(process.cwd(), 'ai-docs', 'learnings.md');
const MAX_ENTRIES = 10;

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    if (fs.existsSync(LEARNINGS_FILE)) {
      const content = fs.readFileSync(LEARNINGS_FILE, 'utf8');
      const entries = parseEntries(content);

      if (entries.length > 0) {
        const recent = entries.slice(-MAX_ENTRIES);
        console.error('[Learning] Previous session learnings loaded:');
        for (const entry of recent) {
          console.error(`  ${entry.date}: ${entry.summary}`);
        }
        console.error(`[Learning] ${entries.length} total entries in learnings.md`);
      }
    }
  } catch {
    // Silently continue - learnings are advisory, never blocking
  }
  console.log(data);
});

// Parse the learnings file into structured entries
function parseEntries(content) {
  const entries = [];
  const lines = content.split('\n');
  let currentDate = '';
  let currentLines = [];

  for (const line of lines) {
    const dateMatch = line.match(/^### (\d{4}-\d{2}-\d{2}\s?\d{0,5})/);
    if (dateMatch) {
      if (currentDate && currentLines.length > 0) {
        entries.push({
          date: currentDate.trim(),
          summary: summarize(currentLines),
        });
      }
      currentDate = dateMatch[1];
      currentLines = [];
    } else if (currentDate && line.startsWith('- ')) {
      currentLines.push(line.slice(2).trim());
    }
  }

  // Capture the last entry
  if (currentDate && currentLines.length > 0) {
    entries.push({
      date: currentDate.trim(),
      summary: summarize(currentLines),
    });
  }

  return entries;
}

// Condense entry lines into a short summary string
function summarize(lines) {
  const meaningful = lines.filter(l => !l.startsWith('_('));
  if (meaningful.length === 0) return lines[0] || '(no details)';
  return meaningful.join('; ').slice(0, 120);
}
