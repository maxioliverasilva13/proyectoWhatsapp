const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Deploy Optimizado para App Principal - Versión mejorada con Docker Registry
 * 
 * USO:
 * - node deployAppOptimized.js
 * 
 * DESCRIPCIÓN:
 * - Deploya la app principal (app.measyapp.com o app.qa.measyapp.com)
 * - Usa imagen pre-construida del registry
 * - Incluye Traefik para SSL automático
 */

// Configuración
const IMAGE_TAG = process.env.IMAGE_TAG || 'latest'; // Usar tag de GitHub Actions si está disponible
const REGISTRY = 'ghcr.io/maxioliverasilva13/proyectowhatsapp';
const DEPLOY_TIMEOUT = 300000; // 5 minutos

// Detectar ambiente (PROD o QA) basado en variables de entorno
const isQA = process.env.POSTGRES_DB_GLOBAL && process.env.POSTGRES_DB_GLOBAL.includes('qa');
const environment = isQA ? 'qa' : 'prod';
const virtualHost = isQA ? 'app.qa.measyapp.com' : 'app.measyapp.com';

console.log(`🏠 Deploy optimizado de App Principal (${environment.toUpperCase()})`);
console.log(`🌐 URL: https://${virtualHost}`);
console.log(`📦 Imagen: ${REGISTRY}:${IMAGE_TAG}`);
console.log(`🔍 DEBUG - Variables de entorno:`);
console.log(`   - process.env.IMAGE_TAG: ${process.env.IMAGE_TAG}`);
console.log(`   - Imagen final a usar: ${REGISTRY}:${IMAGE_TAG}`);

