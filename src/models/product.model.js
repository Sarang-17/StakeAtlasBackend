const mongoose = require('mongoose');
const { PRODUCT_STATUS, PRODUCT_CONDITION } = require('../utils/enums');

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than of 50 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    description: {
      type: String,
      required: [true, 'please add a description'],
      trim: true,
      maxlength: [500, 'Description cannot be more than of 500 characters'],
    },
    condition: {
      type: String,
      required: true,
      enum: [
        PRODUCT_CONDITION.NEW,
        PRODUCT_CONDITION.USED,
        PRODUCT_CONDITION.FOR_PARTS,
      ],
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
    product_address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    // TODO: Change to expiry date
    listing_duration: {
      type: Number,
      required: true,
    },
    specification: {
      type: Object,
    },
    enable_shipping: {
      type: Boolean,
      default: false,
    },
    accept_returns: {
      type: Boolean,
      default: false,
    },
    hot_deal: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
    },
    cost: {
      type: Number,
      required: [true, 'Please add price'],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      trim: true,
    },
    images: {
      type: [String],
    },
    make_offer: {
      type: Boolean,
      default: false,
    },
    min_offer_amt: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'MakeOffer',
    },
    status: {
      state: {
        type: String,
        default: PRODUCT_STATUS.WAITING_FOR_APPROVAL,
        enum: [
          PRODUCT_STATUS.WAITING_FOR_APPROVAL,
          PRODUCT_STATUS.REJECTED,
          PRODUCT_STATUS.ACTIVE,
          PRODUCT_STATUS.SOLD,
        ],
      },
      comments: String,
    },
    average_rating: {
      type: Number,
      min: [1, 'Min rating is atleast one'],
      max: [5, 'Max rating is atmost five'],
    },
    reviews: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Review',
    },
    country_of_origin: {
      type: String,
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

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
