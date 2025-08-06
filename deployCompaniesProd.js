const { Client } = require('pg');
const { execSync, spawn } = require('child_process');
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

const escapeEnvValue = (val) => val;

// Clase para manejar conexión SSH persistente
class SSHConnection {
  constructor(host, privateKeyPath) {
    this.host = host;
    this.privateKeyPath = privateKeyPath;
    this.sshProcess = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.sshProcess = spawn('ssh', [
        '-i', this.privateKeyPath,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ServerAliveInterval=30',
        '-o', 'ServerAliveCountMax=3',
        `root@${this.host}`
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.sshProcess.on('error', reject);
      
      // Esperar a que la conexión esté lista
      setTimeout(() => {
        if (this.sshProcess && !this.sshProcess.killed) {
          resolve();
        } else {
          reject(new Error('Failed to establish SSH connection'));
        }
      }, 2000);
    });
  }

  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.sshProcess || this.sshProcess.killed) {
        reject(new Error('SSH connection not established'));
        return;
      }

      let output = '';
      let errorOutput = '';

      const dataHandler = (data) => {
        output += data.toString();
      };

      const errorHandler = (data) => {
        errorOutput += data.toString();
      };

      this.sshProcess.stdout.on('data', dataHandler);
      this.sshProcess.stderr.on('data', errorHandler);

      // Enviar comando
      this.sshProcess.stdin.write(`${command} && echo "COMMAND_FINISHED_SUCCESS" || echo "COMMAND_FINISHED_ERROR"\n`);

      // Esperar respuesta
      const checkForCompletion = () => {
        if (output.includes('COMMAND_FINISHED_SUCCESS')) {
          this.sshProcess.stdout.off('data', dataHandler);
          this.sshProcess.stderr.off('data', errorHandler);
          resolve(output.replace('COMMAND_FINISHED_SUCCESS', '').trim());
        } else if (output.includes('COMMAND_FINISHED_ERROR')) {
          this.sshProcess.stdout.off('data', dataHandler);
          this.sshProcess.stderr.off('data', errorHandler);
          reject(new Error(`Command failed: ${errorOutput}`));
        } else {
          setTimeout(checkForCompletion, 100);
        }
      };

      setTimeout(checkForCompletion, 100);
    });
  }

  async disconnect() {
    if (this.sshProcess && !this.sshProcess.killed) {
      this.sshProcess.stdin.write('exit\n');
      this.sshProcess.kill();
    }
  }
}

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
    FIREBASE_PRIVATE_KEY=${escapeEnvValue(process.env.FIREBASE_PRIVATE_KEY)}
    FIREBASE_CLIENT_EMAIL=${process.env.FIREBASE_CLIENT_EMAIL}
    REDIS_HOST=${process.env.REDIS_HOST}
    REDIS_PORT=${process.env.REDIS_PORT}
    REDIS_PASSWORD=${process.env.REDIS_PASSWORD}
    API_TOKEN_INSTANCE=${empresa?.greenApiInstanceToken}
    OPEN_AI_TOKEN=${process.env.OPEN_AI_TOKEN}
    JWT_SECRET_KEY=${process.env.JWT_SECRET_KEY}
    ASSISTANT_ID=${process.env.ASSISTANT_ID}
    DEEPSEEK_TOKEN=${process.env.DEEPSEEK_TOKEN}
    ENV=prod
    DOCKER_BUILDKIT=1
    SUBDOMAIN=${empresa.db_name}
  `;

  fs.writeFileSync(`.env.${empresa.db_name}`, envContent);
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
      FIREBASE_PRIVATE_KEY=${escapeEnvValue(process.env.FIREBASE_PRIVATE_KEY)}
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

async function deployCompany(empresa, sshConnection) {
  const dropletIp = process.env.DROPLET_IP;
  createEnvFile(empresa);

  const envFileContent = fs.readFileSync(`.env.${empresa.db_name}`, 'utf8');
  console.log(`Contenido de .env.${empresa.db_name}:`, envFileContent);

  require('dotenv').config({ path: `.env.${empresa.db_name}` });

  console.log(`Preparando directorios para ${empresa.db_name}...`);
  await sshConnection.executeCommand(`
    mkdir -p /projects/${empresa?.db_name} &&
    rm -f /projects/${empresa?.db_name}/.env
  `);
  
  console.log(`Sincronizando archivos para ${empresa.db_name}...`);
  await execSync(
    `rsync -avz --delete -e "ssh -i private_key -o StrictHostKeyChecking=no" --exclude='node_modules' --exclude='letsencrypt' ./ root@${dropletIp}:/projects/${empresa?.db_name}/`,
  );
  
  console.log(`Copiando .env para ${empresa.db_name}...`);
  await execSync(
    `scp -i private_key -o StrictHostKeyChecking=no -r .env.${empresa.db_name} root@${dropletIp}:/projects/${empresa?.db_name}/.env`,
  );
  
  console.log(`Ejecutando docker compose para ${empresa.db_name}...`);
  await sshConnection.executeCommand(`
    cd /projects/${empresa?.db_name} &&
    docker compose -f docker-compose.yml up -d --build --remove-orphans
  `);
  
  console.log(`✅ Deploy completado para ${empresa.db_name}`);
}

async function deployApp(sshConnection) {
  const dropletIp = process.env.DROPLET_IP;
  createEnvFileApp();
  require('dotenv').config({ path: `.env.app` });

  console.log('Preparando directorios para app principal...');
  await sshConnection.executeCommand(`
    mkdir -p /projects/app &&
    rm -f /projects/app/.env &&
    mkdir -p /projects/app/letsencrypt &&
    touch /projects/app/letsencrypt/acme.json &&
    chmod 600 /projects/app/letsencrypt/acme.json
  `);
  
  console.log('Sincronizando archivos para app principal...');
  await execSync(
    `rsync --delete -avz -e "ssh -i private_key -o StrictHostKeyChecking=no" --exclude='node_modules' --exclude='letsencrypt' ./ root@${dropletIp}:/projects/app/`,
  );
  
  console.log('Copiando .env para app principal...');
  await execSync(
    `scp -i private_key -o StrictHostKeyChecking=no -r .env.app root@${dropletIp}:/projects/app/.env`,
  );
  
  console.log('Ejecutando docker compose para app principal...');
  await sshConnection.executeCommand(`
    cd /projects/app &&
    docker compose -f docker-compose-app-prod.yml up -d --build
  `);
  
  console.log('✅ Deploy completado para app principal');
}

(async () => {
  const dropletIp = process.env.DROPLET_IP;
  const sshConnection = new SSHConnection(dropletIp, 'private_key');
  
  try {
    console.log('🔌 Estableciendo conexión SSH persistente...');
    await sshConnection.connect();
    console.log('✅ Conexión SSH establecida');
    
    console.log('🚀 Iniciando deploy de app principal...');
    await deployApp(sshConnection);
    
    console.log('📋 Obteniendo lista de empresas...');
    const empresas = await getCompanies();
    console.log(`Found ${empresas.length} empresas para deploy`);
    
    for (let i = 0; i < empresas.length; i++) {
      const empresa = empresas[i];
      console.log(`\n🏢 Deployando empresa ${i + 1}/${empresas.length}: ${empresa.db_name}`);
      await deployCompany(empresa, sshConnection);
    }
    
    console.log('\n🎉 ¡Todos los deploys completados exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el deploy:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Cerrando conexión SSH...');
    await sshConnection.disconnect();
    process.exit(0);
  }
})();
