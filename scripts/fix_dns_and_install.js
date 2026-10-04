const { NodeSSH } = require('node-ssh');
const { sshConfig, requireEnv, setEnvLine } = require('./lib/env');
const ssh = new NodeSSH();

async function main() {
    console.log("Connexion au serveur...");
    await ssh.connect(sshConfig('UBUNTU', { readyTimeout: 60000 }));
    console.log("Connecté avec succès !");

    async function execCommand(command) {
        console.log(`Exécution : ${command}`);
        const result = await ssh.execCommand(command);
        if (result.stdout) console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
        return result;
    }

    try {
        console.log("=== Correction DNS pour github.com ===");
        // Add GitHub IP to /etc/hosts to bypass DNS resolution issues
        await execCommand('echo "140.82.113.4 github.com" | sudo tee -a /etc/hosts');
        
        console.log("=== Installation de Supabase ===");
        await execCommand('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git');
        
        await execCommand('rm -rf supabase');
        await execCommand('git clone --depth 1 https://github.com/supabase/supabase.git');
        
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
