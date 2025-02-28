import mysql from 'mysql2/promise';

let pool: mysql.Pool;

beforeAll(async () => {
  pool = await mysql.createPool({
    host: "mysql",
    user: "user",
    password: "password",
    database: "board_db",
  });
  // @ts-ignore - TODO: Fix this
  global.pool = pool;
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE boards');
});

afterAll(async () => {
  await pool.end();
});