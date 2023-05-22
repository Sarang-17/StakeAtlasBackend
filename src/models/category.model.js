const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than of 50 characters'],
    },
    sub_categories: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Category',
    },
    is_subcategory: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: [true, 'please add a description'],
      trim: true,
      maxlength: [500, 'Description cannot be more than of 500 characters'],
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;
