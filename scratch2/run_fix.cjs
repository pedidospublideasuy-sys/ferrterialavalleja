const { spawn } = require('child_process');
const fs = require('fs');

const rawScript = fs.readFileSync('scratch2/fix_hostinger.sh', 'utf-8');
const cleanScript = rawScript.replace(/\\r/g, '');

const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(cleanScript);
proc.stdin.end();
