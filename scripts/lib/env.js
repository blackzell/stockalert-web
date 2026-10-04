// Charge le fichier .env à la racine du projet et expose les accès SSH / secrets
// utilisés par les scripts de déploiement. Aucun secret ne doit être écrit en dur
// dans les scripts : tout passe par .env (ignoré par git), voir .env.example.
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
}

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`Variable manquante : ${name}. Renseigne-la dans .env (voir .env.example).`);
        process.exit(1);
    }
    return value;
}

// server : "UBUNTU" (serveur 1, utilisateur ubuntu) ou "ROOT" (serveur 2, utilisateur root).
// Utilise une clé SSH si <SERVER>_SSH_KEY_PATH est défini, sinon le mot de passe.
function sshConfig(server, extra = {}) {
    const prefix = `${server}_SSH`;
    const config = {
        host: requireEnv(`${prefix}_HOST`),
        username: requireEnv(`${prefix}_USER`),
        ...extra,
    };
    const keyPath = process.env[`${prefix}_KEY_PATH`];
    if (keyPath) {
        config.privateKeyPath = keyPath;
    } else {
        config.password = requireEnv(`${prefix}_PASSWORD`);
    }
    return config;
}

// Entoure une chaîne de quotes simples pour le shell distant.
function shQuote(value) {
    return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

// Commande sed qui remplace la ligne KEY=... d'un fichier .env distant,
// en échappant la valeur (les secrets peuvent contenir & / | ! etc.).
function setEnvLine(key, value) {
    if (/[\n\r]/.test(value)) throw new Error(`Valeur multi-ligne refusée pour ${key}`);
    const escaped = String(value).replace(/[\\|&]/g, '\\$&');
    return `sed -i ${shQuote(`s|^${key}=.*|${key}=${escaped}|`)} .env`;
}

module.exports = { requireEnv, sshConfig, shQuote, setEnvLine };
