# Configuración de Base de Datos - AgroMax

Este documento describe cómo configurar y usar la base de datos SQLite3 para la aplicación AgroMax.

## Requisitos

- SQLite3 3.30 o superior
- Node.js 16 o superior
- npm o yarn

## Configuración Inicial

### 1. Instalar SQLite3

**En Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install sqlite3
```

**En macOS (con Homebrew):**
```bash
brew install sqlite3
```

**En Windows:**
SQLite3 viene incluido con Node.js, o puedes descargarlo desde [sqlite.org](https://www.sqlite.org/download.html)

### 2. Configurar Variables de Entorno

Crear archivo `.env` en el directorio `backend/`:

```bash
# Database Configuration
DATABASE_PATH=./database/agromax.db

# JWT Secret (cambia esto por una clave segura en producción)
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Instalar Dependencias

```bash
# Desde el directorio backend/
npm install
```

### 4. Ejecutar Migraciones

```bash
# Desde el directorio backend/
npm run migrate
```

### 5. Crear Usuario Administrador Inicial

**Opción 1: Usar el script automatizado (Recomendado)**
```bash
# Desde el directorio backend/
npm run create-admin
```

**Opción 2: Crear manualmente con SQL**
```bash
# Conectarse a la base de datos
sqlite3 database/agromax.db

-- Insertar usuario super administrador
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES ('admin@agromax.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzK', 'Admin', 'Sistema', 'super_admin', 1);

-- Insertar registro de administrador
INSERT INTO administrators (user_id, admin_level, can_manage_users, can_manage_establishments, can_view_reports)
VALUES (1, 'super_admin', 1, 1, 1);
```

**Credenciales del usuario administrador:**
- **Email**: `admin@agromax.com`
- **Contraseña**: `admin`
- **Rol**: Super Administrador

**⚠️ IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión por seguridad.

## Estructura de la Base de Datos

### Tablas Principales

#### `users`
- Almacena información de usuarios del sistema
- Campos: id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at

#### `administrators`
- Extiende usuarios con permisos de administración
- Campos: id, user_id, admin_level, permissions, can_manage_users, can_manage_establishments, can_view_reports

#### `establishments`
- Almacena información de establecimientos ganaderos
- Campos: id, name, address, phone, email, owner_id, is_active, created_at, updated_at

#### `user_establishments`
- Relación muchos a muchos entre usuarios y establecimientos
- Campos: id, user_id, establishment_id, role, is_active, created_at

### Tablas del Sistema AgroMax

#### `rodeos`
- Gestión de rodeos por establecimiento
- Campos: id, name, description, establishment_id, is_active, created_at, updated_at

#### `animals`
- Sistema completo de animales
- Campos: id, senasa_caravan, internal_caravan, name, birth_date, breed, mother_id, father_name, entry_date, observations, establishment_id, current_rodeo_id, is_active, created_at, updated_at

#### `animal_production_records`
- Historial de registros de producción
- Campos: id, animal_id, record_date, liters_per_day, quality_rating, notes, created_by, created_at

#### `animal_health_records`
- Historial de registros de salud
- Campos: id, animal_id, record_date, event_type, description, treatment, cost, veterinarian, notes, created_by, created_at

#### `animal_reproduction_records`
- Historial de registros de reproducción
- Campos: id, animal_id, record_date, record_type, bull_id, expected_birth_date, actual_birth_date, calf_sex, calf_weight, notes, created_by, created_at

#### `animal_movements`
- Historial de movimientos entre rodeos
- Campos: id, animal_id, from_rodeo_id, to_rodeo_id, movement_date, reason, created_by, created_at

#### `animal_photos`
- Fotos de animales
- Campos: id, animal_id, photo_url, photo_description, is_primary, created_by, created_at

#### `animal_alerts`
- Sistema de alertas
- Campos: id, animal_id, alert_type, title, description, alert_date, is_active, resolved_date, resolved_by, created_by, created_at

#### `activity_log`
- Historial de actividades del establecimiento
- Campos: id, establishment_id, user_id, activity_type, description, entity_type, entity_id, metadata, created_at

#### `user_permissions`
- Permisos específicos por establecimiento
- Campos: id, user_id, establishment_id, can_edit_animals, can_edit_rodeos, can_move_animals, can_add_production_records, can_add_health_records, can_add_reproduction_records, can_view_reports, created_at, updated_at

## Comandos Útiles

### Verificar Estado de la Base de Datos
```bash
# Verificar que la base de datos existe
ls -la database/

# Conectarse a la base de datos
sqlite3 database/agromax.db

# Ver todas las tablas
.tables

# Ver estructura de una tabla
.schema users

# Salir
.quit
```

### Backup y Restauración
```bash
# Crear backup
sqlite3 database/agromax.db ".backup backup_$(date +%Y%m%d_%H%M%S).db"

# Restaurar desde backup
sqlite3 database/agromax.db < backup_file.db
```

### Limpiar Base de Datos (Desarrollo)
```bash
# Eliminar base de datos existente
rm database/agromax.db

# Ejecutar migraciones nuevamente
npm run migrate

# Crear usuario administrador
npm run create-admin
```

## Scripts Disponibles

- `npm run migrate`: Ejecuta todas las migraciones pendientes
- `npm run create-admin`: Crea el usuario administrador inicial
- `npm run setup`: Configuración completa (migraciones + admin)
- `npm run dev`: Inicia el servidor en modo desarrollo
- `npm start`: Inicia el servidor en modo producción

## Solución de Problemas

### Error: "Database is locked"
```bash
# Verificar procesos que usan la base de datos
lsof database/agromax.db

# Si es necesario, reiniciar el servidor
```

### Error: "No such table"
```bash
# Verificar que las migraciones se ejecutaron
npm run migrate

# Verificar estructura de tablas
sqlite3 database/agromax.db ".tables"
```

### Error: "Permission denied"
```bash
# Verificar permisos del directorio database
chmod 755 database/
chmod 644 database/agromax.db
```

## Notas de Seguridad

1. **Nunca** subas el archivo `database/agromax.db` al control de versiones
2. **Siempre** usa contraseñas seguras en producción
3. **Configura** el JWT_SECRET con una clave segura y única
4. **Haz backups** regulares de la base de datos
5. **Monitorea** el tamaño del archivo de base de datos

## Rendimiento

- SQLite3 es excelente para aplicaciones pequeñas a medianas
- Para aplicaciones con alta concurrencia, considera migrar a PostgreSQL
- Usa índices apropiados para consultas frecuentes
- Considera usar WAL mode para mejor rendimiento: `PRAGMA journal_mode=WAL;`