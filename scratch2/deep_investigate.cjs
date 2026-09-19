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
  // 1. Find AI models or heavy software
  console.log('=== 1. Searching for AI/ML software (llama, qwen, ollama, etc.) ===');
  let r = await runSSH('which ollama 2>/dev/null; which llama 2>/dev/null; which python3 2>/dev/null; systemctl list-units --type=service --state=running | grep -iE "ollama|llama|qwen|ai|ml|model|jupyter|torch" 2>/dev/null; echo "---"; find / -maxdepth 3 -name "ollama" -o -name "*.gguf" -o -name "qwen*" 2>/dev/null | head -20');
  console.log(r);

  // 2. Check docker containers
  console.log('\n=== 2. Docker containers ===');
  r = await runSSH('docker ps 2>/dev/null || echo "Docker not running/installed"');
  console.log(r);

  // 3. ALL running services sorted by memory
  console.log('\n=== 3. Top memory consumers ===');
  r = await runSSH('ps aux --sort=-%mem | head -20');
  console.log(r);

  // 4. ALL listening ports
  console.log('\n=== 4. All listening ports ===');
  r = await runSSH('ss -tlnp | head -30');
  console.log(r);

  // 5. Disk usage
  console.log('\n=== 5. Disk usage ===');
  r = await runSSH('df -h; echo "---"; du -sh /home/*/ 2>/dev/null');
  console.log(r);

  // 6. Find ALL running services
  console.log('\n=== 6. All running services ===');
  r = await runSSH('systemctl list-units --type=service --state=running --no-pager');
  console.log(r);

  // 7. Check nexoimportaciones in nginx
  console.log('\n=== 7. Nexo in nginx/sites ===');
  r = await runSSH('grep -rl "nexo" /etc/nginx/ 2>/dev/null; ls /etc/nginx/sites-enabled/ 2>/dev/null');
  console.log(r);

  // 8. WP options for siteurl/home in database
  console.log('\n=== 8. WP siteurl from DB ===');
  r = await runSSH(`grep "DB_NAME\\|DB_USER\\|DB_PASSWORD" /home/ferreteria/htdocs/ferreterialavalleja.com/wp-config.php | head -3`);
  console.log(r);
}

main().catch(console.error);
