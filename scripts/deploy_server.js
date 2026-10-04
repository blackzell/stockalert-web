const { NodeSSH } = require('node-ssh');
const { sshConfig } = require('./lib/env');
const ssh = new NodeSSH();

async function main() {
    console.log("Connexion au serveur...");
    try {
        await ssh.connect(sshConfig('ROOT', { readyTimeout: 60000 }));
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

        console.log("=== Mise à jour du système ===");
        await execCommand('export DEBIAN_FRONTEND=noninteractive && apt-get update');
        await execCommand('export DEBIAN_FRONTEND=noninteractive && apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade');
        
        console.log("=== Installation de curl, git, unzip ===");
        await execCommand('export DEBIAN_FRONTEND=noninteractive && apt-get install -y curl git unzip');

        console.log("=== Installation de Node.js v20 ===");
        await execCommand('curl -fsSL https://deb.nodesource.com/setup_20.x | bash -');
        await execCommand('export DEBIAN_FRONTEND=noninteractive && apt-get install -y nodejs');
        
        console.log("=== Installation de PM2 ===");
        await execCommand('npm install -g pm2');
        
        console.log("=== Installation de Nginx ===");
        await execCommand('export DEBIAN_FRONTEND=noninteractive && apt-get install -y nginx');

        console.log("=== Installation de Docker & Docker Compose ===");
        await execCommand('install -m 0755 -d /etc/apt/keyrings');
        await execCommand('curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc');
        await execCommand('chmod a+r /etc/apt/keyrings/docker.asc');
        await execCommand('echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \\"$VERSION_CODENAME\\") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null');
        await execCommand('export DEBIAN_FRONTEND=noninteractive && apt-get update');
        await execCommand('export DEBIAN_FRONTEND=noninteractive && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-compose');
        
        console.log("\nPhase 2 (Prérequis) terminée !");

    } catch (err) {
        console.error("\nErreur SSH:", err);
    } finally {
        ssh.dispose();
    }
}

main();
