const { Client } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');

const dbNameArg = process.argv[2];

console.log('deployando con ', dbNameArg);

if (!dbNameArg) {
  console.error(
    'Falta el parámetro db_name. Uso: node deploySingleCompany.js <db_name>',
  );
  process.exit(1);
}

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

async function getEmpresaByDbName(dbName) {
  try {
    await client.connect();
    const res = await client.query(
      'SELECT * FROM empresa WHERE db_name = $1 LIMIT 1',
      [dbName],
    );
    await client.end();
    return res.rows[0] || null;
  } catch (error) {
    console.error('Error al obtener la empresa:', error);
    return null;
  } finally {
    await client.end();
  }
}

function createEnvFile(empresa) {
  const envContent = `
POSTGRES_USER=${process.env.POSTGRES_USER_GLOBAL}
POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD_GLOBAL}
POSTGRES_DB=db_${empresa.db_name}
VIRTUAL_HOST=${empresa.db_name}.measyapp.com
POSTGRES_USER_GLOBAL=${process.env.POSTGRES_USER_GLOBAL}
POSTGRES_PASSWORD_GLOBAL=${process.env.POSTGRES_PASSWORD_GLOBAL}
POSTGRES_DB_GLOBAL=${process.env.POSTGRES_DB_GLOBAL}
POSTGRES_GLOBAL_DB_HOST=${process.env.POSTGRES_GLOBAL_DB_HOST}
POSTGRES_GLOBAL_DB_PORT=${process.env.POSTGRES_GLOBAL_DB_PORT}
ID_INSTANCE=${empresa?.greenApiInstance}
FIREBASE_PROJECT_ID=${process.env.FIREBASE_PROJECT_ID}
FIREBASE_PRIVATE_KEY=${process.env.FIREBASE_PRIVATE_KEY}
FIREBASE_CLIENT_EMAIL=${process.env.FIREBASE_CLIENT_EMAIL}
REDIS_HOST=${process.env.REDIS_HOST}
REDIS_PORT=${process.env.REDIS_PORT}
REDIS_PASSWORD=${process.env.REDIS_PASSWORD}
API_TOKEN_INSTANCE=${empresa?.greenApiInstanceToken}
OPEN_AI_TOKEN=${process.env.OPEN_AI_TOKEN}
JWT_SECRET_KEY=${process.env.JWT_SECRET_KEY}
ASSISTANT_ID=${process.env.ASSISTANT_ID}
ENV=prod
DOCKER_BUILDKIT=1
SUBDOMAIN=${empresa.db_name}
RESEND_KEY=${process.env.RESEND_KEY}
DEEPSEEK_TOKEN=${process.env.DEEPSEEK_TOKEN}
`;

  fs.writeFileSync(`.env.${empresa.db_name}`, envContent);
}

async function deployCompany(empresa) {
  const dropletIp = process.env.DROPLET_IP;
  createEnvFile(empresa);

  const envFileContent = fs.readFileSync(`.env.${empresa.db_name}`, 'utf8');
  console.log(`Contenido de .env.${empresa.db_name}:`, envFileContent);

  require('dotenv').config({ path: `.env.${empresa.db_name}` });

  await execSync(
    `ssh -i private_key -o StrictHostKeyChecking=no root@${dropletIp} 'mkdir -p /projects/${empresa.db_name}'`,
  );

  await execSync(
    `rsync -avz --delete -e "ssh -i private_key -o StrictHostKeyChecking=no" --exclude='node_modules' --exclude='letsencrypt' ./ root@${dropletIp}:/projects/${empresa.db_name}/`,
  );
  await execSync(
    `ssh -i private_key -o StrictHostKeyChecking=no root@${dropletIp} 'rm -f /projects/${empresa.db_name}/.env'`,
  );
  await execSync(
    `scp -i private_key -o StrictHostKeyChecking=no -r .env.${empresa.db_name} root@${dropletIp}:/projects/${empresa.db_name}/.env`,
  );

  await execSync(
    `ssh -i private_key root@${dropletIp} 'cd /projects/${empresa.db_name} && docker compose -f docker-compose.yml up -d --build  --remove-orphans'`,
  );
}

(async () => {
  try {
    const empresa = await getEmpresaByDbName(dbNameArg);
    if (!empresa) {
      console.error(`No se encontró una empresa con db_name = "${dbNameArg}"`);
      process.exit(1);
    }

    await deployCompany(empresa);
  } catch (error) {
    console.error('Error durante el despliegue:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
