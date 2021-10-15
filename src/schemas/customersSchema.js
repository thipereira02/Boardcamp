import joi from "joi";

const insertCustomer = joi.object({
	name: joi.string().trim().required(),
	cpf: joi.string().pattern(/^[0-9]{11}$/).required(),
	phone: joi.string().pattern(/^[0-9]{10,11}$/).required(),
	birthday: joi.date().less("now").required()
});

export { insertCustomer };