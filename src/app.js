/* eslint-disable no-unused-vars */
import express from "express";
import cors from "cors";
import pg from "pg";

import { insertCategories } from "./schemas/categoriesSchema.js";
import { insertGame } from "./schemas/gamesSchema.js";
import { insertCustomer } from "./schemas/customersSchema.js";

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

		const isValid = insertCategories.validate({name});
		if (isValid.error !== undefined) return res.sendStatus(404);

		const categoriesAlreadyExists = await connection.query(`
			SELECT * 
			FROM categories 
			WHERE name=$1`
		,[name]);
		if (categoriesAlreadyExists.rowCount !== 0) return res.sendStatus(409);

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

app.get("/games", async (req, res) => {
	try {
		const { name } = req.query;
		let result;

		if (name) result = await connection.query(`
			SELECT games.*, categories.name 
			AS "categoryName"
			FROM games
			JOIN categories
			ON games."categoryId" = categories.id 
			WHERE games.name 
			ILIKE $1 || '%'`
		,[name]);
		else result = await connection.query(`
			SELECT games.*, categories.name 
			AS "categoryName"
			FROM games
			JOIN categories
			ON games."categoryId" = categories.id
		`);

		res.send(result.rows);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	} 
});

app.post("/games", async (req, res) => {
	try {
		const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

		const isValid = insertGame.validate({name, image, stockTotal, categoryId, pricePerDay});
		if (isValid.error !== undefined) return res.sendStatus(400);

		const categoryExists = await connection.query(`
			SELECT *
			FROM categories
			WHERE id=$1`
		,[categoryId]);
		if (categoryExists.rowCount === 0) return res.sendStatus(400);

		const gameExists = await connection.query(`
			SELECT * 
			FROM games
			WHERE name=$1`
		,[name]);
		if (gameExists.rowCount !== 0) return res.sendStatus(409);

		await connection.query(`
			INSERT INTO games
			(name, image, "stockTotal", "categoryId", "pricePerDay")
			VALUES ($1, $2, $3, $4, $5)`
		,[name, image, stockTotal, categoryId, pricePerDay]);

		return res.sendStatus(201);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.get("/customers", async (req, res) => {
	try {
		const result = await connection.query(`
			SELECT *
			FROM customers
		`);

		return res.send(result.rows);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.post("/customers", async (req, res) => {
	try {
		const { name, phone, cpf, birthday } = req.body;

		const isValid = insertCustomer.validate({name, phone, cpf, birthday});
		if (isValid.error !== undefined) return res.sendStatus(400);

		const cpfExists = await connection.query(`
			SELECT *
			FROM customers
			WHERE cpf = $1
		`,[cpf]);
		if (cpfExists.rowCount !== 0) return res.sendStatus(409);

		await connection.query(`
			INSERT INTO customers
			(name, phone, cpf, birthday)
			VALUES ($1, $2, $3, $4) 
		`,[name, phone, cpf, birthday]);

		return res.sendStatus(201);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.listen(4000, () => {
	console.log("Server listening on port 4000");
});