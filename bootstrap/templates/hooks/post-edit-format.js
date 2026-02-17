// PostToolUse hook: auto-format files after edits
// Detects the appropriate formatter based on file extension
const { execFileSync } = require('child_process');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path || '';
    const ext = path.extname(filePath).toLowerCase();

    // Map file extensions to formatters
    const formatters = {
      '.ts': { cmd: 'npx', args: ['prettier', '--write', filePath] },
      '.tsx': { cmd: 'npx', args: ['prettier', '--write', filePath] },
      '.js': { cmd: 'npx', args: ['prettier', '--write', filePath] },
      '.jsx': { cmd: 'npx', args: ['prettier', '--write', filePath] },
      '.json': { cmd: 'npx', args: ['prettier', '--write', filePath] },
      '.css': { cmd: 'npx', args: ['prettier', '--write', filePath] },
      '.py': { cmd: 'ruff', args: ['format', filePath] },
      '.go': { cmd: 'gofmt', args: ['-w', filePath] },
    };

    const formatter = formatters[ext];
    if (formatter) {
      try {
        execFileSync(formatter.cmd, formatter.args, { stdio: 'pipe', timeout: 10000 });
      } catch {
        // Formatter not installed or failed - non-blocking
      }
    }
  } catch {
    // Silently continue on parse errors
  }
  console.log(data);
});
