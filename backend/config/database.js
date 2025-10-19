// backend/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

/**
 * SSL:
 * - Si usa Render Postgres con Internal URL: normalmente NO hace falta SSL (false).
 * - Si usa Neon u otro proveedor externo: poné PGSSLMODE=require en las env vars
 *   y esto activará SSL con rejectUnauthorized: false.
 */
const shouldUseSsl =
  (process.env.PGSSLMODE || '').toLowerCase() === 'require' ||
  process.env.DATABASE_URL.includes('neon.tech');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false
});

/**
 * Equivalentes a helpers de SQLite:
 * - runQuery: devuelve TODAS las filas (rows)
 * - runSingle: devuelve UNA fila (o null)
 * - runExecute: devuelve { rowCount, rows } (usá RETURNING en INSERT/UPDATE para obtener ids)
 */

const prepareSql = (sql = '') => {
  if (typeof sql !== 'string') return sql;

  let transformed = sql;

  // Replace boolean literals (common column prefixes)
  transformed = transformed.replace(
    /\b(is_[a-z0-9_]+|can_[a-z0-9_]+)\s*=\s*1\b/gi,
    (_, column) => `${column} = TRUE`
  );

  transformed = transformed.replace(
    /\b(is_[a-z0-9_]+|can_[a-z0-9_]+)\s*=\s*0\b/gi,
    (_, column) => `${column} = FALSE`
  );

  // Convert SQLite-style placeholders (?) to PostgreSQL-style ($1, $2, ...)
  if (transformed.includes('?')) {
    let index = 0;
    transformed = transformed.replace(/\?/g, () => `$${++index}`);
  }

  // Ensure boolean comparisons cast parameters correctly
  transformed = transformed.replace(
    /\b(is_[a-z0-9_]+|can_[a-z0-9_]+)\s*=\s*(\$\d+)/gi,
    (_, column, placeholder) => `${column} = ${placeholder}::BOOLEAN`
  );

  return transformed;
};

const runQuery = async (sql, params = []) => {
  const text = prepareSql(sql);
  const { rows } = await pool.query(text, params);
  return rows; // array
};

const runSingle = async (sql, params = []) => {
  const text = prepareSql(sql);
  const { rows } = await pool.query(text, params);
  return rows[0] ?? null;
};

const runExecute = async (sql, params = []) => {
  const text = prepareSql(sql);
  const res = await pool.query(text, params);
  return { rowCount: res.rowCount, rows: res.rows };
};

module.exports = {
  pool,
  runQuery,
  runSingle,
  runExecute
};
