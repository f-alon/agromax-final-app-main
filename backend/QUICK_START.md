# 🚀 Guía de Inicio Rápido - AgroMax

Esta guía te ayudará a configurar y ejecutar AgroMax en pocos minutoss.

## ⚡ Configuración Rápida

### 1. Instalar Dependencias
```bash
# Desde el directorio backend/
npm install
```

### 2. Configuración Automática
```bash
# Ejecutar configuración completa
npm run setup
```

Este comando:
- ✅ Verifica dependencias
- ✅ Crea archivo .env si no existe
- ✅ Ejecuta migraciones de base de datos
- ✅ Crea usuario administrador inicial

### 3. Iniciar Servidor
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### 4. Acceder a la Aplicación
- **URL**: http://localhost:3000
- **Email**: admin@agromax.com
- **Contraseña**: admin

## 🔧 Configuración Manual (Si es Necesario)

### Variables de Entorno
Crear archivo `.env` en `backend/`:
```bash
DATABASE_PATH=./database/agromax.db
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
PORT=3000
NODE_ENV=development
```

### Ejecutar Migraciones
```bash
npm run migrate
```

### Crear Usuario Administrador
```bash
npm run create-admin
```

## 📋 Verificación

### Verificar Base de Datos
```bash
# Verificar que la base de datos existe
ls -la database/

# Conectarse a la base de datos
sqlite3 database/agromax.db

# Ver tablas creadas
.tables

# Salir
.quit
```

### Verificar Usuario Administrador
```bash
# Conectarse a la base de datos
sqlite3 database/agromax.db

# Verificar usuario admin
SELECT email, first_name, last_name, role FROM users WHERE email = 'admin@agromax.com';

# Salir
.quit
```

## 🎯 Próximos Pasos

1. **Cambiar contraseña del administrador** después del primer login
2. **Crear establecimientos** desde el panel de administración
3. **Asignar usuarios** a establecimientos
4. **Configurar rodeos** y comenzar a registrar animales

## 🆘 Solución de Problemas

### Error: "Cannot find module 'sqlite3'"
```bash
npm install sqlite3
```

### Error: "Database is locked"
```bash
# Reiniciar el servidor
# Verificar que no hay otros procesos usando la base de datos
```

### Error: "Permission denied"
```bash
# Verificar permisos del directorio
chmod 755 database/
```

### Error: "No such table"
```bash
# Ejecutar migraciones
npm run migrate
```

## 📚 Comandos Útiles

```bash
# Ver logs del servidor
npm run dev

# Verificar estado de la base de datos
sqlite3 database/agromax.db ".tables"

# Crear backup
sqlite3 database/agromax.db ".backup backup_$(date +%Y%m%d).db"

# Limpiar y reiniciar (desarrollo)
rm database/agromax.db && npm run setup
```

## 🔐 Seguridad

- ⚠️ **Cambia la contraseña del administrador** después del primer login
- ⚠️ **Configura un JWT_SECRET seguro** en producción
- ⚠️ **No subas** el archivo `database/agromax.db` al control de versiones
- ⚠️ **Haz backups** regulares de la base de datos

## 📞 Soporte

Si encuentras problemas:
1. Verifica que todas las dependencias estén instaladas
2. Revisa los logs del servidor
3. Consulta la documentación completa en `README_DATABASE.md`
4. Verifica que SQLite3 esté instalado en tu sistema

¡Listo! 🎉 AgroMax debería estar funcionando correctamente.