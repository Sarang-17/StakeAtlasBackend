const mongoose = require('mongoose');
const { ADDRESS_TYPE } = require('../utils/enums');

const addressSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    address_line1: String,
    address_line2: String,
    city: String,
    state: String,
    zipcode: Number,
    landmark: String,
    registered_owner: String,
    address_type: {
      type: String,
      enum: [
        ADDRESS_TYPE.STORE_ADDRESS,
        ADDRESS_TYPE.SELLER_ADDRESS,
        ADDRESS_TYPE.BUYER_ADDRESS,
        ADDRESS_TYPE.PRODUCT_ADDRESS,
      ],
    },
    primary: { type: Boolean, default: false },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
