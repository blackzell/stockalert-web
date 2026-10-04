const { NodeSSH } = require('node-ssh');
const { sshConfig } = require('./lib/env');
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

        // Step 1: Diagnose network
        console.log("=== Diagnostic réseau ===");
        await exec('curl -sI https://auth.docker.io/ 2>&1 | head -5');
        await exec('curl -sI https://registry-1.docker.io/ 2>&1 | head -5');
        await exec('nslookup auth.docker.io 2>&1 | tail -5');
        await exec('nslookup registry-1.docker.io 2>&1 | tail -5');
        
        // Step 2: Try to fix DNS - use Google DNS
        console.log("\n=== Configuration DNS (Google 8.8.8.8) ===");
        await exec('echo "nameserver 8.8.8.8" > /etc/resolv.conf');
        await exec('echo "nameserver 8.8.4.4" >> /etc/resolv.conf');
        
        // Step 3: Add Docker Hub IPs to /etc/hosts
        console.log("\n=== Ajout des IPs Docker Hub ===");
        await exec('nslookup auth.docker.io 8.8.8.8 2>&1');
        await exec('nslookup registry-1.docker.io 8.8.8.8 2>&1');
        await exec('nslookup production.cloudflare.docker.com 8.8.8.8 2>&1');

        // Step 4: Test again
        console.log("\n=== Re-test de connectivité Docker Hub ===");
        await exec('curl -sI -m 10 https://auth.docker.io/ 2>&1 | head -5');
        
        // Step 5: Retry docker compose pull
        console.log("\n=== Retry: Pull des images Docker ===");
        await exec('cd /root/supabase/docker && docker compose pull 2>&1');
        
        // Step 6: If still failing, try with mirror
        console.log("\n=== Vérification ===");
        await exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -25');

    } catch (err) {
        console.error("\nErreur SSH:", err);
    } finally {
        ssh.dispose();
    }
}

main();
