const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    brand_name: {
      type: String,
      required: true,
    },
    brand_country: {
      type: String,
    },
    brand_image: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  },
  {
    timestamps: true,
  }
);

const Brand = mongoose.model('Brand', brandSchema);
module.exports = Brand;
