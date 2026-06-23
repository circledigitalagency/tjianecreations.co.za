import mysql from "mysql2/promise";

const pool = mysql.createPool({
	host: process.env.DB_HOST ?? "localhost",
	user: process.env.DB_USER ?? "tjiane_user",
	password: process.env.DB_PASSWORD ?? "your_password",
	database: process.env.DB_NAME ?? "tjiane_creations",
	waitForConnections: true,
	connectionLimit: 10,
});

export { pool };
