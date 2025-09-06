// scripts/migrate.js
const fs = require('fs');
const path = require('path');
const { db, runQuery, runExecute } = require('../config/database');

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');

    // Read migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files`);

    // Create migrations table to track executed migrations
    await runExecute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get already executed migrations
    const executedMigrations = await runQuery('SELECT filename FROM migrations');
    const executedFilenames = executedMigrations.map(m => m.filename);

    // Execute each migration
    for (const filename of migrationFiles) {
      if (executedFilenames.includes(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }

      console.log(`📝 Executing migration: ${filename}`);
      
      const migrationPath = path.join(migrationsDir, filename);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute the entire migration as one statement
      // This handles triggers and complex SQL better
      try {
        await runExecute(migrationSQL);
      } catch (error) {
        console.error(`Error executing migration ${filename}:`, error.message);
        throw error;
      }

      // Record migration as executed
      await runExecute('INSERT INTO migrations (filename) VALUES (?)', [filename]);
      console.log(`✅ Migration ${filename} executed successfully`);
    }

    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
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

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };