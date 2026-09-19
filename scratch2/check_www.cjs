const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('ls -la /var/www/', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (d) => {
      console.log('STDOUT: ' + d);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '191.96.251.223',
  port: 22,
  username: 'root',
  password: 'Admin123123@123123'
});
