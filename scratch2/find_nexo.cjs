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
  // 1. Search for nexoimportaciones in nginx configs
  console.log('=== 1. Searching nginx configs for nexo ===');
  let r = await runSSH('grep -r "nexo" /etc/nginx/ 2>/dev/null');
  console.log(r || '(not found in nginx)');

  // 2. Search in vhost configs
  console.log('\n=== 2. Searching vhosts ===');
  r = await runSSH('grep -r "nexo" /etc/apache2/ /etc/httpd/ /usr/local/apache/ 2>/dev/null || echo "(not in apache)"');
  console.log(r);

  // 3. Check CloudPanel sites list
  console.log('\n=== 3. CloudPanel sites ===');
  r = await runSSH('clpctl site:list 2>/dev/null || ls /etc/nginx/sites-enabled/ 2>/dev/null');
  console.log(r);

  // 4. Check all nginx server_name entries
  console.log('\n=== 4. All server_name in nginx ===');
  r = await runSSH('grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null');
  console.log(r);

  // 5. Check all domain folders
  console.log('\n=== 5. All htdocs directories ===');
  r = await runSSH('find /home -maxdepth 3 -name "htdocs" -type d -exec ls {} \\; 2>/dev/null');
  console.log(r);
}

main().catch(console.error);
