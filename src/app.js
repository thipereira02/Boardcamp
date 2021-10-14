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

app.post("/categories", async (req, res) => {
	try {
		const { name } = req.body;

		if (!name) return res.sendStatus(404);

		const categoriesAlreadyExists = await connection.query(`
			SELECT * 
			FROM categories 
			WHERE name=$1`
		,[name]);
		if (categoriesAlreadyExists.rows.length !== 0) return res.sendStatus(409);

		await connection.query(`
			INSERT INTO categories
			(name) VALUES ($1)
		`,[name]);

		return res.sendStatus(201);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.listen(4000, () => {
	console.log("Server listening on port 4000");
});