const { Client } = require('pg');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Clase para manejar una conexión SSH persistente
class SSHConnection {
  constructor(host, keyPath) {
    this.host = host;
    this.keyPath = keyPath;
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    console.log(`🔗 Estableciendo conexión SSH con ${this.host}...`);
    this.connection = spawn(
      'ssh',
      [
        '-i',
        this.keyPath,
        '-o',
        'StrictHostKeyChecking=no',
        '-o',
        'ServerAliveInterval=60',
        '-o',
        'ServerAliveCountMax=3',
        `root@${this.host}`,
      ],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer
      },
    );

    this.connection.stdout.setEncoding('utf8');
    this.connection.stderr.setEncoding('utf8');

    // Configurar logs de output
    this.connection.stdout.on('data', (data) => {
      if (data.trim()) {
        console.log(`📡 SSH Output: ${data.trim()}`);
      }
    });

    this.connection.stderr.on('data', (data) => {
      if (data.trim()) {
        console.log(`⚠️  SSH Error: ${data.trim()}`);
      }
    });

    this.isConnected = true;
    console.log(`✅ Conexión SSH establecida con ${this.host}`);
  }

  async executeCommand(command, description = '') {
    if (!this.isConnected) {
      throw new Error('SSH connection not established');
    }

    console.log(`🔧 ${description || 'Ejecutando comando'}: ${command}`);

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      this.connection.stdin.write(`${command}\n`);
      this.connection.stdin.write('echo "COMMAND_COMPLETED_$?"\n');

      let output = '';
      let errorOutput = '';

      const onData = (data) => {
        output += data;
        if (data.includes('COMMAND_COMPLETED_')) {
          const match = data.match(/COMMAND_COMPLETED_(\d+)/);
          if (match) {
            const exitCode = parseInt(match[1]);
            const duration = Date.now() - startTime;

            this.connection.stdout.removeListener('data', onData);
            this.connection.stderr.removeListener('data', onError);

            console.log(
              `⏱️  Comando completado en ${duration}ms (código: ${exitCode})`,
            );

            if (exitCode === 0) {
              resolve(output);
            } else {
              reject(
                new Error(
                  `Command failed with exit code ${exitCode}: ${errorOutput}`,
                ),
              );
            }
          }
        }
      };

      const onError = (data) => {
        errorOutput += data;
      };

      this.connection.stdout.on('data', onData);
      this.connection.stderr.on('data', onError);

      // Timeout de 10 minutos para comandos largos
      setTimeout(() => {
        this.connection.stdout.removeListener('data', onData);
        this.connection.stderr.removeListener('data', onError);
        reject(new Error(`Command timeout after 10 minutes: ${command}`));
      }, 600000);
    });
  }

  async disconnect() {
    if (this.connection && this.isConnected) {
      console.log(`🔌 Cerrando conexión SSH con ${this.host}...`);
      this.connection.stdin.write('exit\n');
      this.connection.kill();
      this.isConnected = false;
      console.log(`✅ Conexión SSH cerrada`);
    }
  }
}

// Función auxiliar para ejecutar comandos locales con logs
function executeLocalCommand(command, description = '') {
  console.log(`💻 ${description || 'Ejecutando comando local'}: ${command}`);
  const startTime = Date.now();

  try {
    const result = execSync(command, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer
    });
    const duration = Date.now() - startTime;
    console.log(`⏱️  Comando local completado en ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Comando local falló en ${duration}ms: ${error.message}`);
    throw error;
  }
}

async function getCompanies() {
  console.log('🗄️  Obteniendo lista de empresas para deploy...');
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM empresa where deploy=True');
    await client.end();
    console.log(`📋 Se encontraron ${res.rows.length} empresas para deploy`);
    return res.rows;
  } catch (error) {
    console.log('❌ Error al obtener empresas:', error);
    return [];
  } finally {
    await client.end();
  }
}

function createEnvFile(empresa) {
  console.log(`📝 Creando archivo .env para empresa: ${empresa.db_name}`);
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
  console.log(`✅ Archivo .env.${empresa.db_name} creado correctamente`);
}

function createEnvFileApp() {
  console.log('📝 Creando archivo .env para aplicación principal');
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
  console.log('📄 Contenido del .env.app creado');
  fs.writeFileSync(`.env.app`, envContent);
  console.log('✅ Archivo .env.app creado correctamente');
}

