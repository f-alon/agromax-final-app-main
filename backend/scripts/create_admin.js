// backend/scripts/create_admin.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { runSingle, runExecute } = require('../config/database');

(async () => {
  try {
    console.log('Creando usuario administrador...');

    const email = process.env.ADMIN_EMAIL || 'admin@agromax.com';
    const plain = process.env.ADMIN_PASSWORD || 'admin';
    const role  = process.env.ADMIN_ROLE  || 'super_admin';

    // ¿Ya existe?
    const exists = await runSingle('SELECT id FROM users WHERE email = $1', [email]);
    if (exists) {
      console.log(`⚠️  Ya existe un usuario con email ${email} (id=${exists.id})`);
      process.exit(0);
    }

    // Detectar columnas disponibles en users
    const cols = await runQuery(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
    `);

    const names = new Set(cols.map(c => c.column_name));

    // Campos mínimos
    const fields = ['email', 'password_hash', 'role', 'is_active', 'created_at'];
    const values = [email, await bcrypt.hash(plain, 12), role, true];
    let placeholders = ['$1', '$2', '$3', '$4', 'CURRENT_TIMESTAMP'];

    // Agregar opcionales si existen
    if (names.has('first_name')) {
      fields.splice(2, 0, 'first_name'); // antes de role
      values.splice(2, 0, 'Admin');
      placeholders.splice(2, 0, `$${values.length}`); // se recalcula abajo por seguridad
    }
    if (names.has('last_name')) {
      const pos = fields.indexOf('first_name') + 1 || 2;
      fields.splice(pos, 0, 'last_name');
      values.splice(pos, 0, 'Principal');
      placeholders.splice(pos, 0, `$${values.length}`);
    }
    if (names.has('phone')) {
      const pos = fields.indexOf('last_name') + 1 || fields.indexOf('role');
      fields.splice(pos, 0, 'phone');
      values.splice(pos, 0, null);
      placeholders.splice(pos, 0, `$${values.length}`);
    }

    // Recalcular placeholders $1..$N según cantidad final de values (excepto CURRENT_TIMESTAMP)
    let pIndex = 0;
    placeholders = fields.map(f => {
      if (f === 'created_at') return 'CURRENT_TIMESTAMP';
      pIndex += 1;
      return `$${pIndex}`;
    });

    const sql = `
      INSERT INTO users (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING id
    `;
    const ins = await runExecute(sql, values);
    const userId = ins.rows[0].id;

    // Tabla administrators si existe
    const hasAdmins = await runSingle(
      `SELECT COUNT(*)::int AS c
         FROM information_schema.tables
        WHERE table_schema='public' AND table_name='administrators'`
    );

    if (hasAdmins && hasAdmins.c > 0) {
      await runExecute(
        `INSERT INTO administrators (user_id, admin_level, can_manage_users, can_manage_establishments, can_view_reports)
         VALUES ($1, $2, TRUE, TRUE, TRUE)
         ON CONFLICT (user_id) DO UPDATE SET admin_level = EXCLUDED.admin_level`,
        [userId, role]
      );
    }

    console.log(`✅ Admin creado: ${email} (id=${userId})`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creando usuario administrador:', err);
    process.exit(1);
  }
})();

// helper pequeño porque este archivo usa runQuery y arriba sólo importamos runSingle/runExecute
async function runQuery(sql, params = []) {
  const { runQuery } = require('../config/database');
  return runQuery(sql, params);
}
