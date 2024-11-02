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
    const res = await client.query('SELECT * FROM empresa');
    await client.end();
    console.log("empresas", res?.rows)
    return res.rows;
  } catch (error) {
    console.log('error', error);
    return [];
  } finally {
    await client.end();
  }
}

function createEnvFile(empresa) {
  const envContent = `
    POSTGRES_USER=${empresa.db_name}_user
    POSTGRES_PASSWORD=${empresa.db_name}_pass
    POSTGRES_DB=db_${empresa.db_name}
    VIRTUAL_HOST=${empresa.db_name}.whatsproy.com
    POSTGRES_USER_GLOBAL=${process.env.POSTGRES_USER_GLOBAL}
    POSTGRES_PASSWORD_GLOBAL=${process.env.POSTGRES_PASSWORD_GLOBAL}
    POSTGRES_DB_GLOBAL=${process.env.POSTGRES_DB_GLOBAL}
    POSTGRES_GLOBAL_DB_HOST=${process.env.POSTGRES_GLOBAL_DB_HOST}
    POSTGRES_GLOBAL_DB_PORT=${process.env.POSTGRES_GLOBAL_DB_PORT}
    ID_INSTANCE=${empresa?.greenApiInstance}
    API_TOKEN_INSTANCE=${empresa?.greenApiInstanceToken}
    OPEN_AI_TOKEN=${process.env.OPEN_AI_TOKEN}
    ENV=qa
    DOCKER_BUILDKIT=1
    SUBDOMAIN=${empresa.db_name}
  `;

  console.log("xd1", envContent)
  fs.writeFileSync(`.env.${empresa.db_name}`, envContent);
}

function createEnvFileApp() {
  const envContent = `
      POSTGRES_USER=${process.env.POSTGRES_USER_GLOBAL}
      POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD_GLOBAL}
      POSTGRES_DB=${process.env.POSTGRES_DB_GLOBAL}
      VIRTUAL_HOST=app.whatsproy.com
      POSTGRES_USER_GLOBAL=${process.env.POSTGRES_USER_GLOBAL}
      POSTGRES_PASSWORD_GLOBAL=${process.env.POSTGRES_PASSWORD_GLOBAL}
      POSTGRES_DB_GLOBAL=${process.env.POSTGRES_DB_GLOBAL}
      POSTGRES_GLOBAL_DB_HOST=${process.env.POSTGRES_GLOBAL_DB_HOST}
      POSTGRES_GLOBAL_DB_PORT=${process.env.POSTGRES_GLOBAL_DB_PORT}
      ENV=qa
      DOCKER_BUILDKIT=1
      SUBDOMAIN=app
    `;
  fs.writeFileSync(`.env.app`, envContent);
}

async function deployCompany(empresa) {
  const dropletIp = process.env.DROPLET_IP;
  createEnvFile(empresa);

  require('dotenv').config({ path: `.env.${empresa.db_name}` });

  await execSync(
    `ssh -i private_key -o StrictHostKeyChecking=no root@${dropletIp} 'mkdir -p /projects/${empresa?.db_name}'`,
  );
  await execSync(
    `scp -i private_key -o StrictHostKeyChecking=no -r .env.${empresa.db_name} root@${dropletIp}:/projects/${empresa?.db_name}/.env`,
  );
  await execSync(
    `rsync -avz -e "ssh -i private_key -o StrictHostKeyChecking=no" --exclude='node_modules' ./ root@${dropletIp}:/projects/${empresa?.db_name}/`,
  );
  await execSync(
    `ssh -i private_key root@${dropletIp} 'cd /projects/${empresa?.db_name} && docker-compose -f docker-compose.yml up -d --build'`,
  );
}

async function deployApp() {
  const dropletIp = process.env.DROPLET_IP;
  createEnvFileApp();
  require('dotenv').config({ path: `.env.app` });

  await execSync(
    `ssh -i private_key -o StrictHostKeyChecking=no root@${dropletIp} 'mkdir -p /projects/app'`,
  );
  await execSync(
    `scp -i private_key -o StrictHostKeyChecking=no -r .env.app root@${dropletIp}:/projects/app/.env`,
  );
  await execSync(
    `rsync -avz -e "ssh -i private_key -o StrictHostKeyChecking=no" --exclude='node_modules' ./ root@${dropletIp}:/projects/app/`,
  );
  await execSync(
    `ssh -i private_key root@${dropletIp} 'cd /projects/app && docker-compose -f docker-compose-app.yml up -d --build'`,
  );
}


(async () => {
  try {
    await deployApp();
    const empresas = await getCompanies();
    for (const empresa of empresas) {
    await deployCompany(empresa);
  }
  } catch (error) {
    console.log("error", error)
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
