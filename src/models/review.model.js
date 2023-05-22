const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewType: {
      type: String,
      enum: ['seller', 'customer'],
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // #start Common for Both
    communication: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    // #end
    // #start For Buyer rating
    on_time_payment: {
      type: Number,
      min: 1,
      max: 5,
    },
    // #end
    // #start Seller rating
    on_time_shipment: {
      type: Number,
      min: 1,
      max: 5,
    },
    item_as_described: {
      type: Number,
      min: 1,
      max: 5,
    },
    commitment_after_sale: {
      type: Number,
      min: 1,
      max: 5,
    },
    // #end
    title: String,
    review: String,
    overall_rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
