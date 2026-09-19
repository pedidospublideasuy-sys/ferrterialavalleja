const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('uptime; ls /home/', (err, stream) => {
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
  password: 'Admin123123@123123',
  readyTimeout: 10000
});
