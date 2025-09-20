# 🚀 Guía de Optimización de Deploy

## 📊 Comparación: Antes vs Después

### ❌ **Deploy Actual (Lento)**
```
┌─ GitHub Actions ─┐    ┌─ Servidor ─┐
│ 1. npm install   │    │             │
│ 2. Ejecuta script │────┤ rsync TODO  │ ← 🐌 Lento
└───────────────────┘    │ docker build│ ← 💥 CPU alta
                         │ npm install │ ← 🔄 Repetitivo
                         └─────────────┘
```
**Problemas:**
- ⏱️ **15-30 min** por deploy completo
- 🔥 **CPU al 100%** durante builds
- 📡 **Ancho de banda alto** (rsync completo)
- 🔄 **Reinstala dependencias** cada vez
- 🐌 **Deploy secuencial** (una empresa por vez)

### ✅ **Deploy Optimizado (Rápido)**
```
┌─ GitHub Actions ─┐    ┌─ Docker Registry ─┐    ┌─ Servidor ─┐
│ 1. Build imagen  │────┤ Guarda imagen     │    │             │
│ 2. Push registry │    │ (una sola vez)    │────┤ docker pull │ ← ⚡ Súper rápido
└───────────────────┘    └───────────────────┘    │ docker up   │ ← 🎯 Mínimo CPU
                                                  └─────────────┘
```
**Beneficios:**
- ⚡ **2-5 min** por deploy completo
- 🔋 **CPU mínimo** (solo pull + restart)
- 📡 **Ancho de banda bajo** (solo imagen final)
- 🎯 **Sin reinstalaciones** (imagen pre-construida)
- 🚀 **Deploy paralelo** (3 empresas simultáneas)

## 🔧 Implementación

### 1. **Usar el nuevo sistema**
```bash
# En lugar de:
node deployCompaniesProd.js
node deploySingleCompanyProd.js empresa1

# Usar (deploy completo):
node deployOptimized.js

# Usar (deploy específico):
node deployOptimized.js empresa1

# Usar (con tag específico):
node deployOptimized.js empresa1 v1.2.3

# Ver ayuda:
node deployOptimized.js --help
```

### 2. **Configurar GitHub Registry**
```bash
# En tu repositorio, ir a Settings > Actions > General
# Habilitar: "Read and write permissions" para GITHUB_TOKEN
```

### 3. **Actualizar secrets**
```bash
# Ya tienes todos los secrets necesarios
# Solo asegúrate de que GITHUB_TOKEN tenga permisos de packages
```

### 4. **Activar el workflow (SOLO MANUAL)**
```bash
# ⚠️  IMPORTANTE: El deploy es SOLO MANUAL para evitar accidentes

# PRODUCCIÓN - Ejecutar desde GitHub Actions:
# GitHub > Actions > "Deploy Optimized to PROD" > Run workflow

# QA - Ejecutar desde GitHub Actions:
# GitHub > Actions > "Deploy Optimized to QA" > Run workflow

# Parámetros disponibles:
# - Deploy completo: dejar campos vacíos
# - Deploy específico: llenar "db_name" con nombre de empresa
# - Tag específico: llenar "image_tag" con versión deseada
```

#### **Workflows Disponibles:**
- **`Deploy Optimized to PROD`**: Deploy a producción
- **`Deploy Optimized to QA`**: Deploy a ambiente de pruebas

#### **Ejemplos de Uso:**
- **Deploy completo PROD**: `db_name` vacío, `image_tag` vacío
- **Deploy específico QA**: `db_name` = "empresa1", `image_tag` vacío  
- **Deploy con rollback**: `db_name` = "empresa1", `image_tag` = "v1.2.0"

> 🛡️ **Seguridad**: No hay triggers automáticos. Todos los deploys requieren acción manual deliberada.
> 🔧 **Limpieza**: Se eliminaron todos los workflows antiguos, solo quedan los optimizados.

## 📈 Optimizaciones Implementadas

