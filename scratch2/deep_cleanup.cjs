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
  const WP = '/home/ferreteria/htdocs/ferreterialavalleja.com';
  
  // 1. Kill ALL suspicious PHP processes
  console.log('=== 1. Killing ALL malware processes ===');
  let r = await runSSH('pkill -9 -f ".sc_" ; pkill -9 -f ".gr_" ; pkill -9 -f ".kk_" ; pkill -9 -f ".gx_" ; echo "done killing"');
  console.log(r);

  // 2. Remove ALL hidden malware files found in scan
  console.log('\n=== 2. Removing ALL malware files ===');
  const malwareFiles = [
    `${WP}/wp-content/.kk_a92872b7`,
    `${WP}/wp-content/.6c8b6d3a.php`,
    `${WP}/wp-content/cache/.gx_f115bd9b`,
    `${WP}/wp-content/mu-plugins/.bt_datum-booster-x`,
    `${WP}/wp-content/mu-plugins/.sd_datum-booster-x`,
    `${WP}/wp-content/mu-plugins/.swm_datum-booster-x`,
    `${WP}/wp-content/mu-plugins/.rd_datum-booster-x`,
  ];
  for (const f of malwareFiles) {
    r = await runSSH(`rm -rf "${f}" && echo "Removed: ${f}" || echo "Not found: ${f}"`);
    console.log(r.trim());
  }

  // 3. Also clean any remaining .sc_ .gr_ .kk_ .gx_ patterns
  console.log('\n=== 3. Deep clean hidden patterns ===');
  r = await runSSH(`find ${WP} \\( -name ".sc_*" -o -name ".gr_*" -o -name ".kk_*" -o -name ".gx_*" -o -name "*.php" -path "*/mu-plugins/.*" \\) -exec rm -rf {} + 2>/dev/null; echo "Deep clean done"`);
  console.log(r);

  // 4. Check mu-plugins for suspicious loaders
  console.log('\n=== 4. Checking mu-plugins ===');
  r = await runSSH(`ls -la ${WP}/wp-content/mu-plugins/`);
  console.log(r);

  // 5. Reduce PHP-FPM workers to save CPU/RAM
  console.log('\n=== 5. Optimizing PHP-FPM pool ===');
  r = await runSSH(`cat /etc/php/8.4/fpm/pool.d/ferreterialavalleja.com.conf | grep -E "pm\\.max|pm\\.start|pm\\.min|pm\\.idle|pm ="`);
  console.log('Current config:', r);
  
  // Reduce workers
  r = await runSSH(`
sed -i 's/^pm\\.max_children = .*/pm.max_children = 4/' /etc/php/8.4/fpm/pool.d/ferreterialavalleja.com.conf
sed -i 's/^pm\\.start_servers = .*/pm.start_servers = 2/' /etc/php/8.4/fpm/pool.d/ferreterialavalleja.com.conf
sed -i 's/^pm\\.min_spare_servers = .*/pm.min_spare_servers = 1/' /etc/php/8.4/fpm/pool.d/ferreterialavalleja.com.conf
sed -i 's/^pm\\.max_spare_servers = .*/pm.max_spare_servers = 3/' /etc/php/8.4/fpm/pool.d/ferreterialavalleja.com.conf
echo "PHP-FPM config updated"
`);
  console.log(r);

  // 6. Restart PHP-FPM
  console.log('\n=== 6. Restarting PHP-FPM ===');
  r = await runSSH('systemctl restart php8.4-fpm && echo "PHP-FPM restarted OK" || echo "PHP-FPM restart FAILED"');
  console.log(r);

  // 7. Verify malware is gone
  console.log('\n=== 7. Verifying cleanup ===');
  r = await runSSH(`ps aux | grep -E "\\.sc_|\\.gr_|\\.kk_|\\.gx_" | grep -v grep`);
  console.log('Malware processes:', r || '(NONE - CLEAN!)');

  r = await runSSH(`find ${WP}/wp-content -maxdepth 1 -name ".*" -not -name ".htaccess" -not -name ".litespeed_conf.dat" -not -name ".user.ini" -not -name "." -not -name ".." -not -name ".wp-object-cache*"`);
  console.log('Suspicious hidden files:', r || '(NONE - CLEAN!)');

  // 8. Final server status
  console.log('\n=== 8. Final server status ===');
  r = await runSSH('uptime; echo "---"; free -m');
  console.log(r);
}

main().catch(console.error);
