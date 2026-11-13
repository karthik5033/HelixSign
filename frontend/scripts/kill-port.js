const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\x1b[33mStopping any running dev servers on port 3000...\x1b[0m');

try {
  if (process.platform === 'win32') {
    const output = execSync('powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"').toString().trim();
    if (output) {
      const pids = output.split(/\r?\n/).map(s => s.trim()).filter(s => s && s !== '0');
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`\x1b[32m✔ Terminated process PID ${pid} holding port 3000\x1b[0m`);
        } catch (e) {}
      }
    }
  }
} catch (e) {}

// Wipe .next cache
try {
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('\x1b[32m✔ Cleaned .next cache directory\x1b[0m');
  }
} catch (e) {
  console.log('\x1b[90m(Cache locked or clean)\x1b[0m');
}

console.log('\x1b[32m✔ Ready to start fresh.\x1b[0m\n');

