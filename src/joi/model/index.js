const joi = require('joi');

const createModelSchema = joi.object().keys({
  model_name: joi.string().required(),
  brand: joi.string().required(),
  // specification: joi
  //   .alternatives()
  //   .conditional('category', [
  //     {
  //       is: '639fe11b5ad073f9f4ea63a2', // Phone
  //       then: joi.object().keys({
  //         storage: joi.array().required(),
  //         colors: joi.array().required(),
  //       }),
  //     },
  //     {
  //       is: '639fe0f15ad073f9f4ea6399', //laptop
  //       then: joi.object().keys({
  //         storage: joi.array().required(),
  //         ram: joi.array().required(),
  //         gpu: joi.array().required(),
  //       }),
  //     },
  //     {
  //       is: '639fe0d37320b4f392aee6e1', //cars
  //       then: joi.object().keys({
  //         trim: joi.array().required(),
  //         fuel: joi.array().required(),
  //         transmission: joi.array().required(),
  //       }),
  //       otherwise: joi.forbidden(),
  //     },
  //   ])
  //   .required(),
});

const updateModelSchema = joi.object().keys({
  _id: joi.string().required(),
  model_name: joi.string().optional(),
  // specification: joi.alternatives().conditional('category', [
  //   {
  //     is: '639fe11b5ad073f9f4ea63a2', // Phone
  //     then: joi.object().keys({
  //       storage: joi.array().optional(),
  //       colors: joi.array().optional(),
  //     }),
  //   },
  //   {
  //     is: '639fe0f15ad073f9f4ea6399', //laptop
  //     then: joi.object().keys({
  //       storage: joi.array().optional(),
  //       ram: joi.array().optional(),
  //       gpu: joi.array().optional(),
  //     }),
  //   },
  //   {
  //     is: '639fe0d37320b4f392aee6e1', //cars
  //     then: joi.object().keys({
  //       trim: joi.array().optional(),
  //       fuel: joi.array().optional(),
  //       transmission: joi.array().optional(),
  //     }),
  //     otherwise: joi.forbidden(),
  //   },
  // ]),
});

const addSpecificationSchema = joi.object().keys({
  modelId: joi.string().required(),
  specification: joi
    .object()
    .keys({
      storage: joi.array().optional(),
      colors: joi.array().optional(),
      ram: joi.array().optional(),
      gpu: joi.array().optional(),
      trim: joi.array().optional(),
      fuel: joi.array().optional(),
      transmission: joi.array().optional(),
      purchase_proof: joi.array().optional(),
    })
    .required(),
});

module.exports = {
  createModelSchema,
  updateModelSchema,
  addSpecificationSchema,
};
