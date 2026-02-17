// PostToolUse hook: warn about debug statements in edited files
// Works with: JavaScript, TypeScript, Python, Go, C#, Java
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path || '';
    const newString = input.tool_input?.new_string || '';

    // Language-specific debug statement patterns
    const patterns = [
      { regex: /console\.(log|debug|info)\s*\(/, lang: 'js/ts', stmt: 'console.log' },
      { regex: /\bprint\s*\(/, lang: 'python', stmt: 'print()' },
      { regex: /fmt\.Print(ln|f)?\s*\(/, lang: 'go', stmt: 'fmt.Println' },
      { regex: /System\.out\.print(ln)?\s*\(/, lang: 'java', stmt: 'System.out.println' },
      { regex: /Console\.Write(Line)?\s*\(/, lang: 'csharp', stmt: 'Console.WriteLine' },
      { regex: /\bdebugger\b/, lang: 'js/ts', stmt: 'debugger' },
    ];

    for (const { regex, stmt } of patterns) {
      if (regex.test(newString)) {
        console.error(`[Hook] Debug statement detected: ${stmt}`);
        console.error('[Hook] Remove before committing');
        break;
      }
    }
  } catch {
    // Silently continue on parse errors
  }
  console.log(data);
});
