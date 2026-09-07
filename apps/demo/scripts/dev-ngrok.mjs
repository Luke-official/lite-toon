import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, '..');

// Read standard Next.js local env file since we bypass `next dev` initially
import { readFileSync } from 'fs';
try {
  const envFile = readFileSync(resolve(appDir, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s][^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
} catch (e) {
  // Ignore missing .env
}

console.log('🚀 Starting Next.js and ngrok tunnel...');

// Start Next.js
const nextProcess = spawn('npm', ['run', 'next-dev'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: true,
});

// Start ngrok in background
const ngrokDomain = process.env.NGROK_DOMAIN;
const ngrokArgs = ['http', '3000', '--log', 'stdout'];
if (ngrokDomain) {
  ngrokArgs.push('--domain', ngrokDomain);
}

const ngrokProcess = spawn('ngrok', ngrokArgs, {
  cwd: appDir,
  shell: true,
});

ngrokProcess.stdout.on('data', (data) => {
  const line = data.toString();
  const match = line.match(/url=(https:\/\/[^\s]+)/);
  if (match) {
    const baseUrl = match[1];
    const mcpUrl = `${baseUrl}/api/mcp`;
    console.log('\n' + '━'.repeat(70));
    console.log(' 🚀 TASKFLOW DEMO & NGROK TUNNEL READY');
    console.log('━'.repeat(70));
    console.log(`\n 🌍 Base URL: ${baseUrl}\n`);
    console.log(' 🤖 CLAUDE MCP CONNECTOR SETUP:');
    console.log('    1. Go to Claude Settings -> Custom Connectors');
    console.log('    2. Click "Add Connector"');
    console.log('    3. Paste this EXACT URL into the "MCP Server URL" field:');
    console.log(`       👉 ${mcpUrl} 👈\n`);
    
    if (!ngrokDomain) {
      console.log(' ⚠️ IMPORTANT (Temporary Domain):');
      console.log('    Every time you restart this terminal, this URL will change.');
      console.log('    You will need to DELETE the old connector in Claude and add');
      console.log('    a new one. To keep the same URL forever, claim a free static');
      console.log('    domain on ngrok and add NGROK_DOMAIN=your-domain to .env');
    } else {
      console.log(' ✅ USING STATIC DOMAIN:');
      console.log('    You can safely restart this terminal and Claude will instantly');
      console.log('    reconnect without any re-configuration needed!');
    }
    
    console.log('\n' + '━'.repeat(70) + '\n');
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
