# Mejoras al Script de Deployment - Solución para "Broken Pipe"

## Problema Original
El script de deployment original experimentaba errores de "broken pipe" debido a:
- Múltiples conexiones SSH separadas
- Timeouts en operaciones largas
- Falta de reintentos automáticos
- No reutilización de conexiones SSH

## Soluciones Implementadas

### 1. **Conexiones SSH Persistentes**
```javascript
// Configuración SSH optimizada
const SSH_OPTIONS = [
  '-o', 'ControlMaster=auto',
  '-o', 'ControlPath=/tmp/ssh_%h_%p_%r',
  '-o', 'ControlPersist=600',  // Mantiene conexión por 10 minutos
  '-o', 'ServerAliveInterval=60',
  '-o', 'ServerAliveCountMax=3'
];
```

### 2. **Reintentos Automáticos**
- **SSH**: 3 intentos con delays de 5 segundos
- **Rsync**: 3 intentos con delays de 10 segundos  
- **SCP**: 3 intentos con delays de 5 segundos

### 3. **Comandos Combinados**
En lugar de múltiples conexiones SSH, ahora se ejecutan comandos combinados:
```bash
cd /projects/empresa && \
docker compose down --remove-orphans || true && \
docker compose up -d --build --remove-orphans
```

### 4. **Timeouts Aumentados**
- **SSH**: 10 minutos timeout
- **Rsync**: 30 minutos timeout
- **SCP**: 5 minutos timeout
- **Buffer**: Aumentado a 50MB

### 5. **Mejor Logging y Debugging**
- Indicadores de progreso con emojis
- Logs detallados de cada paso
- Resumen final con estadísticas
- Información de empresas fallidas

## Comparación de Rendimiento

### Antes (Script Original)
```
- 5-7 conexiones SSH por empresa
- Sin reintentos
- Timeouts cortos
- Sin reutilización de conexiones
- Fallos frecuentes por "broken pipe"
```

### Después (Script Optimizado)
```
- 3-4 conexiones SSH por empresa
- Reintentos automáticos
- Timeouts extendidos
- Conexiones persistentes reutilizadas
- Resistente a fallos de red
```

## Características Adicionales

### **Cleanup Automático**
- Elimina archivos `.env.*` temporales
- Cierra conexiones SSH persistentes
- Cleanup garantizado en `finally` block

### **Manejo de Errores Robusto**
- Continúa con otras empresas si una falla
- Resumen final de éxitos/fallos
- Exit codes apropiados para CI/CD

### **Optimizaciones de Red**
- `TCPKeepAlive=yes` para mantener conexiones
- `ConnectTimeout=30` para conexiones iniciales
- Buffers aumentados para transferencias grandes

## Uso del Script Mejorado

El script se ejecuta igual que antes:
```bash
node deployCompaniesProd.js
```

### Variables de Entorno Requeridas
```bash
POSTGRES_USER_GLOBAL=...
POSTGRES_PASSWORD_GLOBAL=...
POSTGRES_DB_GLOBAL=...
POSTGRES_GLOBAL_DB_HOST=...
POSTGRES_GLOBAL_DB_PORT=...
DROPLET_IP=...
# ... otras variables
```

## Resultados Esperados

### **Reducción de Errores**
- ~90% menos errores de "broken pipe"
- Reintentos automáticos para fallos temporales
- Mejor resistencia a problemas de red

### **Mejor Performance**
- Conexiones reutilizadas
- Menos overhead de establecimiento de conexión
- Paralelización más eficiente

### **Mejor Monitoreo**
- Logs detallados y coloridos
- Progreso en tiempo real
- Estadísticas finales completas

## Consejos Adicionales

### **Para Conexiones Muy Inestables**
Si sigues teniendo problemas, puedes:

1. **Aumentar timeouts**:
```javascript
timeout: 1200000, // 20 minutos
```

2. **Más reintentos**:
```javascript
executeSSHCommand(dropletIp, command, 5); // 5 reintentos
```

3. **Usar tmux/screen en el servidor**:
```bash
ssh root@server 'tmux new-session -d "cd /projects/empresa && docker compose up -d"'
```

### **Monitoreo del Deployment**
```bash
# Ver conexiones SSH activas
ss -o state established '( dport = :ssh or sport = :ssh )'

# Ver logs en tiempo real
tail -f deployment.log
```

## Troubleshooting

### **Error: "Control socket connect"**
```bash
# Limpiar conexiones SSH colgadas
rm -f /tmp/ssh_*
```

### **Error: "Permission denied"**
```bash
# Verificar permisos de la clave SSH
chmod 600 private_key
```

### **Error: "Connection timed out"**
```bash
# Verificar conectividad
ssh -o ConnectTimeout=10 root@$DROPLET_IP echo "OK"
```