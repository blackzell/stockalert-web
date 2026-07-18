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

        console.log("=== Fix DNS ===");
        await execCommand('echo "140.82.113.4 github.com" >> /etc/hosts');

        console.log("=== Installation de Supabase sur le nouveau serveur ===");
        await execCommand('rm -rf supabase');
        await execCommand('git clone --depth 1 https://github.com/supabase/supabase.git');
        
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
