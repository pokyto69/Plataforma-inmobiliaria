import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const initSqlPath = path.resolve(__dirname, 'init.sql');

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
}

export const query = async (text, params) => {
  if (!pool) {
    throw new Error('Database connection is not configured.');
  }
  return pool.query(text, params);
};

export const isDbConnected = () => {
  return pool !== null;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const initDb = async (retries = 8, delayMs = 2500) => {
  if (!pool) {
    console.log('No database connection configured (DATABASE_URL missing).');
    return;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      try {
        console.log('Database connected successfully. Initializing schema...');
        const sql = fs.readFileSync(initSqlPath, 'utf8');
        await client.query(sql);
        console.log('Schema initialized successfully.');
        return; // Exito
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn(`Attempt ${i + 1}/${retries} to connect to database failed: ${err.message}`);
      if (i < retries - 1) {
        console.log(`Waiting ${delayMs}ms before retrying...`);
        await delay(delayMs);
      } else {
        console.error('All database connection attempts failed.');
        throw err;
      }
    }
  }
};
