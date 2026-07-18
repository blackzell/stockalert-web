const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function main() {
    await ssh.connect({ host: '102.220.17.198', username: 'ubuntu', password: '5eb62Keby9' });
    const result = await ssh.execCommand('wget -4 -O supabase.zip https://github.com/supabase/supabase/archive/refs/heads/master.zip');
    console.log("Stdout:", result.stdout);
    console.log("Stderr:", result.stderr);
    ssh.dispose();
}
main();
