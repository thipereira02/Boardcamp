import joi from "joi";

const insertGame = joi.object({
	name: joi.string().trim().required(),
	stockTotal: joi.number().min(1).required(),
	pricePerDay: joi.number().min(1).required(),
	categoryId: joi.number().min(1).required(),
	image: joi.string().pattern(new RegExp("^(http|https)://"))
});

export { insertGame };