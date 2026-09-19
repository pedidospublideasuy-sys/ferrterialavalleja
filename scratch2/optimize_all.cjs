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
  // 1. Reduce ALL PHP-FPM pools
  console.log('=== 1. Reducing ALL PHP-FPM pools ===');
  const pools = [
    'app.ferreterialavalleja.com.conf',
    'limpiezadetapizadosuy.com.conf',
    'fprmetal.com.conf',
    'angelalisabeauty.com.conf',
    'default.conf'
  ];
  for (const pool of pools) {
    let r = await runSSH(`
sed -i 's/^pm\\.max_children = .*/pm.max_children = 4/' /etc/php/8.4/fpm/pool.d/${pool}
sed -i 's/^pm\\.start_servers = .*/pm.start_servers = 2/' /etc/php/8.4/fpm/pool.d/${pool}
sed -i 's/^pm\\.min_spare_servers = .*/pm.min_spare_servers = 1/' /etc/php/8.4/fpm/pool.d/${pool}
sed -i 's/^pm\\.max_spare_servers = .*/pm.max_spare_servers = 3/' /etc/php/8.4/fpm/pool.d/${pool}
echo "Optimized: ${pool}"
`);
    console.log(r.trim());
  }

  // 2. Disable WP-Cron on ALL WordPress sites
  console.log('\n=== 2. Disabling WP-Cron on ALL sites ===');
  const sites = [
    '/home/angela/htdocs/angelalisabeauty.com',
    '/home/root23/htdocs/fprmetal.com',
    '/home/root2/htdocs/limpiezadetapizadosuy.com',
    '/home/admin1/htdocs/www.placenciapainting.com',
    '/home/ferreteria/htdocs/ferreterialavalleja.com/nv',
  ];
  for (const site of sites) {
    let r = await runSSH(`
if [ -f "${site}/wp-config.php" ]; then
  grep -q "DISABLE_WP_CRON" "${site}/wp-config.php"
  if [ $? -ne 0 ]; then
    sed -i "/define( 'DB_NAME'/i define( 'DISABLE_WP_CRON', true );" "${site}/wp-config.php"
    echo "Disabled WP-Cron: ${site}"
  else
    echo "Already disabled: ${site}"
  fi
else
  echo "Not found: ${site}"
fi
`);
    console.log(r.trim());
  }

  // 3. Clean malware from ALL sites
  console.log('\n=== 3. Cleaning ALL sites ===');
  let r = await runSSH(`
find /home -name ".sc_*" -exec rm -rf {} + 2>/dev/null
find /home -name ".gr_*" -exec rm -rf {} + 2>/dev/null
find /home -name ".kk_*" -exec rm -rf {} + 2>/dev/null
find /home -name ".gx_*" -exec rm -rf {} + 2>/dev/null
find /home -name ".6c8b6d3a.php" -exec rm -rf {} + 2>/dev/null
pkill -9 -f ".sc_" 2>/dev/null
pkill -9 -f ".gr_" 2>/dev/null
pkill -9 -f ".kk_" 2>/dev/null
echo "All sites cleaned"
`);
  console.log(r);

  // 4. Check app.ferreterialavalleja.com (cfepro) for malware too
  console.log('=== 4. Checking cfepro (ERP) mu-plugins ===');
  r = await runSSH('ls -la /home/cfepro/htdocs/app.ferreterialavalleja.com/wp-content/mu-plugins/ 2>/dev/null || echo "No mu-plugins"');
  console.log(r);

  // 5. Restart PHP-FPM
  console.log('\n=== 5. Restarting PHP-FPM ===');
  r = await runSSH('systemctl restart php8.4-fpm && echo "PHP-FPM restarted OK"');
  console.log(r);

  // 6. Verify pool config
  console.log('\n=== 6. Verify pool configs ===');
  r = await runSSH('grep -r "pm.max_children" /etc/php/8.4/fpm/pool.d/');
  console.log(r);

  // 7. Final status
  console.log('\n=== 7. Final status ===');
  r = await runSSH('uptime; echo "---"; free -m; echo "---"; ps aux --sort=-%cpu | head -10');
  console.log(r);
}

main().catch(console.error);
