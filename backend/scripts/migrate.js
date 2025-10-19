// scripts/migrate.js
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigration() {
  const schemaPath = path.join(__dirname, 'schema_postgres.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`No se encontro el archivo de esquema en ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('Ejecutando migracion de esquema principal...');
    await client.query(schemaSql);
    console.log('Migracion completada correctamente.');
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Migracion ejecutada sin errores.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error al ejecutar la migracion:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
