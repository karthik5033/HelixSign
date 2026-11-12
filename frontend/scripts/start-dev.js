const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const cmd = `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`;
      const output = execSync(cmd).toString().trim();
      if (output) {
        const pids = output.split(/\r?\n/).map(s => s.trim()).filter(s => s && s !== '0');
        for (const pid of pids) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`\x1b[33m⚡ Freed port ${port} (terminated stale process PID ${pid})\x1b[0m`);
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

function cleanTmpFiles() {
  try {
    const devPath = path.join(process.cwd(), '.next', 'static', 'development');
    if (fs.existsSync(devPath)) {
      fs.rmSync(devPath, { recursive: true, force: true });
    }
  } catch (e) {}
}

async function main() {
  const inUse = await checkPort(3000);
  if (inUse) {
    killPort(3000);
    // Short delay to let OS release TCP socket
    await new Promise((r) => setTimeout(r, 600));
  }

  // Clear any corrupted .tmp manifest files from previous crashed sessions
  cleanTmpFiles();

  console.log('\x1b[32m✔ Environment clean: starting HelixSign dev server on http://localhost:3000\x1b[0m\n');
  const child = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main();
