import os
import sys
from pathlib import Path

import paramiko


def load_env():
    # Charge le .env à la racine du projet (ignoré par git, voir .env.example)
    env_file = Path(__file__).resolve().parent.parent / '.env'
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def require_env(name):
    value = os.environ.get(name)
    if not value:
        sys.exit(f"Variable manquante : {name}. Renseigne-la dans .env (voir .env.example).")
    return value

def run_command(ssh, command):
    print(f"Exécution: {command}", flush=True)
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out, flush=True)
    if err:
        print(f"Erreur/Warning: {err}", flush=True)
    return exit_status

def main():
    load_env()
    host = require_env('UBUNTU_SSH_HOST')
    username = require_env('UBUNTU_SSH_USER')
    password = require_env('UBUNTU_SSH_PASSWORD')
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connexion à {host}...", flush=True)
    try:
        ssh.connect(host, username=username, password=password, timeout=10, auth_timeout=10)
        print("Connecté avec succès!", flush=True)
        
        run_command(ssh, 'echo "Test SSH works!"')
        
    except Exception as e:
        print(f"Erreur de connexion: {e}", flush=True)
    finally:
        ssh.close()

if __name__ == '__main__':
    main()
