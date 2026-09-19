const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('tail -n 30 /usr/local/apache/logs/error_log || tail -n 30 /var/log/apache2/error.log', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('OUTPUT:\n' + out);
      conn.end();
    }).on('data', d => out += d);
  });
}).connect({
  host: '191.96.251.223',
  port: 22,
  username: 'root',
  password: 'Admin123123@123123'
});
