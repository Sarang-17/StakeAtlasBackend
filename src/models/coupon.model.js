const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: String,
    value: Number,
    qty: Number,
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
