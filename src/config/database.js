import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'pesantren',
  password: process.env.DB_PASSWORD || 'Jazman@271998',
  database: process.env.DB_NAME || 'pesantren',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
