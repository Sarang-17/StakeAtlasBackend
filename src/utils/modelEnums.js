const {
  Address,
  Brand,
  Cart,
  Coupon,
  Category,
  Dispute,
  MakeOffer,
  Model,
  Otp,
  Product,
  Qna,
  Review,
  Order,
  Specification,
  User,
  Wishlist,
} = require('../models');

const DB_MODELS = {
  address: Address,
  brand: Brand,
  cart: Cart,
  coupon: Coupon,
  category: Category,
  dispute: Dispute,
  makeoffer: MakeOffer,
  model: Model,
  otp: Otp,
  product: Product,
  qna: Qna,
  review: Review,
  order: Order,
  specification: Specification,
  user: User,
  wishlist: Wishlist,
};

module.exports = { DB_MODELS };
