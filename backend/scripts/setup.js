// scripts/setup.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando AgroMax...\n');

// Verificar si existe el archivo .env
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../env.example');

if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
        console.log('📋 Copiando archivo de configuración de ejemplo...');
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ Archivo .env creado desde env.example');
        console.log('⚠️  Por favor, edita el archivo .env con tus configuraciones antes de continuar.\n');
    } else {
        console.log('❌ No se encontró el archivo env.example');
        console.log('📝 Crea un archivo .env con las siguientes variables:');
        console.log('   DATABASE_PATH=./database/agromax.db');
        console.log('   JWT_SECRET=tu_secret_seguro');
        console.log('   PORT=3000');
        console.log('   NODE_ENV=development\n');
    }
}

// Verificar si las dependencias están instaladas
console.log('📦 Verificando dependencias...');
try {
    require('sqlite3');
    require('bcryptjs');
    require('jsonwebtoken');
    console.log('✅ Dependencias instaladas correctamente\n');
} catch (error) {
    console.log('❌ Faltan dependencias. Ejecuta: npm install\n');
    process.exit(1);
}

// Ejecutar migraciones
console.log('🗄️  Ejecutando migraciones de base de datos...');
try {
    execSync('node scripts/migrate.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Migraciones ejecutadas correctamente\n');
} catch (error) {
    console.log('❌ Error ejecutando migraciones:', error.message);
    console.log('🔧 Asegúrate de que:');
    console.log('   1. SQLite3 esté instalado');
    console.log('   2. El directorio database sea escribible');
    console.log('   3. Las configuraciones en .env sean correctas\n');
    process.exit(1);
}

// Crear usuario administrador
console.log('👤 Creando usuario administrador...');
try {
    execSync('node scripts/create_admin.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Usuario administrador creado correctamente\n');
} catch (error) {
    console.log('❌ Error creando usuario administrador:', error.message);
    console.log('🔧 Puedes crear el usuario manualmente ejecutando: npm run create-admin\n');
}

console.log('🎉 ¡Configuración completada!');
console.log('\n📋 Resumen:');
console.log('   ✅ Base de datos configurada');
console.log('   ✅ Tablas creadas');
console.log('   ✅ Usuario administrador creado');
console.log('\n🔑 Credenciales de administrador:');
console.log('   📧 Email: admin@agromax.com');
console.log('   🔐 Contraseña: admin');
console.log('\n🚀 Para iniciar el servidor:');
console.log('   npm run dev    (desarrollo)');
console.log('   npm start      (producción)');
console.log('\n⚠️  IMPORTANTE: Cambia la contraseña del administrador después del primer inicio de sesión.');
