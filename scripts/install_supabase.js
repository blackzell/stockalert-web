const { NodeSSH } = require('node-ssh');
const { sshConfig, requireEnv, setEnvLine } = require('./lib/env');
const ssh = new NodeSSH();

async function main() {
    console.log("Connexion au serveur...");
    await ssh.connect(sshConfig('UBUNTU', { readyTimeout: 20000 }));
    console.log("Connecté avec succès !");

    async function execCommand(command) {
        console.log(`Exécution : ${command}`);
        const result = await ssh.execCommand(command);
        if (result.stdout) console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
        return result;
    }

    try {
        console.log("=== Installation de Supabase via wget ===");
        await execCommand('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wget unzip');
        
        await execCommand('rm -rf supabase supabase.zip supabase-master');
        await execCommand('wget -qO supabase.zip https://github.com/supabase/supabase/archive/refs/heads/master.zip');
        await execCommand('unzip -q supabase.zip');
        await execCommand('mv supabase-master supabase');
        
        await execCommand('cd supabase/docker && cp .env.example .env');

        await execCommand(`cd supabase/docker && ${setEnvLine('POSTGRES_PASSWORD', requireEnv('SUPABASE_POSTGRES_PASSWORD'))}`);
        
        console.log("Pulling des images Docker...");
        await execCommand('cd supabase/docker && docker compose pull');
        
        console.log("Démarrage des containers Supabase...");
        await execCommand('cd supabase/docker && docker compose up -d');

        console.log("Phase 3 terminée.");

    } catch (err) {
        console.error("Erreur :", err);
    } finally {
        ssh.dispose();
    }
}

main();