// Función SSH optimizada con reintentos
async function executeSSH(host, command, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = execSync(
        `ssh -i private_key -o StrictHostKeyChecking=no -o ConnectTimeout=30 root@${host} '${command}'`,
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
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

function createEnvFileApp() {
  const envContent = `
POSTGRES_USER=${process.env.POSTGRES_USER_GLOBAL}
POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD_GLOBAL}
POSTGRES_DB=${process.env.POSTGRES_DB_GLOBAL}
VIRTUAL_HOST=${virtualHost}
EMAIL_USER=${process.env.EMAIL_USER || ''}
SUPABASE_URL=${process.env.SUPABASE_URL || ''}
FIREBASE_PROJECT_ID=${process.env.FIREBASE_PROJECT_ID}
FIREBASE_PRIVATE_KEY=${process.env.FIREBASE_PRIVATE_KEY}
FIREBASE_CLIENT_EMAIL=${process.env.FIREBASE_CLIENT_EMAIL}
SUPABASE_KEY=${process.env.SUPABASE_KEY || ''}
SUPABASE_BUCKET=${process.env.SUPABASE_BUCKET || ''}
EMAIL_HOST=${process.env.EMAIL_HOST || ''}
TOKEN_CONNECT_GIT=${process.env.TOKEN_CONNECT_GIT || ''}
EMAIL_PORT=${process.env.EMAIL_PORT || ''}
OPEN_AI_TOKEN=${process.env.OPEN_AI_TOKEN}
EMAIL_PASS=${process.env.EMAIL_PASS || ''}
REDIS_HOST=${process.env.REDIS_HOST}
REDIS_PORT=${process.env.REDIS_PORT}
REDIS_PASSWORD=${process.env.REDIS_PASSWORD}
GOOGLE_CLIENT_EMAIL=${process.env.GOOGLE_CLIENT_EMAIL || ''}
RESEND_KEY=${process.env.RESEND_KEY}
GOOGLE_PRIVATE_KEY=${process.env.GOOGLE_PRIVATE_KEY || ''}
POSTGRES_USER_GLOBAL=${process.env.POSTGRES_USER_GLOBAL}
POSTGRES_PASSWORD_GLOBAL=${process.env.POSTGRES_PASSWORD_GLOBAL}
POSTGRES_DB_GLOBAL=${process.env.POSTGRES_DB_GLOBAL}
POSTGRES_GLOBAL_DB_HOST=${process.env.POSTGRES_GLOBAL_DB_HOST}
POSTGRES_GLOBAL_DB_PORT=${process.env.POSTGRES_GLOBAL_DB_PORT}
JWT_SECRET_KEY=${process.env.JWT_SECRET_KEY}
DEEPSEEK_TOKEN=${process.env.DEEPSEEK_TOKEN}
ENV=${environment}
DOCKER_BUILDKIT=1
SUBDOMAIN=app
IMAGE_TAG=${IMAGE_TAG}
REGISTRY=${REGISTRY}
`;

  fs.writeFileSync('.env.app', envContent.trim());
  console.log('📝 Archivo .env.app creado');
}

function createOptimizedDockerCompose() {
  const dockerComposeContent = `services:
  app:
    image: \${REGISTRY}:\${IMAGE_TAG}
    environment:
      NODE_ENV: production
      POSTGRES_USER: \${POSTGRES_USER}
      EMAIL_USER: \${EMAIL_USER}
      EMAIL_PASS: \${EMAIL_PASS}
      EMAIL_HOST: \${EMAIL_HOST}
      EMAIL_PORT: \${EMAIL_PORT}
      REDIS_HOST: \${REDIS_HOST}
      REDIS_PORT: \${REDIS_PORT}
      REDIS_PASSWORD: \${REDIS_PASSWORD}
      SUPABASE_URL: \${SUPABASE_URL}
      FIREBASE_PROJECT_ID: \${FIREBASE_PROJECT_ID}
      FIREBASE_PRIVATE_KEY: \${FIREBASE_PRIVATE_KEY}
      FIREBASE_CLIENT_EMAIL: \${FIREBASE_CLIENT_EMAIL}
      TOKEN_CONNECT_GIT: \${TOKEN_CONNECT_GIT}
      SUPABASE_KEY: \${SUPABASE_KEY}
      SUPABASE_BUCKET: \${SUPABASE_BUCKET}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB}
      GOOGLE_CLIENT_EMAIL: \${GOOGLE_CLIENT_EMAIL}
      RESEND_KEY: \${RESEND_KEY}
      GOOGLE_PRIVATE_KEY: \${GOOGLE_PRIVATE_KEY}
      ENV: production
      SUBDOMAIN: \${SUBDOMAIN}
      VIRTUAL_HOST: \${VIRTUAL_HOST}
      POSTGRES_USER_GLOBAL: \${POSTGRES_USER_GLOBAL}
      POSTGRES_PASSWORD_GLOBAL: \${POSTGRES_PASSWORD_GLOBAL}
      POSTGRES_GLOBAL_DB_HOST: \${POSTGRES_GLOBAL_DB_HOST}
      POSTGRES_DB_GLOBAL: \${POSTGRES_DB_GLOBAL}
      POSTGRES_GLOBAL_DB_PORT: \${POSTGRES_GLOBAL_DB_PORT}
      JWT_SECRET_KEY: \${JWT_SECRET_KEY}
      OPEN_AI_TOKEN: \${OPEN_AI_TOKEN}
      DEEPSEEK_TOKEN: \${DEEPSEEK_TOKEN}
    labels:
      - traefik.enable=true
      - traefik.http.routers.app-router.rule=Host(\`\${VIRTUAL_HOST}\`)
      - traefik.http.routers.app-router.entrypoints=websecure
      - traefik.http.services.app-service.loadbalancer.server.port=3000
      - traefik.http.routers.app-router.tls=true
      - traefik.http.routers.app-router.tls.certresolver=myresolver
    networks:
      - app-network
    restart: unless-stopped
    container_name: app
    # Límites de recursos
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
    # Health check simple - verificar proceso Node.js
    healthcheck:
      test: ["CMD", "pgrep", "-f", "node.*dist/main"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  traefik:
    image: traefik:v2.10
    command:
      - --api.insecure=true
      - --providers.docker=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.myresolver.acme.tlschallenge=true
      - --certificatesresolvers.myresolver.acme.email=angelotunado02@gmail.com
      - --certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json
      - --entrypoints.web.http.redirections.entryPoint.to=websecure
      - --entrypoints.web.http.redirections.entryPoint.scheme=https
    ports:
      - 80:80
      - 443:443
      - 8080:8080
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    external: true`;

  fs.writeFileSync('docker-compose-app-optimized.yml', dockerComposeContent);
  console.log('📝 Archivo docker-compose-app-optimized.yml creado');
}

async function deployApp() {
  const dropletIp = process.env.DROPLET_IP;
  const startTime = Date.now();
  
  try {
    console.log('🚀 Iniciando deploy de app principal...');
    
    // 1. Crear archivos de configuración
    createEnvFileApp();
    createOptimizedDockerCompose();
    
    // 2. Preparar directorio en servidor
    console.log('📁 Preparando directorio en servidor...');
    await executeSSH(dropletIp, `
      mkdir -p /projects/app && 
      cd /projects/app && 
      rm -f .env &&
      mkdir -p letsencrypt &&
      touch letsencrypt/acme.json &&
      chmod 600 letsencrypt/acme.json
    `);
    
    // 3. Copiar archivos de configuración
    console.log('📤 Copiando configuración...');
    await execSync(
      `scp -i private_key -o StrictHostKeyChecking=no .env.app root@${dropletIp}:/projects/app/.env`,
      { timeout: 30000 }
    );
    
    await execSync(
      `scp -i private_key -o StrictHostKeyChecking=no docker-compose-app-optimized.yml root@${dropletIp}:/projects/app/docker-compose.yml`,
      { timeout: 30000 }
    );
    
    // 4. Deploy con imagen pre-construida
    console.log('🐳 Desplegando app principal...');
    console.log(`📦 Verificando imagen: ${REGISTRY}:${IMAGE_TAG}`);
    
    const deployResult = await executeSSH(dropletIp, `
      cd /projects/app && 
      echo "=== CHECKING CURRENT IMAGE ===" &&
      grep IMAGE_TAG .env &&
      echo "=== VERIFYING IMAGE EXISTS ===" &&
      docker manifest inspect \$(grep REGISTRY .env | cut -d'=' -f2):\$(grep IMAGE_TAG .env | cut -d'=' -f2) &&
      echo "=== PULLING IMAGE ===" &&
      docker compose pull &&
      echo "=== STOPPING OLD CONTAINERS ===" &&
      docker compose down --remove-orphans || true &&
      echo "=== STARTING NEW CONTAINERS ===" &&
      docker compose up -d --force-recreate &&
      echo "=== WAITING FOR CONTAINERS TO START ===" &&
      sleep 45 &&
      echo "=== CONTAINERS STATUS ===" &&
      docker ps --filter "name=app" &&
      echo "=== CURRENT IMAGE IN USE ===" &&
      docker inspect app --format='{{.Config.Image}}' 2>/dev/null || echo "Container not found" &&
      echo "=== HEALTH CHECK STATUS ===" &&
      docker inspect app --format='{{.State.Health.Status}}' 2>/dev/null || echo "No health check configured"
    `);
    
    console.log('📋 Deploy output:', deployResult);
    
    // 5. Verificar que el contenedor está corriendo
    console.log('🔍 Verificando deploy...');
    const containerStatus = await executeSSH(dropletIp, `
      docker ps --filter "name=app" --format "{{.Status}}"
    `);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (containerStatus.includes('Up')) {
      console.log(`✅ Deploy de app principal completado exitosamente`);
      console.log(`⏱️  Tiempo total: ${duration}s`);
      console.log(`🌐 URL: https://${virtualHost}`);
      console.log(`🔍 Health check: https://${virtualHost}/health`);
      console.log(`🎛️  Traefik dashboard: http://${dropletIp}:8080`);
      return true;
    } else {
      throw new Error(`Contenedor no está corriendo. Status: ${containerStatus}`);
    }
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Error en deploy de app principal (${duration}s):`, error.message);
    
    // Mostrar logs para debugging
    try {
      console.log('\n📋 Logs del contenedor:');
      const logs = await executeSSH(dropletIp, `docker logs app --tail 20`);
      console.log(logs);
    } catch {}
    
    return false;
  }
}

(async () => {
  const totalStartTime = Date.now();
  
  try {
    const success = await deployApp();
    
    const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
    
    if (success) {
      console.log(`\n🎉 Deploy de app principal completado exitosamente en ${totalDuration}s!`);
    } else {
      console.log(`\n💥 Deploy de app principal falló después de ${totalDuration}s`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      if (fs.existsSync('.env.app')) {
        fs.unlinkSync('.env.app');
      }
      if (fs.existsSync('docker-compose-app-optimized.yml')) {
        fs.unlinkSync('docker-compose-app-optimized.yml');
      }
      console.log('🧹 Archivos temporales limpiados');
    } catch {}
    
    process.exit(0);
  }
})();
