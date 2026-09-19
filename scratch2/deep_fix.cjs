const { Client } = require('ssh2');

function runSSH(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { reject(err); return; }
        let out = '', errOut = '';
        stream.on('close', () => { conn.end(); resolve(out + errOut); });
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => errOut += d);
      });
    }).on('error', reject).connect({
      host: '191.96.251.223',
      port: 22,
      username: 'root',
      password: 'Admin123123@123123'
    });
  });
}

async function main() {
  // 1. Kill ALL php processes running from hidden .sc_ directories
  console.log('=== 1. Killing malware processes ===');
  let r = await runSSH('ps aux | grep ".sc_" | grep -v grep');
  console.log('Found:', r || '(none)');
  
  r = await runSSH('pkill -9 -f ".sc_" ; echo "pkill done"');
  console.log(r);

  // 2. Find ALL hidden suspicious dirs/files in wp-content
  console.log('\n=== 2. Finding hidden suspicious files ===');
  r = await runSSH('find /home/ferreteria/htdocs/ferreterialavalleja.com/wp-content/ -name ".*" -not -name ".htaccess" -not -name "." -not -name ".." -type f -o -name ".*" -not -name "." -not -name ".." -type d 2>/dev/null');
  console.log('Hidden items:', r || '(none)');

  // 3. Remove ALL hidden .sc_ dirs
  console.log('\n=== 3. Removing malware directories ===');
  r = await runSSH('find /home/ferreteria/htdocs/ferreterialavalleja.com/ -name ".sc_*" -exec rm -rf {} + 2>/dev/null; echo "Removed .sc_ dirs"');
  console.log(r);
  
  r = await runSSH('find /home/ferreteria/htdocs/ferreterialavalleja.com/ -name ".gr_*" -exec rm -rf {} + 2>/dev/null; echo "Removed .gr_ files"');
  console.log(r);

  // 4. Check ALL crontabs
  console.log('\n=== 4. Checking crontabs ===');
  r = await runSSH('crontab -l 2>/dev/null; echo "---ROOT ABOVE---"; crontab -u ferreteria -l 2>/dev/null; echo "---FERRETERIA ABOVE---"');
  console.log(r);

  // 5. Check /etc/cron.d/ for anything suspicious
  console.log('\n=== 5. Checking /etc/cron.d/ ===');
  r = await runSSH('ls -la /etc/cron.d/ && grep -r "sc_" /etc/cron.d/ 2>/dev/null; grep -r "ferreteria" /etc/cron.d/ 2>/dev/null');
  console.log(r);

  // 6. Check systemd timers
  console.log('\n=== 6. Checking systemd timers ===');
  r = await runSSH('systemctl list-timers --all 2>/dev/null | head -20');
  console.log(r);

  // 7. Check PHP-FPM pool config for ferreteria
  console.log('\n=== 7. PHP-FPM pool config ===');
  r = await runSSH('find /etc -name "ferreterialavalleja*" -path "*/php*" 2>/dev/null');
  console.log('Pool files:', r);
  
  // 8. Check current load
  console.log('\n=== 8. Current server load ===');
  r = await runSSH('uptime; free -m; ps aux --sort=-%cpu | head -15');
  console.log(r);
}

main().catch(console.error);
