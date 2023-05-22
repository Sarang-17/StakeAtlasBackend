const joi = require('joi');

const registerSchema = joi.object().keys({
  first_name: joi.string().required(),
  last_name: joi.string().required(),
  phone: joi.string().required(),
  email: joi.string().required(),
  username: joi.string().required(),
  password: joi.string().required(),
  otp: joi.number().required(),
});

const loginSchema = joi.object().keys({
  phone: joi.string().optional(),
  email: joi.string().optional(),
  username: joi.string().optional(),
  password: joi.string().required(),
});

const updateSchema = joi.object().keys({
  new_password: joi.string().optional(),
  current_password: joi.string().optional(),
  first_name: joi.string().optional(),
  last_name: joi.string().optional(),
  phone: joi.string().optional(),
  email: joi.string().optional(),
  username: joi.string().optional(),
  password: joi.string().optional(),
  gender: joi.string().optional(),
  password: joi.string().optional(),
});

const sellerRequestSchema = joi.object().keys({
  seller_type: joi.string().required(),
  longitude: joi.number().required(),
  store_address: joi.when('seller_type', {
    is: 'store',
    then: joi
      .object()
      .keys({
        name: joi.string().required(),
        address_line1: joi.string().required(),
        city: joi.string().optional(),
        state: joi.string().optional(),
        zipcode: joi.number().optional(),
        registered_owner: joi.string().required(),
      })
      .required(),
    otherwise: joi.forbidden(),
  }),
  government_id: joi
    .object()
    .keys({
      id_number: joi.string().optional(),
      id_type: joi.string().optional(),
      id_image: joi.string().optional(),
    })
    .required(),
  seller_address: joi
    .object()
    .keys({
      address_line1: joi.string().required(),
      state: joi.string().required(),
      city: joi.string().required(),
      zipcode: joi.number().required(),
      landmark: joi.string().required(),
    })
    .required(),
  latitude: joi.number().required(),
  loc: joi
    .object()
    .keys({
      type: joi.string().required(),
      coordinates: joi.array().items(joi.number()).required(),
      formattedAddress: joi.string().required(),
    })
    .required(),
});

const checkAccountSchema = joi.object().keys({
  phone: joi.string().optional(),
  email: joi.string().optional(),
  username: joi.string().optional(),
});

const findByLocationSchema = joi.object().keys({
  longitude: joi.number().required(),
  latitude: joi.number().required(),
  distance: joi.number().required(),
  unit: joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateSchema,
  checkAccountSchema,
  sellerRequestSchema,
  findByLocationSchema,
};
