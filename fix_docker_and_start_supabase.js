const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function main() {
    console.log("Connexion au serveur...");
    try {
        await ssh.connect({
            host: '102.208.105.133',
            username: 'root',
            password: '%@R@4QS&Y9B%',
            readyTimeout: 60000
        });
        console.log("Connecté avec succès !");

        async function execCommand(command) {
            console.log(`\n>>> Exécution : ${command}`);
            const result = await ssh.execCommand(command, {
                onStdout(chunk) {
                    process.stdout.write(chunk.toString('utf8'));
                },
                onStderr(chunk) {
                    process.stderr.write(chunk.toString('utf8'));
                }
            });
            return result;
        }

        console.log("=== Correction de l'erreur dpkg Docker ===");
        // Fix broken packages
        await execCommand('export DEBIAN_FRONTEND=noninteractive && apt-get --fix-broken install -y -o Dpkg::Options::="--force-overwrite"');
        
        // Remove the conflicting Ubuntu package if installed, but keep docker-compose-plugin
        await execCommand('export DEBIAN_FRONTEND=noninteractive && apt-get remove -y docker-compose-v2 docker-compose');
        
        console.log("=== Upload de Supabase (configuration Docker) ===");
        await ssh.putFile('supabase_docker.zip', 'supabase_docker.zip');

        console.log("=== Démarrage de Supabase ===");
        await execCommand('rm -rf supabase');
        await execCommand('mkdir -p supabase');
        await execCommand('unzip -q supabase_docker.zip -d supabase');
        // Because the zip contains a "docker" folder at its root, unzipping into supabase results in supabase/docker
        
        await execCommand('cd supabase/docker && cp .env.example .env');

        const pgPass = "StockAlertDBPass2026";
        await execCommand(`cd supabase/docker && sed -i 's/POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password/POSTGRES_PASSWORD=${pgPass}/g' .env`);
        
        console.log("Pulling des images Docker Supabase...");
        await execCommand('cd supabase/docker && docker compose pull');
        
        console.log("Démarrage des containers Supabase...");
        await execCommand('cd supabase/docker && docker compose up -d');

        console.log("\nPhase 2 & Supabase terminées !");

    } catch (err) {
        console.error("\nErreur SSH:", err);
    } finally {
        ssh.dispose();
    }
}

main();
