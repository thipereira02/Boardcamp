/* eslint-disable no-unused-vars */
import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();

app.use(cors());
app.use(express.json());

const database = {
	user: "bootcamp_role",
	password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
	host: "localhost",
	port: 5432,
	database: "boardcamp"
};

const { Pool } = pg;
const connection = new Pool(database);

app.get("/categories", async (req, res) => {
	try {
		const result = await connection.query("SELECT * FROM categories");
		return res.send(result.rows);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.listen(4000, () => {
	console.log("Server listening on port 4000");
});