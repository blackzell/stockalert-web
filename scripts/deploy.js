const { NodeSSH } = require('node-ssh');
const { sshConfig } = require('./lib/env');
const ssh = new NodeSSH();

async function main() {
    console.log("Connexion au serveur...");
    await ssh.connect(sshConfig('UBUNTU'));
    console.log("Connecté avec succès !");

    // Helper pour exécuter une commande
    async function execCommand(command) {
        console.log(`Exécution : ${command}`);
        const result = await ssh.execCommand(command);
        if (result.stdout) console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
        return result;
    }

    try {
        // Phase 2 : Préparation du Serveur Ubuntu & Docker
        console.log("=== Mise à jour du système et installation des prérequis ===");
        await execCommand('sudo DEBIAN_FRONTEND=noninteractive apt-get update');
        await execCommand('sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y');
        
        console.log("=== Installation de Node.js v20 ===");
        await execCommand('curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -');
        await execCommand('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs nginx');

        console.log("=== Installation de PM2 ===");
        await execCommand('sudo npm install -g pm2');

        console.log("=== Installation de Docker et Docker Compose ===");
        await execCommand('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg');
        await execCommand('sudo install -m 0755 -d /etc/apt/keyrings');
        await execCommand('curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null');
        await execCommand('sudo chmod a+r /etc/apt/keyrings/docker.asc');
        await execCommand('echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null');
        await execCommand('sudo DEBIAN_FRONTEND=noninteractive apt-get update');
        await execCommand('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-compose');
        
        // Ajouter ubuntu au groupe docker pour éviter sudo
        await execCommand('sudo usermod -aG docker ubuntu');

        console.log("Phase 2 terminée.");
    } catch (err) {
        console.error("Erreur lors du déploiement :", err);
    } finally {
        ssh.dispose();
    }
}

main();
