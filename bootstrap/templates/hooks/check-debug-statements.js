// Stop hook: check all recently modified files for debug statements
const { execSync } = require('child_process');
const fs = require('fs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    // Get list of modified files from git
    const modified = execSync('git diff --name-only HEAD 2>/dev/null || echo ""', {
      encoding: 'utf8',
      timeout: 5000,
    }).trim();

    if (!modified) {
      console.log(data);
      return;
    }

    const files = modified.split('\n').filter(f => f.length > 0);

    // Debug patterns per extension
    const debugPatterns = {
      '.ts': /console\.(log|debug)\s*\(/,
      '.tsx': /console\.(log|debug)\s*\(/,
      '.js': /console\.(log|debug)\s*\(/,
      '.jsx': /console\.(log|debug)\s*\(/,
      '.py': /\bprint\s*\(/,
      '.go': /fmt\.Print(ln|f)?\s*\(/,
      '.cs': /Console\.Write(Line)?\s*\(/,
      '.java': /System\.out\.print(ln)?\s*\(/,
    };

    const issues = [];

    for (const file of files) {
      const ext = '.' + file.split('.').pop();
      const pattern = debugPatterns[ext];
      if (!pattern) continue;

      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            issues.push(`  ${file}:${i + 1}: ${lines[i].trim()}`);
          }
        }
      } catch {
        // File may have been deleted
      }
    }

    if (issues.length > 0) {
      console.error('[Hook] Debug statements found in modified files:');
      for (const issue of issues.slice(0, 10)) {
        console.error(issue);
      }
      if (issues.length > 10) {
        console.error(`  ... and ${issues.length - 10} more`);
      }
      console.error('[Hook] Remove before committing');
    }
  } catch {
    // Silently continue on errors
  }
  console.log(data);
});
