const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`
sed -i "/WP_HOME/d" /home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com/wp-config.php 2>/dev/null
sed -i "/WP_SITEURL/d" /home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com/wp-config.php 2>/dev/null
sed -i "/define( 'DB_NAME'/i define( 'WP_HOME', 'https://api.ferreterialavalleja.com' );\\ndefine( 'WP_SITEURL', 'https://api.ferreterialavalleja.com' );" /home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com/wp-config.php 2>/dev/null

grep "WP_HOME\\|WP_SITEURL" /home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com/wp-config.php 2>/dev/null
  `, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('OUTPUT:\n' + out);
      conn.end();
    }).on('data', d => out += d);
  });
}).on('error', (err) => {
  console.log('SSH Error:', err);
}).connect({
  host: '193.203.182.222',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:\\Users\\Ruben\\.ssh\\id_rsa')
});
