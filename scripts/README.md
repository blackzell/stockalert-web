# Scripts de déploiement

Scripts ponctuels qui se connectent en SSH aux serveurs pour installer Node, PM2, Nginx, Docker et Supabase auto-hébergé.

Les accès et secrets ne sont **jamais** écrits dans les scripts : ils sont lus depuis le fichier `.env` à la racine du projet (ignoré par git).

```bash
cp .env.example .env   # puis remplis les valeurs
node scripts/deploy.js
```

`scripts/lib/env.js` charge `.env`, construit la config SSH (clé SSH si `*_SSH_KEY_PATH` est défini, sinon mot de passe) et échappe les secrets injectés dans le `.env` Supabase distant.
