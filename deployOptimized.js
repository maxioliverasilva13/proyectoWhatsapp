const { Client } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');

// Configuración optimizada
const MAX_PARALLEL_DEPLOYS = 3; // Limitar concurrencia para no sobrecargar servidor
const DEPLOY_TIMEOUT = 300000; // 5 minutos por deploy
const IMAGE_TAG = process.env.GITHUB_SHA || 'latest';
const REGISTRY = 'ghcr.io/tu-usuario/proyecto-whatsapp'; // Cambiar por tu registry

const client = new Client({
  user: process.env.POSTGRES_USER_GLOBAL,
  host: process.env.POSTGRES_GLOBAL_DB_HOST,
  database: process.env.POSTGRES_DB_GLOBAL,
  password: process.env.POSTGRES_PASSWORD_GLOBAL,
  port: process.env.POSTGRES_GLOBAL_DB_PORT,
  ssl: { rejectUnauthorized: false },
});

// Función SSH optimizada con reintentos
async function executeSSH(host, command, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = execSync(
        `ssh -i private_key -o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=60 root@${host} '${command}'`,
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: DEPLOY_TIMEOUT,
          encoding: 'utf8'
        }
      );
      return result;
    } catch (error) {
      console.warn(`⚠️  SSH intento ${i + 1}/${retries} falló:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
    }
  }
}

async function getCompanies() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM empresa WHERE deploy = TRUE');
    return res.rows;
  } catch (error) {
    console.error('❌ Error obteniendo empresas:', error);
    return [];
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

// Deploy optimizado usando imagen pre-construida
async function deployCompany(empresa) {
  const dropletIp = process.env.DROPLET_IP;
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Iniciando deploy de ${empresa.db_name}...`);
    
    // 1. Crear archivo .env
    createEnvFile(empresa);
    
    // 2. Preparar directorio en servidor (comando combinado)
    console.log(`📁 Preparando directorio para ${empresa.db_name}...`);
    await executeSSH(dropletIp, `
      mkdir -p /projects/${empresa.db_name} && 
      cd /projects/${empresa.db_name} && 
      rm -f .env
    `);
    
    // 3. Copiar solo archivos necesarios (mucho más rápido que rsync completo)
    console.log(`📄 Copiando configuración para ${empresa.db_name}...`);
    await execSync(
      `scp -i private_key -o StrictHostKeyChecking=no .env.${empresa.db_name} root@${dropletIp}:/projects/${empresa.db_name}/.env`,
      { timeout: 30000 }
    );
    
    // Copiar solo docker-compose.yml si no existe o cambió
    await execSync(
      `scp -i private_key -o StrictHostKeyChecking=no docker-compose-optimized.yml root@${dropletIp}:/projects/${empresa.db_name}/docker-compose.yml`,
      { timeout: 30000 }
    );
    
    // 4. Deploy usando imagen pre-construida (súper rápido)
    console.log(`🐳 Desplegando contenedor para ${empresa.db_name}...`);
    await executeSSH(dropletIp, `
      cd /projects/${empresa.db_name} && 
      docker pull ${REGISTRY}:${IMAGE_TAG} && 
      docker compose up -d --remove-orphans
    `);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Deploy completado para ${empresa.db_name} en ${duration}s`);
    
    return { success: true, empresa: empresa.db_name, duration };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Error en deploy de ${empresa.db_name} (${duration}s):`, error.message);
    return { success: false, empresa: empresa.db_name, error: error.message, duration };
  }
}

// Deploy paralelo con control de concurrencia
async function deployCompaniesParallel(empresas) {
  const results = [];
  const chunks = [];
  
  // Dividir en chunks para controlar concurrencia
  for (let i = 0; i < empresas.length; i += MAX_PARALLEL_DEPLOYS) {
    chunks.push(empresas.slice(i, i + MAX_PARALLEL_DEPLOYS));
  }
  
  console.log(`📊 Desplegando ${empresas.length} empresas en ${chunks.length} lotes de máximo ${MAX_PARALLEL_DEPLOYS}`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`\n🔄 Procesando lote ${i + 1}/${chunks.length} (${chunk.length} empresas)...`);
    
    const chunkPromises = chunk.map(empresa => deployCompany(empresa));
    const chunkResults = await Promise.allSettled(chunkPromises);
    
    chunkResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          empresa: chunk[index].db_name,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });
    
    // Pequeña pausa entre lotes para no sobrecargar el servidor
    if (i < chunks.length - 1) {
      console.log('⏸️  Pausa de 10s entre lotes...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  return results;
}

// Función principal
(async () => {
  const totalStartTime = Date.now();
  
  try {
    console.log('🎯 Iniciando deploy optimizado...');
    console.log(`📦 Usando imagen: ${REGISTRY}:${IMAGE_TAG}`);
    
    // Obtener empresas
    console.log('📋 Obteniendo lista de empresas...');
    const empresas = await getCompanies();
    
    if (empresas.length === 0) {
      console.log('⚠️  No se encontraron empresas para deploy');
      return;
    }
    
    console.log(`🏢 Encontradas ${empresas.length} empresas para deploy`);
    
    // Deploy paralelo
    const results = await deployCompaniesParallel(empresas);
    
    // Estadísticas finales
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
    const avgDuration = successful.length > 0 
      ? (successful.reduce((sum, r) => sum + parseFloat(r.duration || 0), 0) / successful.length).toFixed(2)
      : 0;
    
    console.log('\n📊 RESUMEN DEL DEPLOY:');
    console.log(`✅ Exitosos: ${successful.length}/${empresas.length}`);
    console.log(`❌ Fallidos: ${failed.length}/${empresas.length}`);
    console.log(`⏱️  Tiempo total: ${totalDuration}s`);
    console.log(`📈 Tiempo promedio por empresa: ${avgDuration}s`);
    
    if (failed.length > 0) {
      console.log('\n❌ Empresas fallidas:');
      failed.forEach(f => console.log(`  - ${f.empresa}: ${f.error}`));
    }
    
    console.log('\n🎉 Deploy optimizado completado!');
    
  } catch (error) {
    console.error('💥 Error crítico en deploy:', error);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      const envFiles = fs.readdirSync('.').filter(f => f.startsWith('.env.') && f !== '.env.app');
      envFiles.forEach(f => fs.unlinkSync(f));
      console.log('🧹 Archivos temporales limpiados');
    } catch {}
    
    process.exit(0);
  }
})();