async function deployCompany(empresa, sshConnection) {
  const dropletIp = process.env.DROPLET_IP;
  console.log(`\n🏢 === Iniciando deploy de empresa: ${empresa.db_name} ===`);

  createEnvFile(empresa);

  const envFileContent = fs.readFileSync(`.env.${empresa.db_name}`, 'utf8');
  console.log(`📋 Mostrando contenido del .env.${empresa.db_name}`);

  require('dotenv').config({ path: `.env.${empresa.db_name}` });

  // Crear directorio del proyecto
  await sshConnection.executeCommand(
    `mkdir -p /projects/${empresa?.db_name}`,
    `Creando directorio para ${empresa.db_name}`,
  );

  // Sincronizar archivos
  executeLocalCommand(
    `rsync -avz --delete -e "ssh -i private_key -o StrictHostKeyChecking=no" --exclude='node_modules' --exclude='letsencrypt' ./ root@${dropletIp}:/projects/${empresa?.db_name}/`,
    `Sincronizando archivos para ${empresa.db_name}`,
  );

  // Eliminar .env anterior
  await sshConnection.executeCommand(
    `rm -f /projects/${empresa?.db_name}/.env`,
    `Eliminando .env anterior de ${empresa.db_name}`,
  );

  // Copiar nuevo .env
  executeLocalCommand(
    `scp -i private_key -o StrictHostKeyChecking=no -r .env.${empresa.db_name} root@${dropletIp}:/projects/${empresa?.db_name}/.env`,
    `Copiando nuevo .env para ${empresa.db_name}`,
  );

  // Ejecutar docker compose
  await sshConnection.executeCommand(
    `cd /projects/${empresa?.db_name} && docker compose -f docker-compose.yml up -d --build --remove-orphans`,
    `Ejecutando docker compose para ${empresa.db_name}`,
  );

  console.log(
    `✅ Deploy de empresa ${empresa.db_name} completado exitosamente\n`,
  );
}

async function deployApp(sshConnection) {
  const dropletIp = process.env.DROPLET_IP;
  console.log('\n🚀 === Iniciando deploy de aplicación principal ===');

  createEnvFileApp();
  require('dotenv').config({ path: `.env.app` });

  // Crear directorio del proyecto app
  await sshConnection.executeCommand(
    'mkdir -p /projects/app',
    'Creando directorio para aplicación principal',
  );

  // Sincronizar archivos
  executeLocalCommand(
    `rsync --delete -avz -e "ssh -i private_key -o StrictHostKeyChecking=no" --exclude='node_modules' --exclude='letsencrypt' ./ root@${dropletIp}:/projects/app/`,
    'Sincronizando archivos para aplicación principal',
  );

  // Eliminar .env anterior
  await sshConnection.executeCommand(
    'rm -f /projects/app/.env',
    'Eliminando .env anterior de aplicación principal',
  );

  // Copiar nuevo .env
  executeLocalCommand(
    `scp -i private_key -o StrictHostKeyChecking=no -r .env.app root@${dropletIp}:/projects/app/.env`,
    'Copiando nuevo .env para aplicación principal',
  );

  // Configurar letsencrypt
  await sshConnection.executeCommand(
    'mkdir -p /projects/app/letsencrypt && touch /projects/app/letsencrypt/acme.json && chmod 600 /projects/app/letsencrypt/acme.json',
    'Configurando letsencrypt para aplicación principal',
  );

  // Ejecutar docker compose
  await sshConnection.executeCommand(
    'cd /projects/app && docker compose -f docker-compose-app-prod.yml up -d --build',
    'Ejecutando docker compose para aplicación principal',
  );

  console.log('✅ Deploy de aplicación principal completado exitosamente\n');
}

(async () => {
  const sshConnection = new SSHConnection(
    process.env.DROPLET_IP,
    'private_key',
  );

  try {
    console.log('🚀 === INICIANDO PROCESO DE DEPLOY COMPLETO ===\n');
    const startTime = Date.now();

    // Establecer conexión SSH única
    await sshConnection.connect();

    // Deploy de aplicación principal
    await deployApp(sshConnection);

    // Obtener empresas para deploy
    const empresas = await getCompanies();

    // Deploy de cada empresa
    if (empresas.length > 0) {
      console.log(`\n📦 Iniciando deploy de ${empresas.length} empresas...\n`);

      for (let i = 0; i < empresas.length; i++) {
        const empresa = empresas[i];
        console.log(`\n⏳ Progreso: ${i + 1}/${empresas.length} empresas`);
        await deployCompany(empresa, sshConnection);
      }

      console.log(`\n🎉 Todas las empresas han sido desplegadas exitosamente!`);
    } else {
      console.log('\n📭 No se encontraron empresas para desplegar.');
    }

    const totalTime = Date.now() - startTime;
    const minutes = Math.floor(totalTime / 60000);
    const seconds = Math.floor((totalTime % 60000) / 1000);

    console.log(`\n✅ === DEPLOY COMPLETO FINALIZADO ===`);
    console.log(`⏱️  Tiempo total: ${minutes}m ${seconds}s`);
    console.log(`🏢 Empresas desplegadas: ${empresas.length}`);
    console.log(`🚀 Aplicación principal: Desplegada`);
  } catch (error) {
    console.log('\n❌ === ERROR EN PROCESO DE DEPLOY ===');
    console.log('💥 Error:', error.message);
    console.log('📍 Stack:', error.stack);
    process.exit(1);
  } finally {
    // Cerrar conexión SSH
    await sshConnection.disconnect();
    console.log('\n🔚 Proceso finalizado.');
    process.exit(0);
  }
})();
