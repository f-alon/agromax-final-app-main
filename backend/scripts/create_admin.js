// scripts/create_admin.js
const bcrypt = require('bcryptjs');
const { runExecute, runSingle, db } = require('../config/database');

async function createAdminUser() {
  try {
    console.log('Creando usuario administrador...');
    
    // Hash de la contraseña "admin"
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash('admin', saltRounds);
    
    // Verificar si ya existe un usuario admin
    const existingAdmin = await runSingle(
      "SELECT id FROM users WHERE email = 'admin@agromax.com'"
    );
    
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador con email admin@agromax.com');
      console.log('ID del usuario existente:', existingAdmin.id);
      return;
    }
    
    // Crear el usuario administrador
    const userResult = await runExecute(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin@agromax.com', passwordHash, 'Admin', 'Sistema', 'super_admin', 1]
    );
    
    const userId = userResult.id;
    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('   ID:', userId);
    console.log('   Email: admin@agromax.com');
    console.log('   Nombre: Admin Sistema');
    console.log('   Rol: super_admin');
    
    // Crear el registro de administrador
    const adminResult = await runExecute(
      `INSERT INTO administrators (user_id, admin_level, can_manage_users, can_manage_establishments, can_view_reports) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'super_admin', 1, 1, 1]
    );
    
    console.log('✅ Registro de administrador creado:');
    console.log('   ID:', adminResult.id);
    console.log('   Nivel: super_admin');
    console.log('   Puede gestionar usuarios: true');
    console.log('   Puede gestionar establecimientos: true');
    console.log('   Puede ver reportes: true');
    
    console.log('\n🎉 Usuario administrador creado exitosamente!');
    console.log('📧 Email: admin@agromax.com');
    console.log('🔑 Contraseña: admin');
    console.log('🔐 Rol: Super Administrador');
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión por seguridad.');
    
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('📦 Database connection closed');
      }
    });
  }
}

// Ejecutar si este archivo se ejecuta directamente
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;