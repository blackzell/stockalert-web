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
        console.log("Upload du fichier supabase_docker.zip (très léger)...");
        await ssh.putFile('supabase_docker.zip', 'supabase_docker.zip');
        console.log("Upload terminé !");

        await execCommand('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip');
        await execCommand('rm -rf supabase');
        await execCommand('mkdir -p supabase');
        await execCommand('unzip -q supabase_docker.zip -d supabase');
        // Because the zip contains a "docker" folder at its root, unzipping into supabase results in supabase/docker
        
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
