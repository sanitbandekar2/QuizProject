const Joi = require("joi");

const authSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(2).required(),
});

const quizNameSchema = Joi.object({
  qname: Joi.string().lowercase().required(),
  department: Joi.string().lowercase().required(),
});
const questionSchema = Joi.object({
  quiz_id: Joi.string().lowercase().trim().required(),
  q: Joi.string().lowercase().required(),
  department: Joi.string().lowercase().required(),
  answer: Joi.number().required(),
  option: Joi.array().required(),
});

module.exports = { authSchema, quizNameSchema, questionSchema };
