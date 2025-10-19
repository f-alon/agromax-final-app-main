// scripts/create_admin.js
const bcrypt = require('bcryptjs');
const { runExecute, runSingle } = require('../config/database');

async function createAdminUser() {
  try {
    console.log('Creando usuario administrador...');

    // Hash de la contrasena "admin"
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash('admin', saltRounds);

    // Verificar si ya existe un usuario admin
    const existingAdmin = await runSingle(
      "SELECT id FROM users WHERE email = 'admin@agromax.com'"
    );

    if (existingAdmin) {
      console.log('Ya existe un usuario administrador con email admin@agromax.com');
      console.log('ID del usuario existente:', existingAdmin.id);
      return;
    }

    // Crear el usuario administrador
    const userResult = await runExecute(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['admin@agromax.com', passwordHash, 'Admin', 'Sistema', 'super_admin', true]
    );

    const userId = userResult.rows[0]?.id;
    console.log('Usuario administrador creado exitosamente:');
    console.log('  ID:', userId);
    console.log('  Email: admin@agromax.com');
    console.log('  Nombre: Admin Sistema');
    console.log('  Rol: super_admin');

    // Crear el registro de administrador
    const adminResult = await runExecute(
      `INSERT INTO administrators (user_id, admin_level, can_manage_users, can_manage_establishments, can_view_reports) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, 'super_admin', true, true, true]
    );

    console.log('Registro de administrador creado:');
    console.log('  ID:', adminResult.rows[0]?.id);
    console.log('  Nivel: super_admin');
    console.log('  Puede gestionar usuarios: true');
    console.log('  Puede gestionar establecimientos: true');
    console.log('  Puede ver reportes: true');

    console.log('\nUsuario administrador creado exitosamente!');
    console.log('Email: admin@agromax.com');
    console.log('Contrasena: admin');
    console.log('Rol: Super Administrador');
    console.log('\nIMPORTANTE: Cambia la contrasena despues del primer inicio de sesion por seguridad.');

  } catch (error) {
    console.error('Error creando usuario administrador:', error);
    process.exit(1);
  }
}

// Ejecutar si este archivo se ejecuta directamente
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;
