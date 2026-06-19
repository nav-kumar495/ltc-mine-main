const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/navneet/Desktop/ltc-mine-main/ltc-mine-main/backend/.env' });

const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'ltc_db',
  password: process.env.DB_PASSWORD || 'root',
  port: parseInt(process.env.DB_PORT || '5432'),
};

const pool = new Pool(poolConfig);

async function migrate() {
  const oldToNew = {
    'Chandra': 'Aditya',
    'Mangal':  'Ravi',
    'Budh':    'Divakar',
    'Guru':    'Mitra',
    'Shukra':  'Martand',
    'Shani':   'Dinkar',
    'Rahu':    'Prabhakar',
    'Ketu':    'Bhaskar',
    'Agni':    'Tejonidhi',
  };

  try {
    console.log('Starting squad migration...');
    let totalUpdated = 0;
    for (const [oldName, newName] of Object.entries(oldToNew)) {
      const r1 = await pool.query('UPDATE batch_students SET squad = $1 WHERE squad = $2', [newName, oldName]);
      const r2 = await pool.query('UPDATE batch_faculty SET squad = $1 WHERE squad = $2', [newName, oldName]);
      const r3 = await pool.query('UPDATE users SET squad = $1 WHERE squad = $2', [newName, oldName]);
      const count = r1.rowCount + r2.rowCount + r3.rowCount;
      totalUpdated += count;
      if (count > 0) {
        console.log(`${oldName} -> ${newName}: ${count} rows updated`);
      }
    }
    console.log('Total rows migrated:', totalUpdated);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
