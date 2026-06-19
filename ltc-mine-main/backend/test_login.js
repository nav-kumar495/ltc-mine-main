require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'ltc_db',
  password: process.env.DB_PASSWORD || 'root',
  port: parseInt(process.env.DB_PORT || '5432'),
};

const pool = new Pool(poolConfig);

async function test() {
  try {
    const email = 'admin@ltc.edu';
    console.log('Testing query for email:', email);
    const userQuery = await pool.query(
      `SELECT u.*, 
              (CASE 
                WHEN u.role = 'student' THEN (
                  SELECT bs.squad FROM batch_students bs
                  JOIN batches b ON bs.batch_id = b.id
                  WHERE bs.student_id = u.id AND (b.is_deleted = false OR b.is_deleted IS NULL)
                  ORDER BY bs.batch_id DESC LIMIT 1
                )
                WHEN u.role = 'faculty' THEN (
                  SELECT bf.squad FROM batch_faculty bf
                  JOIN batches b ON bf.batch_id = b.id
                  WHERE bf.faculty_id = u.id AND (b.is_deleted = false OR b.is_deleted IS NULL)
                  ORDER BY bf.batch_id DESC LIMIT 1
                )
                ELSE NULL
              END) as batch_squad
       FROM users u
       WHERE u.email = $1`,
      [email]
    );
    console.log('Query success! Row count:', userQuery.rowCount);
    console.log('User data:', userQuery.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Query failed with error:');
    console.error(err);
    process.exit(1);
  }
}

test();