### 🐳 **Docker Multi-Stage Build**
- **Stage 1**: Instala dependencias con cache
- **Stage 2**: Build de la aplicación
- **Stage 3**: Runtime mínimo (solo lo necesario)

### 🏗️ **Build Cache Inteligente**
```dockerfile
# Cache de dependencias npm
RUN --mount=type=cache,target=/root/.npm npm ci

# Cache de layers de Docker
cache-from: type=gha
cache-to: type=gha,mode=max
```

### 🚀 **Deploy Paralelo**
```javascript
// Antes: Una empresa por vez
for (empresa of empresas) {
  await deployCompany(empresa); // ← Secuencial
}

// Después: 3 empresas simultáneas
const chunks = chunk(empresas, 3);
await Promise.allSettled(chunkPromises); // ← Paralelo
```

### 🎯 **Límites de Recursos**
```yaml
deploy:
  resources:
    limits:
      memory: 512M      # ← Evita colapso de memoria
      cpus: '0.5'       # ← Limita uso de CPU
```

### 🔍 **Health Checks**
```yaml
healthcheck:
  test: ["CMD", "wget", "http://localhost:3000/health"]
  interval: 30s       # ← Verifica cada 30s
  retries: 3          # ← 3 intentos antes de fallar
```

## 🎛️ **Configuración Avanzada**

### **Ajustar Concurrencia**
```javascript
// En deployOptimized.js línea 8
const MAX_PARALLEL_DEPLOYS = 3; // ← Cambiar según tu servidor

// Servidor potente: 5-8
// Servidor normal: 3-4  
// Servidor básico: 1-2
```

### **Timeout Personalizado**
```javascript
// En deployOptimized.js línea 9
const DEPLOY_TIMEOUT = 300000; // 5 minutos

// Deploy rápido: 180000 (3 min)
// Deploy normal: 300000 (5 min)
// Deploy lento: 600000 (10 min)
```

### **Registry Personalizado**
```javascript
// En deployOptimized.js línea 11
const REGISTRY = 'ghcr.io/tu-usuario/proyecto-whatsapp';

// Opciones:
// - GitHub: ghcr.io/usuario/repo
// - Docker Hub: usuario/repo
// - AWS ECR: 123456789.dkr.ecr.region.amazonaws.com/repo
```

## 📊 **Monitoreo y Métricas**

### **Logs del Deploy**
```bash
# Ver logs en tiempo real
ssh root@tu-servidor 'docker logs -f empresa-app'

# Ver logs de múltiples empresas
ssh root@tu-servidor 'docker logs empresa1-app & docker logs empresa2-app'
```

### **Métricas de Rendimiento**
```bash
# Uso de recursos
ssh root@tu-servidor 'docker stats'

# Espacio en disco
ssh root@tu-servidor 'df -h'

# Imágenes Docker
ssh root@tu-servidor 'docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"'
```

## 🔧 **Troubleshooting**

### **Error: "Image not found"**
```bash
# Verificar que la imagen se construyó
docker images | grep ghcr.io

# Re-ejecutar build
gh workflow run deploy-optimized.yml
```

### **Error: "Permission denied"**
```bash
# Verificar permisos de GITHUB_TOKEN
# Settings > Actions > General > Workflow permissions
# Seleccionar: "Read and write permissions"
```

### **Deploy lento aún**
```bash
# Reducir concurrencia
MAX_PARALLEL_DEPLOYS = 1

# Verificar recursos del servidor
htop
df -h
```

## 🎯 **Próximos Pasos**

1. **Probar con una empresa** usando `deploySingleCompanyOptimized.js`
2. **Monitorear recursos** durante el primer deploy completo
3. **Ajustar concurrencia** según el rendimiento observado
4. **Configurar alertas** para fallos de deploy
5. **Implementar rollback** automático en caso de errores

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs de GitHub Actions
2. Verifica los logs del servidor con `docker logs`
3. Comprueba el uso de recursos con `docker stats`
4. Ajusta la configuración según tu infraestructura
