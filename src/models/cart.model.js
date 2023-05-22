const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
