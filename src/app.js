/* eslint-disable quotes */
/* eslint-disable no-unused-vars */
import express from "express";
import cors from "cors";
import pg from "pg";

import { insertCategories } from "./schemas/categoriesSchema.js";
import { insertGame } from "./schemas/gamesSchema.js";
import { insertCustomer } from "./schemas/customersSchema.js";
import { insertRental } from "./schemas/rentalsSchema.js";
import dayjs from "dayjs";

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
		const { cpf } = req.query;
		let result;

		if (cpf) result = await connection.query(`
			SELECT *
			FROM customers
			WHERE cpf
			LIKE $1 || '%' 	
		`,[cpf]);
		else result = await connection.query(`
			SELECT *
			FROM customers
		`);

		return res.send(result.rows);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.get("/customers/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const result = await connection.query(`
			SELECT *
			FROM customers
			WHERE id=$1
		`,[id]);
		if (result.rowCount === 0) return res.sendStatus(404);
		
		return res.send(result.rows[0]);
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

app.put("/customers/:id", async (req, res) => {
	try {
		const { name, phone, cpf, birthday } = req.body;
		const { id } = req.params;

		const idExists = await connection.query(`
			SELECT *
			FROM customers
			WHERE id=$1
		`,[id]);
		if (idExists.rowCount === 0) return res.sendStatus(404);

		const isValid = insertCustomer.validate({name, phone, cpf, birthday});
		if (isValid.error !== undefined) return res.sendStatus(400);

		const cpfExists = await connection.query(`
			SELECT *
			FROM customers
			WHERE cpf LIKE $1
			AND id <> $2
		`,[cpf, id]);
		if (cpfExists.rowCount !== 0) return res.sendStatus(409);

		await connection.query(`
			UPDATE customers
			SET name=$1, phone=$2, cpf=$3, birthday=$4
			WHERE id=$5
		`,[name, phone, cpf, birthday, id]);

		return res.sendStatus(200);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.get("/rentals", async (req, res) => {
	try {
		const { customerId, gameId } = req.query;
		const queryExists = !!customerId || !!gameId;
		let querySetting = "";
		let argument = [];

		if (queryExists){
			if(customerId && gameId) {
				querySetting = ` WHERE rentals."gameId" = $1 AND rentals."customerId" = $2`;
				argument = [gameId, customerId];
			} else if(customerId) {
				querySetting = ` WHERE rentals."customerId" = $1`;
				argument = [customerId];
			} else {            
				querySetting = ` WHERE rentals."gameId" = $1`;
				argument = [gameId];
			}
		}	

		const initialResult = await connection.query(`
				SELECT rentals.* , 
				customers.name AS "customerName", 
				games.name AS "gameName", 
				games."categoryId", 
				categories.name AS "categoryName"
				FROM rentals 
				JOIN customers 
				ON customers.id = rentals."customerId"        
				JOIN games 
				ON rentals."gameId" = games.id   
				JOIN categories  
				ON games."categoryId" = categories.id
				${querySetting}
			`, argument);

		const finalResult = initialResult.rows.map(i => {
			return({
				id: i.id,
				customerId: i.customerId,
				gameId: i.gameId,
				rentDate: i.rentDate,
				daysRented: i.daysRented,
				returnDate: i.returnDate,
				originalPrice: i.originalPrice,
				delayFee: i.delayFee,
				customer: {
					id: i.customerId,
					name: i.customerName
				},
				game: {
					id: i.gameId,
					name: i.gameName,
					categoryId: i.categoryId,
					categoryName: i.categoryName
				}
			});
		});
		res.send(finalResult);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
	
});

app.post("/rentals", async (req, res) => {
	try {
		const { customerId, gameId, daysRented } = req.body;

		const isValid = insertRental.validate({customerId, gameId, daysRented});
		if (isValid.error !== undefined) return res.sendStatus(400);
		
		const gameExists = await connection.query(`
			SELECT *
			FROM games
			WHERE id=$1
		`,[gameId]);
		if (gameExists.rowCount === 0) return res.sendStatus(400);

		const customerExists = await connection.query(`
			SELECT *
			FROM customers
			WHERE id=$1
		`,[customerId]);
		if (customerExists.rowCount === 0) return res.sendStatus(400);

		const gameAvailable = await connection.query(`
			SELECT *
			FROM rentals
			WHERE "gameId"=$1
			AND "returnDate" IS NULL
		`,[gameId]);

		if (gameAvailable.rowCount >= gameExists.rows[0].stockTotal) return res.sendStatus(400);

		const originalPrice = daysRented * gameExists.rows[0].pricePerDay;

		await connection.query(`
            INSERT INTO rentals
            ("customerId", "gameId", "rentDate", "daysRented", "originalPrice", "returnDate", "delayFee")
            VALUES ($1, $2, NOW(), $3, $4, NULL, NULL)
        `, [customerId, gameId, daysRented, originalPrice]);

		return res.sendStatus(201);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.post("/rentals/:id/return", async (req, res) => {
	try {
		const { id } = req.params;

		const rentalExists = await connection.query(`
			SELECT *
			FROM rentals
			WHERE id=$1
		`,[id]);
		if (rentalExists.rowCount === 0) return res.sendStatus(404);
		if (rentalExists.rows[0].returnDate !== null) return res.sendStatus(400);

		const rental = await connection.query(`
			SELECT rentals,*, games."pricePerDay"
			FROM rentals
			JOIN games
			ON rentals."gameId" = games.id
			WHERE rentals.id=$1
		`,[id]);

		const {pricePerDay, daysRented, rentDate} = rental.rows[0];
		let {delayFee} = rental.rows[0];
		const today = dayjs();
		const rentalDuration = today.diff(rentDate, "day");
		const delayedDays = rentalDuration - daysRented;

		if (daysRented < rentalDuration) delayFee = pricePerDay * delayedDays;

		await connection.query(`
			UPDATE rentals
			SET "returnDate" = NOW(),
			"delayFee"=$1
			WHERE id=$2
		`,[delayFee, id]);

		return res.sendStatus(200);
	} catch(e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.listen(4000, () => {
	console.log("Server listening on port 4000");
});