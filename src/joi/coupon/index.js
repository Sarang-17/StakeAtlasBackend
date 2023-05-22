const joi = require('joi');

const createCouponSchema = joi.object().keys({
  code: joi.string().required(),
  value: joi.number().required(),
  qty: joi.number().required(),
});

const updateCouponSchema = joi.object().keys({
  _id: joi.string().required(),
  code: joi.string().optional(),
  value: joi.number().optional(),
  qty: joi.number().optional(),
});

module.exports = {
  createCouponSchema,
  updateCouponSchema,
};
