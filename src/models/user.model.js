const mongoose = require('mongoose');
const { SELLER_REQUEST, USER_ROLE } = require('../utils/enums');
require('dotenv').config();

const UserSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      maxlength: [20, 'First name'],
    },
    last_name: {
      type: String,
      maxlength: [20, 'Last name'],
    },
    username: {
      type: String,
      maxlength: [20, 'Username'],
    },
    phone: {
      type: String,
      unique: true,
      required: true,
      maxlength: [10, 'Please enter a 10 digit Phone Number'],
      minlength: [10, 'Please enter a 10 digit Phone Number'],
    },
    email: {
      type: String,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid Email Address'],
    },
    password: {
      type: String,
      minlenght: 8,
      select: false,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    two_factor_session_id: {
      type: String,
    },
    photo: String,
    cart: {
      items: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
          },
          qty: Number,
          price: Number,
        },
      ],
      total_qty: { type: Number, default: 0 },
      total_price: { type: Number, default: 0 },
      discounted_price: { type: Number },
      coupon_applied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
      },
    },
    loc: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
        index: '2dsphere',
      },
      formattedAddress: String,
    },
    addresses: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Address',
    },
    seller_type: {
      type: String,
      enum: ['individual', 'store'],
    },
    store_address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    seller_address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    role: {
      type: String,
      enum: [USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.ADMIN],
      default: USER_ROLE.CUSTOMER,
    },
    government_id: {
      id_image: String,
      id_number: String,
      id_type: String,
      comments: {
        type: String,
        default: 'Pending',
      },
    },
    seller_verified: {
      type: Boolean,
      default: false,
    },
    seller_request: {
      type: String,
      default: SELLER_REQUEST.NOT_CREATED,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    phone_verified: {
      type: Boolean,
      default: false,
    },
    black_list: {
      is_blackListed: {
        type: Boolean,
        default: false,
      },
      reason: String,
    },
    avg_rating: {
      type: Number,
      default: 0,
    },
    wishlist: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Wishlist',
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  }
);

const User = mongoose.model('User', UserSchema);
module.exports = User;
