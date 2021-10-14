import joi from "joi";

const insertCategories = joi.object({
	name: joi.string().trim().required()
});

export { insertCategories };