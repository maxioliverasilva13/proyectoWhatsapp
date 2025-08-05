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

// Configuración SSH optimizada para evitar broken pipes
const SSH_OPTIONS = [
  '-i', 'private_key',
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'ServerAliveInterval=60',
  '-o', 'ServerAliveCountMax=3',
  '-o', 'ConnectTimeout=30',
  '-o', 'TCPKeepAlive=yes',
  '-o', 'ControlMaster=auto',
  '-o', 'ControlPath=/tmp/ssh_%h_%p_%r',
  '-o', 'ControlPersist=600',
  '-T', // Disable pseudo-terminal allocation
  '-o', 'LogLevel=ERROR' // Reduce verbose SSH output
];

// Función para ejecutar comandos SSH con mejor manejo de errores
function executeSSHCommand(host, command, maxRetries = 3) {
  const sshCmd = ['ssh', ...SSH_OPTIONS, `root@${host}`, command];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Ejecutando (intento ${attempt}): ${command.substring(0, 100)}...`);
      const result = execSync(sshCmd.join(' '), { 
        maxBuffer: 1024 * 1024 * 50, // Aumentar buffer
        timeout: 600000, // 10 minutos timeout
        stdio: 'pipe'
      });
      return result;
    } catch (error) {
      console.error(`Error en intento ${attempt}:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      // Esperar antes del siguiente intento
      console.log(`Esperando 5 segundos antes del siguiente intento...`);
      execSync('sleep 5');
    }
  }
}

// Función para ejecutar rsync con mejor manejo de errores
function executeRsync(source, destination, maxRetries = 3) {
  const rsyncCmd = [
    'rsync',
    '-avz',
    '--delete',
    '--timeout=300',
    '-e', `"ssh ${SSH_OPTIONS.join(' ')}"`,
    '--exclude=node_modules',
    '--exclude=letsencrypt',
    source,
    destination
  ];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Ejecutando rsync (intento ${attempt})...`);
      const result = execSync(rsyncCmd.join(' '), { 
        maxBuffer: 1024 * 1024 * 50,
        timeout: 1800000, // 30 minutos timeout para rsync
        stdio: 'pipe'
      });
      return result;
    } catch (error) {
      console.error(`Error en rsync intento ${attempt}:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`Esperando 10 segundos antes del siguiente intento...`);
      execSync('sleep 10');
    }
  }
}

// Función para copiar archivos con SCP
function executeScp(source, destination, maxRetries = 3) {
  const scpCmd = ['scp', ...SSH_OPTIONS, '-r', source, destination];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Ejecutando scp (intento ${attempt}): ${source} -> ${destination}`);
      const result = execSync(scpCmd.join(' '), { 
        maxBuffer: 1024 * 1024 * 10,
        timeout: 300000, // 5 minutos timeout
        stdio: 'pipe'
      });
      return result;
    } catch (error) {
      console.error(`Error en scp intento ${attempt}:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`Esperando 5 segundos antes del siguiente intento...`);
      execSync('sleep 5');
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

async function deployCompany(empresa) {
  const dropletIp = process.env.DROPLET_IP;
  console.log(`\n📦 Iniciando deployment para empresa: ${empresa.db_name}`);
  
  createEnvFile(empresa);

  const envFileContent = fs.readFileSync(`.env.${empresa.db_name}`, 'utf8');
  console.log(`Contenido de .env.${empresa.db_name}:`, envFileContent);

  require('dotenv').config({ path: `.env.${empresa.db_name}` });

  try {
    // Paso 1: Crear directorio remoto
    console.log(`📁 Creando directorio para ${empresa.db_name}...`);
    executeSSHCommand(dropletIp, `mkdir -p /projects/${empresa?.db_name}`);

    // Paso 2: Sincronizar archivos del proyecto
    console.log(`📤 Sincronizando archivos del proyecto...`);
    executeRsync('./', `root@${dropletIp}:/projects/${empresa?.db_name}/`);

    // Paso 3: Copiar archivo .env y hacer deployment en una sola conexión SSH
    console.log(`🔧 Configurando y deployando...`);
    executeScp(`.env.${empresa.db_name}`, `root@${dropletIp}:/projects/${empresa?.db_name}/.env`);

    // Comando combinado para evitar múltiples conexiones SSH
    const deploymentCommand = `cd /projects/${empresa?.db_name} && echo "🐳 Iniciando Docker Compose..." && docker compose -f docker-compose.yml down --remove-orphans || true && docker compose -f docker-compose.yml up -d --build --remove-orphans && echo "✅ Deployment completado para ${empresa.db_name}"`;
    
    executeSSHCommand(dropletIp, deploymentCommand);
    console.log(`✅ Empresa ${empresa.db_name} deployada exitosamente`);

  } catch (error) {
    console.error(`❌ Error al deployar empresa ${empresa.db_name}:`, error.message);
    throw error;
  }
}

