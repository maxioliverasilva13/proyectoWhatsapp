const { Client } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');

// Configuración de la base de datos global
const client = new Client({
  user: process.env.POSTGRES_USER_GLOBAL,
  host: process.env.POSTGRES_GLOBAL_DB_HOST,
  database: process.env.POSTGRES_DB_GLOBAL,
  password: process.env.POSTGRES_PASSWORD_GLOBAL,
  port: process.env.POSTGRES_GLOBAL_DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getCompanies() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM empresa where deploy=True');
    await client.end();
    return res.rows;
  } catch (error) {
    console.log('error', error);
    return [];
  } finally {
    await client.end();
  }
}

function createEnvFileApp() {
  const envContent = `
      POSTGRES_USER=${process.env.POSTGRES_USER_GLOBAL}
      POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD_GLOBAL}
      POSTGRES_DB=${process.env.POSTGRES_DB_GLOBAL}
      VIRTUAL_HOST=app.measyapp.com
      EMAIL_USER=${process.env.EMAIL_USER}
      SUPABASE_URL=${process.env.SUPABASE_URL}
      FIREBASE_PROJECT_ID=${process.env.FIREBASE_PROJECT_ID}
      FIREBASE_PRIVATE_KEY=${process.env.FIREBASE_PRIVATE_KEY}
      FIREBASE_CLIENT_EMAIL=${process.env.FIREBASE_CLIENT_EMAIL}
      SUPABASE_KEY=${process.env.SUPABASE_KEY}
      SUPABASE_BUCKET=${process.env.SUPABASE_BUCKET}
      EMAIL_HOST=${process.env.EMAIL_HOST}
      TOKEN_CONNECT_GIT=${process.env.TOKEN_CONNECT_GIT}
      EMAIL_PORT=${process.env.EMAIL_PORT}
      OPEN_AI_TOKEN=${process.env.OPEN_AI_TOKEN}
      EMAIL_PASS=${process.env.EMAIL_PASS}
      REDIS_HOST=${process.env.REDIS_HOST}
      REDIS_PORT=${process.env.REDIS_PORT}
      REDIS_PASSWORD=${process.env.REDIS_PASSWORD}
      GOOGLE_CLIENT_EMAIL=${process.env.GOOGLE_CLIENT_EMAIL}
      RESEND_KEY=${process.env.RESEND_KEY}
      GOOGLE_PRIVATE_KEY=${process.env.GOOGLE_PRIVATE_KEY}
      POSTGRES_USER_GLOBAL=${process.env.POSTGRES_USER_GLOBAL}
      POSTGRES_PASSWORD_GLOBAL=${process.env.POSTGRES_PASSWORD_GLOBAL}
      POSTGRES_DB_GLOBAL=${process.env.POSTGRES_DB_GLOBAL}
      POSTGRES_GLOBAL_DB_HOST=${process.env.POSTGRES_GLOBAL_DB_HOST}
      POSTGRES_GLOBAL_DB_PORT=${process.env.POSTGRES_GLOBAL_DB_PORT}
      JWT_SECRET_KEY=${process.env.JWT_SECRET_KEY}
      SSH_PRIVATE_KEY=${process.env.SSH_PRIVATE_KEY}
      DROPLET_IP=${process.env.DROPLET_IP}
      DROPLET_USER=${process.env.DROPLET_USER}
      DEEPSEEK_TOKEN=${process.env.DEEPSEEK_TOKEN}
      ENV=prod
      DOCKER_BUILDKIT=1
      SUBDOMAIN=app
    `;
  console.log('.env.app', envContent);
  fs.writeFileSync(`.env.app`, envContent);
}

async function deployApp() {
  const dropletIp = process.env.DROPLET_IP;
  createEnvFileApp();
  require('dotenv').config({ path: `.env.app` });

  await execSync(
    `ssh -i private_key -o StrictHostKeyChecking=no root@${dropletIp} 'mkdir -p /projects/app'`,
  );
  await execSync(
    `rsync --delete -avz -e "ssh -i private_key -o StrictHostKeyChecking=no" --exclude='node_modules' --exclude='letsencrypt' ./ root@${dropletIp}:/projects/app/`,
  );
  await execSync(
    `ssh -i private_key -o StrictHostKeyChecking=no root@${dropletIp} 'rm -f /projects/app/.env'`,
  );
  await execSync(
    `scp -i private_key -o StrictHostKeyChecking=no -r .env.app root@${dropletIp}:/projects/app/.env`,
  );
  await execSync(
    `ssh -i private_key -o StrictHostKeyChecking=no root@${dropletIp} 'mkdir -p /projects/app/letsencrypt && [ ! -f /projects/app/letsencrypt/acme.json ] && touch /projects/app/letsencrypt/acme.json && chmod 600 /projects/app/letsencrypt/acme.json || echo "acme.json ya existe"'`,
  );
  await execSync(
    `ssh -i private_key root@${dropletIp} 'cd /projects/app && docker-compose -f docker-compose-app-prod.yml up -d --build --force-recreate'`,
  );
}

(async () => {
  try {
    await deployApp();
  } catch (error) {
    console.log('error', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
