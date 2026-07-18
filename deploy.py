import paramiko
import time
import sys

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
    host = '102.220.17.198'
    username = 'ubuntu'
    password = '5eb62Keby9'
    
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