async function deployApp() {
  const dropletIp = process.env.DROPLET_IP;
  console.log(`\n🚀 Iniciando deployment de la aplicación principal...`);
  
  createEnvFileApp();
  require('dotenv').config({ path: `.env.app` });

  try {
    // Paso 1: Crear directorio remoto
    console.log(`📁 Creando directorio para app principal...`);
    executeSSHCommand(dropletIp, 'mkdir -p /projects/app');

    // Paso 2: Sincronizar archivos del proyecto
    console.log(`📤 Sincronizando archivos del proyecto principal...`);
    executeRsync('./', `root@${dropletIp}:/projects/app/`);

    // Paso 3: Copiar archivo .env
    console.log(`🔧 Copiando configuración...`);
    executeScp('.env.app', `root@${dropletIp}:/projects/app/.env`);

    // Comando combinado para configurar letsencrypt y hacer deployment
    console.log(`🐳 Configurando SSL y deployando app principal...`);
    const deploymentCommand = `cd /projects/app && mkdir -p /projects/app/letsencrypt && touch /projects/app/letsencrypt/acme.json && chmod 600 /projects/app/letsencrypt/acme.json && echo "🐳 Iniciando Docker Compose para app principal..." && docker compose -f docker-compose-app-prod.yml down --remove-orphans || true && docker compose -f docker-compose-app-prod.yml up -d --build --remove-orphans && echo "✅ Deployment de app principal completado"`;
    
    executeSSHCommand(dropletIp, deploymentCommand);
    console.log(`✅ Aplicación principal deployada exitosamente`);

  } catch (error) {
    console.error(`❌ Error al deployar aplicación principal:`, error.message);
    throw error;
  }
}

// Función para limpiar archivos temporales
function cleanupTempFiles() {
  try {
    console.log('🧹 Limpiando archivos temporales...');
    const tempFiles = fs.readdirSync('.').filter(file => file.startsWith('.env.') && file !== '.env');
    tempFiles.forEach(file => {
      try {
        fs.unlinkSync(file);
        console.log(`🗑️  Eliminado: ${file}`);
      } catch (err) {
        console.warn(`⚠️  No se pudo eliminar ${file}:`, err.message);
      }
    });
    
    // Limpiar conexiones SSH persistentes
    console.log('🔌 Cerrando conexiones SSH persistentes...');
    try {
      execSync('ssh -O exit -o ControlPath=/tmp/ssh_%h_%p_%r root@* 2>/dev/null || true');
    } catch (err) {
      // Ignorar errores de cleanup de SSH
    }
  } catch (error) {
    console.warn('⚠️  Error durante cleanup:', error.message);
  }
}

// Función principal mejorada
(async () => {
  const startTime = Date.now();
  console.log('🚀 Iniciando proceso de deployment...');
  
  try {
    // Primero deployar la aplicación principal
    await deployApp();
    
    // Luego obtener y deployar todas las empresas
    console.log('\n📋 Obteniendo lista de empresas para deployment...');
    const empresas = await getCompanies();
    console.log(`📊 Se encontraron ${empresas.length} empresas para deployar`);
    
    let deployedCount = 0;
    let failedCount = 0;
    const failedCompanies = [];
    
    for (const [index, empresa] of empresas.entries()) {
      try {
        console.log(`\n[${index + 1}/${empresas.length}] Deployando empresa: ${empresa.db_name}`);
        await deployCompany(empresa);
        deployedCount++;
      } catch (error) {
        console.error(`❌ Falló deployment de ${empresa.db_name}:`, error.message);
        failedCount++;
        failedCompanies.push({ name: empresa.db_name, error: error.message });
        
        // Continuar con las demás empresas en lugar de fallar completamente
        console.log('🔄 Continuando con la siguiente empresa...');
      }
    }
    
    // Resumen final
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL DEPLOYMENT');
    console.log('='.repeat(60));
    console.log(`⏱️  Duración total: ${duration} segundos`);
    console.log(`✅ Empresas deployadas exitosamente: ${deployedCount}`);
    console.log(`❌ Empresas con fallos: ${failedCount}`);
    
    if (failedCompanies.length > 0) {
      console.log('\n❌ Empresas que fallaron:');
      failedCompanies.forEach(company => {
        console.log(`   - ${company.name}: ${company.error}`);
      });
    }
    
    console.log('\n🎉 Proceso de deployment completado');
    
    // Exit con código de error si hubo fallas
    if (failedCount > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Error crítico en el proceso de deployment:', error);
    process.exit(1);
  } finally {
    cleanupTempFiles();
    process.exit(0);
  }
})();
