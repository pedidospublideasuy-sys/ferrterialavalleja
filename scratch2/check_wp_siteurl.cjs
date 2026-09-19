const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('grep -i WP_SITEURL /home/ferreteria/htdocs/ferreterialavalleja.com/wp-config.php', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => console.log('STDOUT: ' + d));
  });
}).connect({
  host: '191.96.251.223',
  port: 22,
  username: 'root',
  password: 'Admin123123@123123'
});
