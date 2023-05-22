const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema(
  {
    model_name: {
      type: String,
      required: true,
    },
    model_image: String,
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
    },
    specification: {
      storage: [String],
      colors: [String],
      ram: [String],
      gpu: [String],
      trim: [String],
      fuel: [String],
      transmission: [String],
      purchase_proof: [String],
    },
  },
  {
    timestamps: true,
  }
);

const Model = mongoose.model('Model', modelSchema);
module.exports = Model;
