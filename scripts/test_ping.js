const { NodeSSH } = require('node-ssh');
const { sshConfig } = require('./lib/env');
const ssh = new NodeSSH();

async function main() {
    await ssh.connect(sshConfig('ROOT'));
    console.log("Ping github...");
    const res = await ssh.execCommand('ping -c 3 github.com');
    console.log(res.stdout);
    console.log(res.stderr);
    console.log("Curl jsdelivr...");
    const res2 = await ssh.execCommand('curl -sL -w "%{http_code}" -o /dev/null https://cdn.jsdelivr.net/');
    console.log(res2.stdout);
    ssh.dispose();
}
main();
