// scripts/setup.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Iniciando configuracion de AgroMax...\n');

const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, 'env.example');

// Ensure .env exists
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('Creando archivo .env desde env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('Archivo .env generado. Actualiza DATABASE_URL y JWT_SECRET segun tu entorno.\n');
  } else {
    console.log('No se encontro env.example. Crea un archivo .env con al menos:');
    console.log('  DATABASE_URL=postgres://usuario:password@host:puerto/db');
    console.log('  JWT_SECRET=tu_secret_seguro');
    console.log('  NODE_ENV=development');
    console.log('');
  }
}

// Check required dependencies
console.log('Verificando dependencias clave...');
try {
  require('pg');
  require('bcryptjs');
  require('jsonwebtoken');
  console.log('Dependencias cargadas correctamente.\n');
} catch (error) {
  console.error('Faltan dependencias. Ejecuta: npm install');
  process.exit(1);
}

// Run migration
console.log('Ejecutando migracion principal...');
try {
  execSync('node scripts/migrate.js', { stdio: 'inherit', cwd: rootDir });
  console.log('Migracion ejecutada correctamente.\n');
} catch (error) {
  console.error('Error ejecutando la migracion:', error.message);
  console.error('Verifica que DATABASE_URL apunte a tu instancia de PostgreSQL.\n');
  process.exit(1);
}

// Create default admin
console.log('Creando usuario administrador por defecto (si no existe)...');
try {
  execSync('node scripts/create_admin.js', { stdio: 'inherit', cwd: rootDir });
  console.log('Usuario administrador verificado.\n');
} catch (error) {
  console.error('No se pudo crear el usuario administrador:', error.message);
  console.error('Puedes ejecutarlo manualmente con: node scripts/create_admin.js\n');
}

console.log('Configuracion finalizada.');
console.log('Recuerda definir JWT_SECRET y DATABASE_URL antes de iniciar el servidor.');
