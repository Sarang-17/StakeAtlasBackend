const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema(
  {
    storage: [String],
    colors: [String],
    ram: [String],
    gpu: [String],
    trim: [String],
    fuel: [String],
    transmission: [String],
    purchase_proof: [String],
    model: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Model',
    },
  },
  {
    timestamps: true,
  }
);

const Specification = mongoose.model('Specification', specificationSchema);
module.exports = Specification;
