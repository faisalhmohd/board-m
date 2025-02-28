import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "mysql-db",
  port: 3306,
  user: "user",
  password: "password",
  database: "board_db",
});

const initDB = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query("CREATE DATABASE IF NOT EXISTS board_db");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parentBoardId VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parentBoardId) REFERENCES boards(id)
      )
    `);

    console.log("Tables 'board_db' and 'boards' are ready.");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    connection.release();
  }
};


export {
  pool,
  initDB,
};