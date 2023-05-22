const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    products: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Product',
    },
  },
  {
    timestamps: true,
  }
);

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
