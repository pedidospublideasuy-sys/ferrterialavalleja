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
  // 1. Find nexoimportaciones
  console.log('=== 1. Finding nexoimportaciones ===');
  let r = await runSSH('find /home -maxdepth 3 -name "wp-config.php" 2>/dev/null');
  console.log(r);

  // 2. Check ALL PHP-FPM pools
  console.log('=== 2. All PHP-FPM pools ===');
  r = await runSSH('ls -la /etc/php/8.4/fpm/pool.d/');
  console.log(r);

  // 3. Check processes sorted by CPU
  console.log('=== 3. Top CPU consumers ===');
  r = await runSSH('ps aux --sort=-%cpu | head -25');
  console.log(r);

  // 4. Check ALL sites on the server
  console.log('=== 4. All sites ===');
  r = await runSSH('ls /home/');
  console.log(r);

  // 5. Find nexoimportaciones specifically
  console.log('=== 5. Nexoimportaciones location ===');
  r = await runSSH('find /home -maxdepth 3 -type d -name "*nexo*" 2>/dev/null');
  console.log(r || '(not found on this server)');

  // 6. Check ALL php-fpm pools and their worker counts
  console.log('=== 6. All pool configs ===');
  r = await runSSH('grep -r "pm.max_children" /etc/php/8.4/fpm/pool.d/');
  console.log(r);

  // 7. Check MySQL slow queries
  console.log('=== 7. MySQL process list ===');
  r = await runSSH('mysql -e "SHOW PROCESSLIST;" 2>/dev/null || echo "Cannot access MySQL"');
  console.log(r);

  // 8. Check wp-cron for ALL sites
  console.log('=== 8. WP-Cron status for all sites ===');
  r = await runSSH('grep -r "DISABLE_WP_CRON" /home/*/htdocs/*/wp-config.php 2>/dev/null');
  console.log(r || '(none disabled)');
}

main().catch(console.error);
