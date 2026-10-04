const { NodeSSH } = require('node-ssh');
const { sshConfig } = require('./lib/env');
const ssh = new NodeSSH();

async function main() {
    await ssh.connect(sshConfig('UBUNTU'));
    const result = await ssh.execCommand('wget -4 -O supabase.zip https://github.com/supabase/supabase/archive/refs/heads/master.zip');
    console.log("Stdout:", result.stdout);
    console.log("Stderr:", result.stderr);
    ssh.dispose();
}
main();
