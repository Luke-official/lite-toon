import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, '..');

console.log('🚀 Starting Next.js and ngrok tunnel...');

// Start Next.js
const nextProcess = spawn('npm', ['run', 'next-dev'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: true,
});

// Start ngrok in background
const ngrokProcess = spawn('ngrok', ['http', '3000', '--log', 'stdout'], {
  cwd: appDir,
  shell: true,
});

ngrokProcess.stdout.on('data', (data) => {
  const line = data.toString();
  const match = line.match(/url=(https:\/\/[^\s]+)/);
  if (match) {
    console.log('\n' + '━'.repeat(60));
    console.log(' 🌍 NGROK TUNNEL READY: ' + match[1]);
    console.log('    Use this URL for your Claude MCP Connector');
    console.log('━'.repeat(60) + '\n');
  }
});

ngrokProcess.stderr.on('data', (data) => {
  if (data.toString().includes('command not found') || data.toString().includes('not recognized')) {
    console.warn('⚠️  ngrok is not installed or not in PATH. Please install ngrok to use the tunnel.');
  }
});

// Cleanup on exit
const cleanup = () => {
  nextProcess.kill();
  ngrokProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
