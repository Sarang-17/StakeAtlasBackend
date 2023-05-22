const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    min_offer_amount: [
      {
        amount: Number,
        by: String,
      },
    ],
    status: {
      type: String,
      default: 'Open',
      enum: ['Open', 'Closed', 'Accepted', 'Rejected'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  {
    timestamps: true,
  }
);

const MakeOffer = mongoose.model('MakeOffer', offerSchema);
module.exports = MakeOffer;
