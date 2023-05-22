const joi = require('joi');

const createAddressSchema = joi.object().keys({
  user: joi.string().required(),
  name: joi.string().required(),
  phone: joi.string().required(),
  address_line1: joi.string().required(),
  address_line2: joi.string().optional(),
  city: joi.string().required(),
  state: joi.string().required(),
  zipcode: joi.number().required(),
  primary: joi.bool().optional(),
  address_type: joi.string().required(),
});

const updateAddressSchema = joi.object().keys({
  id: joi.string().required(),
  name: joi.string().optional(),
  phone: joi.string().optional(),
  address_line1: joi.string().optional(),
  address_line2: joi.string().optional(),
  city: joi.string().optional(),
  state: joi.string().optional(),
  zipcode: joi.number().optional(),
  primary: joi.bool().optional(),
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
};
