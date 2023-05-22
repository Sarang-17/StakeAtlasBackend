const joi = require('joi');

const addProductSchema = joi.object().keys({
  title: joi.string().required(),
  category: joi.string().required(),
  description: joi.string().required(),
  listing_duration: joi.number().required(),
  longitude: joi.number().optional(),
  latitude: joi.number().optional(),
  loc: joi
    .object()
    .keys({
      type: joi.string().required(),
      coordinates: joi.array().items(joi.number()).required(),
      formattedAddress: joi.string().required(),
    })
    .optional(),
  product_address: joi
    .object()
    .keys({
      address_line1: joi.string().required(),
      state: joi.string().required(),
      city: joi.string().required(),
      zipcode: joi.number().required(),
      landmark: joi.string().required(),
    })
    .required(),
  condition: joi.string().required(),
  make_offer: joi.bool().optional(),
  specification: joi
    .alternatives()
    .conditional('category', [
      {
        is: '63a83254b4f894d9e4f011b6', // Phone
        then: joi.object().keys({
          brand: joi.string().required(),
          purchase_country: joi.string().required(),
          model: joi.string().required(),
          purchase_proof: joi.string().optional(),
          storage: joi.string().required(),
          imei: joi.string().required(),
          color: joi.string().required(),
        }),
      },
      {
        is: '63a831d04708e6c116261a5c' || '63a831db4708e6c116261a5f', // cars
        then: joi.object().keys({
          make: joi.string().required(),
          fuel: joi.string().required(),
          model: joi.string().required(),
          transmission: joi.string().required(),
          trim: joi.string().required(),
          number_owners: joi.number().required(),
          chassis: joi.string().required(),
          km_run: joi.number().required(),
        }),
      },
      {
        is: '63ab27f646838e0934ea7467', // laptop
        then: joi.object().keys({
          brand: joi.string().required(),
          purchase_country: joi.string().required(),
          model: joi.string().required(),
          purchase_proof: joi.string().required(),
          storage: joi.string().required(),
          serial: joi.string().required(),
          ram: joi.string().required(),
          gpu: joi.string().required(),
        }),
        otherwise: joi.forbidden(),
      },
    ])
    .required(),
  enable_shipping: joi.bool().required(),
  accept_returns: joi.bool().optional(),
  tags: joi.array().items(joi.string()).optional(),
  cost: joi.number().required(),
  qty: joi.number().optional(),
  used: joi.bool().optional(),
  country_of_origin: joi.string().optional(),
  status: joi
    .object()
    .keys({
      state: joi.string().required(),
      comments: joi.string().optional(),
    })
    .optional(),
  seller: joi.string().required(),
});

const updateProductSchema = joi.object().keys({
  _id: joi.string().required(),
  title: joi.string().optional(),
  category: joi.string().optional(),
  description: joi.string().optional(),
  condition: joi.string().optional(),
  make_offer: joi.bool().optional(),
  specification: joi.alternatives().conditional('category', [
    {
      is: '63a83254b4f894d9e4f011b6', // Phone
      then: joi.object().keys({
        brand: joi.string().optional(),
        purchase_country: joi.string().optional(),
        model: joi.string().optional(),
        purchase_proof: joi.string().optional(),
        storage: joi.string().optional(),
        imei: joi.string().optional(),
        color: joi.string().optional(),
      }),
    },
    {
      is: '63a831d04708e6c116261a5c' || '63a831db4708e6c116261a5f', // cars
      then: joi.object().keys({
        make: joi.string().optional(),
        fuel: joi.string().optional(),
        model: joi.string().optional(),
        transmission: joi.string().optional(),
        trim: joi.string().optional(),
        number_owners: joi.number().optional(),
        chassis: joi.string().optional(),
        km_run: joi.number().optional(),
      }),
    },
    {
      is: '63ab27f646838e0934ea7467', // laptop
      then: joi.object().keys({
        brand: joi.string().optional(),
        purchase_country: joi.string().optional(),
        model: joi.string().optional(),
        purchase_proof: joi.string().optional(),
        storage: joi.string().optional(),
        serial: joi.string().optional(),
        ram: joi.string().optional(),
        gpu: joi.string().optional(),
      }),
      otherwise: joi.forbidden(),
    },
  ]),
  tags: joi.array().items(joi.string()).optional(),
  cost: joi.number().optional(),
  qty: joi.number().optional(),
  used: joi.bool().optional(),
  country_of_origin: joi.string().optional(),
  status: joi
    .object()
    .keys({
      state: joi.string().required(),
      comments: joi.string().optional(),
    })
    .optional(),
  longitude: joi.number().optional(),
  latitude: joi.number().optional(),
  loc: joi
    .object()
    .keys({
      type: joi.string().required(),
      coordinates: joi.array().items(joi.number()).required(),
      formattedAddress: joi.string().required(),
    })
    .optional(),
  product_address: joi
    .object()
    .keys({
      address_line1: joi.string().required(),
      state: joi.string().required(),
      city: joi.string().required(),
      zipcode: joi.number().required(),
      landmark: joi.string().required(),
    })
    .optional(),
});

const findByLocationSchema = joi.object().keys({
  longitude: joi.number().required(),
  latitude: joi.number().required(),
  distance: joi.number().required(),
  unit: joi.string().required(),
});

module.exports = {
  addProductSchema,
  updateProductSchema,
  findByLocationSchema,
};
