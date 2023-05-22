const joi = require('joi');

const createCategorySchema = joi.object().keys({
  name: joi.string().required(),
  description: joi.string().required(),
});

const updateCategorySchema = joi.object().keys({
  _id: joi.string().required(),
  name: joi.string().required(),
  description: joi.string().required(),
});

const createSubCategorySchema = joi.object().keys({
  name: joi.string().required(),
  description: joi.string().required(),
});

const updateSubCategorySchema = joi.object().keys({
  _id: joi.string().required(),
  name: joi.string().required(),
  description: joi.string().required(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  createSubCategorySchema,
  updateSubCategorySchema,
};
