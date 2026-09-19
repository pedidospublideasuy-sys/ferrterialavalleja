const { Client } = require('ssh2');

const runCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ code, stdout, stderr });
        }).on('data', (data) => {
          stdout += data;
        }).stderr.on('data', (data) => {
          stderr += data;
        });
      });
    }).connect({
      host: '191.96.251.223',
      port: 22,
      username: 'root',
      password: 'Admin123123@123123'
    });
  });
};

async function main() {
  try {
    const res = await runCommand('mysql -u cfepro -p"CFEdb2026!" cfepro -e "SELECT name, sku FROM products WHERE woocommerce_product_id IS NULL LIMIT 120;"');
    console.log('PRODUCTS:', res.stdout);
  } catch (e) {
    console.error(e);
  }
}

main();
