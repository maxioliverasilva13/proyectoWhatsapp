const { Client } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');

// Obtener parámetros
const dbNameArg = process.argv[2];
const IMAGE_TAG = process.env.GITHUB_SHA || process.argv[3] || 'main';
const REGISTRY = 'ghcr.io/maxioliverasilva13/proyectowhatsapp'; // Tu registry real

console.log('🚀 Deploy optimizado para empresa:', dbNameArg);
console.log('📦 Usando imagen:', `${REGISTRY}:${IMAGE_TAG}`);

if (!dbNameArg) {
  console.error('❌ Falta el parámetro db_name. Uso: node deploySingleCompanyOptimized.js <db_name> [image_tag]');
  process.exit(1);
}

const client = new Client({
  user: process.env.POSTGRES_USER_GLOBAL,
  host: process.env.POSTGRES_GLOBAL_DB_HOST,
  database: process.env.POSTGRES_DB_GLOBAL,
  password: process.env.POSTGRES_PASSWORD_GLOBAL,
  port: process.env.POSTGRES_GLOBAL_DB_PORT,
  ssl: { rejectUnauthorized: false },
});

async function executeSSH(host, command, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = execSync(
        `ssh -i private_key -o StrictHostKeyChecking=no -o ConnectTimeout=30 root@${host} '${command}'`,
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 300000, // 5 minutos
          encoding: 'utf8'
        }
      );
      return result;
    } catch (error) {
      console.warn(`⚠️  SSH intento ${i + 1}/${retries} falló:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

async function getEmpresaByDbName(dbName) {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM empresa WHERE db_name = $1 LIMIT 1', [dbName]);
    return res.rows[0] || null;
  } catch (error) {
    console.error('❌ Error al obtener la empresa:', error);
    return null;
  } finally {
    try { await client.end(); } catch {}
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
ID_INSTANCE=${empresa?.greenApiInstance || ''}
FIREBASE_PROJECT_ID=${process.env.FIREBASE_PROJECT_ID}
FIREBASE_PRIVATE_KEY=${process.env.FIREBASE_PRIVATE_KEY}
FIREBASE_CLIENT_EMAIL=${process.env.FIREBASE_CLIENT_EMAIL}
REDIS_HOST=${process.env.REDIS_HOST}
REDIS_PORT=${process.env.REDIS_PORT}
REDIS_PASSWORD=${process.env.REDIS_PASSWORD}
API_TOKEN_INSTANCE=${empresa?.greenApiInstanceToken || ''}
OPEN_AI_TOKEN=${process.env.OPEN_AI_TOKEN}
JWT_SECRET_KEY=${process.env.JWT_SECRET_KEY}
ASSISTANT_ID=${process.env.ASSISTANT_ID}
ENV=prod
DOCKER_BUILDKIT=1
SUBDOMAIN=${empresa.db_name}
RESEND_KEY=${process.env.RESEND_KEY}
DEEPSEEK_TOKEN=${process.env.DEEPSEEK_TOKEN}
IMAGE_TAG=${IMAGE_TAG}
REGISTRY=${REGISTRY}
`;

  fs.writeFileSync(`.env.${empresa.db_name}`, envContent.trim());
}

async function deployCompany(empresa) {
  const dropletIp = process.env.DROPLET_IP;
  const startTime = Date.now();
  
  try {
    console.log(`\n🏢 Iniciando deploy optimizado de ${empresa.db_name}...`);
    
    // 1. Crear archivo .env
    console.log('📝 Creando configuración...');
    createEnvFile(empresa);
    
    // 2. Preparar directorio en servidor
    console.log('📁 Preparando directorio en servidor...');
    await executeSSH(dropletIp, `
      mkdir -p /projects/${empresa.db_name} && 
      cd /projects/${empresa.db_name} && 
      rm -f .env
    `);
    
    // 3. Copiar archivos de configuración
    console.log('📤 Copiando configuración...');
    await execSync(
      `scp -i private_key -o StrictHostKeyChecking=no .env.${empresa.db_name} root@${dropletIp}:/projects/${empresa.db_name}/.env`,
      { timeout: 30000 }
    );
    
    await execSync(
      `scp -i private_key -o StrictHostKeyChecking=no docker-compose-optimized.yml root@${dropletIp}:/projects/${empresa.db_name}/docker-compose.yml`,
      { timeout: 30000 }
    );
    
    // 4. Deploy con imagen pre-construida
    console.log('🐳 Desplegando contenedor...');
    await executeSSH(dropletIp, `
      cd /projects/${empresa.db_name} && 
      echo "Pulling image ${REGISTRY}:${IMAGE_TAG}..." &&
      docker pull ${REGISTRY}:${IMAGE_TAG} && 
      echo "Starting container..." &&
      docker compose up -d --remove-orphans &&
      echo "Waiting for health check..." &&
      sleep 10 &&
      docker ps | grep ${empresa.db_name}-app
    `);
    
    // 5. Verificar que el contenedor está corriendo
    console.log('🔍 Verificando deploy...');
    const containerStatus = await executeSSH(dropletIp, `
      docker ps --filter "name=${empresa.db_name}-app" --format "{{.Status}}"
    `);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (containerStatus.includes('Up')) {
      console.log(`✅ Deploy completado exitosamente para ${empresa.db_name}`);
      console.log(`⏱️  Tiempo total: ${duration}s`);
      console.log(`🌐 URL: https://${empresa.db_name}.measyapp.com`);
      console.log(`🔍 Health check: https://${empresa.db_name}.measyapp.com/health`);
      return true;
    } else {
      throw new Error(`Contenedor no está corriendo. Status: ${containerStatus}`);
    }
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Error en deploy de ${empresa.db_name} (${duration}s):`, error.message);
    
    // Mostrar logs para debugging
    try {
      console.log('\n📋 Logs del contenedor:');
      const logs = await executeSSH(dropletIp, `docker logs ${empresa.db_name}-app --tail 20`);
      console.log(logs);
    } catch {}
    
    return false;
  }
}

(async () => {
  const totalStartTime = Date.now();
  
  try {
    // Obtener información de la empresa
    console.log('🔍 Buscando empresa...');
    const empresa = await getEmpresaByDbName(dbNameArg);
    
    if (!empresa) {
      console.error(`❌ No se encontró una empresa con db_name = "${dbNameArg}"`);
      process.exit(1);
    }
    
    console.log(`✅ Empresa encontrada: ${empresa.nombre || empresa.db_name}`);
    
    // Verificar que la imagen existe
    console.log('🔍 Verificando imagen en registry...');
    try {
      await execSync(`docker manifest inspect ${REGISTRY}:${IMAGE_TAG}`, { stdio: 'pipe' });
      console.log('✅ Imagen encontrada en registry');
    } catch {
      console.warn('⚠️  No se pudo verificar la imagen. Continuando...');
    }
    
    // Deploy
    const success = await deployCompany(empresa);
    
    const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
    
    if (success) {
      console.log(`\n🎉 Deploy completado exitosamente en ${totalDuration}s!`);
      console.log('\n📊 Próximos pasos:');
      console.log(`   • Verificar: https://${empresa.db_name}.measyapp.com/health`);
      console.log(`   • Monitorear: docker logs ${empresa.db_name}-app -f`);
      console.log(`   • Recursos: docker stats ${empresa.db_name}-app`);
    } else {
      console.log(`\n💥 Deploy falló después de ${totalDuration}s`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      if (fs.existsSync(`.env.${dbNameArg}`)) {
        fs.unlinkSync(`.env.${dbNameArg}`);
        console.log('🧹 Archivo temporal limpiado');
      }
    } catch {}
    
    process.exit(0);
  }
})();
