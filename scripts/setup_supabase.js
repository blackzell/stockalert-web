const { NodeSSH } = require('node-ssh');
const { sshConfig, requireEnv, setEnvLine } = require('./lib/env');
const ssh = new NodeSSH();

async function main() {
    console.log("Connexion au serveur...");
    try {
        await ssh.connect(sshConfig('ROOT', { readyTimeout: 60000 }));
        console.log("Connecté avec succès !");

        async function exec(command) {
            console.log(`\n>>> ${command}`);
            const result = await ssh.execCommand(command, {
                onStdout(chunk) { process.stdout.write(chunk.toString('utf8')); },
                onStderr(chunk) { process.stderr.write(chunk.toString('utf8')); }
            });
            return result;
        }

        // Step 1: Check connectivity 
        console.log("=== Test de connectivité ===");
        await exec('curl -sL -o /dev/null -w "%{http_code}" https://raw.githubusercontent.com/supabase/supabase/master/docker/.env.example');

        // Step 2: Prepare directories
        console.log("\n=== Préparation des répertoires ===");
        await exec('rm -rf /root/supabase');
        await exec('mkdir -p /root/supabase/docker/volumes/api');
        await exec('mkdir -p /root/supabase/docker/volumes/db/{init,realtime,logs}');
        await exec('mkdir -p /root/supabase/docker/volumes/functions/hello');
        await exec('mkdir -p /root/supabase/docker/volumes/logs');
        await exec('mkdir -p /root/supabase/docker/volumes/storage');
        await exec('mkdir -p /root/supabase/docker/dev');

        // Step 3: Download all needed files from raw.githubusercontent.com
        console.log("\n=== Téléchargement des fichiers Supabase ===");
        const BASE = 'https://raw.githubusercontent.com/supabase/supabase/master/docker';
        const files = [
            '.env.example',
            'docker-compose.yml',
            'volumes/api/kong.yml',
            'volumes/db/webhooks.sql',
            'volumes/db/roles.sql',
            'volumes/db/jwt.sql',
            'volumes/db/init/data.sql',
            'volumes/db/logs.sql',
            'volumes/db/realtime.sql',
            'volumes/db/realtime/migration.sql',
            'volumes/db/logs/migration.sql',
            'volumes/functions/hello/index.ts',
            'volumes/logs/vector.yml',
            'volumes/storage/s3.sql'
        ];

        for (const f of files) {
            const res = await exec(`curl -sfL -o /root/supabase/docker/${f} --create-dirs ${BASE}/${f}`);
            if (res.code !== 0) {
                console.log(`  [WARN] Fichier optionnel manquant: ${f}`);
            }
        }

        // Step 4: Configure .env
        console.log("\n=== Configuration du .env ===");
        await exec('cd /root/supabase/docker && cp .env.example .env');
        
        // Secrets lus depuis .env (jamais en dur)
        const envDir = 'cd /root/supabase/docker';
        await exec(`${envDir} && ${setEnvLine('POSTGRES_PASSWORD', requireEnv('SUPABASE_POSTGRES_PASSWORD'))}`);
        await exec(`${envDir} && ${setEnvLine('JWT_SECRET', requireEnv('SUPABASE_JWT_SECRET'))}`);
        await exec(`${envDir} && ${setEnvLine('DASHBOARD_PASSWORD', requireEnv('SUPABASE_DASHBOARD_PASSWORD'))}`);

        // URL publique = IP du serveur
        const publicUrl = `http://${requireEnv('ROOT_SSH_HOST')}:8000`;
        await exec(`${envDir} && ${setEnvLine('SUPABASE_PUBLIC_URL', publicUrl)}`);
        await exec(`${envDir} && ${setEnvLine('API_EXTERNAL_URL', `${publicUrl}/auth/v1`)}`);

        // Step 5: Pull & Start Supabase
        console.log("\n=== Pull des images Docker Supabase ===");
        await exec('cd /root/supabase/docker && docker compose pull');
        
        console.log("\n=== Démarrage des containers ===");
        await exec('cd /root/supabase/docker && docker compose up -d');

        // Step 6: Verify
        console.log("\n=== Vérification ===");
        await exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20');

        console.log("\n\n✅ Supabase installé et démarré avec succès !");

    } catch (err) {
        console.error("\nErreur SSH:", err);
    } finally {
        ssh.dispose();
    }
}

main();
