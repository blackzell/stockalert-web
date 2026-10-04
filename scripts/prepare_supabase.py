import urllib.request
import zipfile
import shutil
import os

print("Téléchargement de supabase.zip...")
urllib.request.urlretrieve("https://github.com/supabase/supabase/archive/refs/heads/master.zip", "supabase3.zip")

print("Extraction ciblée du dossier docker...")
with zipfile.ZipFile("supabase3.zip", 'r') as zip_ref:
    for file in zip_ref.namelist():
        if file.startswith("supabase-master/docker/"):
            zip_ref.extract(file, ".")

print("Compression du dossier docker...")
shutil.make_archive("supabase_docker", "zip", "supabase-master/docker")

print("Terminé ! Le fichier supabase_docker.zip est prêt.")
