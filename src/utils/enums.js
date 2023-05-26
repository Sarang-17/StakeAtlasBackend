const ADDRESS_TYPE = {
  BUYER_ADDRESS: 'buyer_address',
  STORE_ADDRESS: 'store_address',
  SELLER_ADDRESS: 'seller_address',
  PRODUCT_ADDRESS: 'product_address',
};

const USER_ROLE = {
  SELLER: 'seller',
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  USER: 'user',
};

const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUND_INITIATED: 'refund_initiated',
  REFUNDED: 'refunded',
  UNPAID: 'unpaid',
  CANCELLED: 'cancelled',
};

const SELLER_REQUEST = {
  CREATED: 'created',
  NOT_CREATED: 'not_created',
};

const DISTANCE_UNIT = {
  KM: 'km',
  KILOMETER: 'kilometer',
  MILES: 'miles',
  MI: 'mi',
};

const PRODUCT_STATUS = {
  WAITING_FOR_APPROVAL: 'waiting_for_approval',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  SOLD: 'sold',
};

const PRODUCT_CONDITION = {
  NEW: 'new',
  USED: 'used',
  FOR_PARTS: 'for_parts',
};

const PAYMENT_GATEWAY = {
  CASHFREE: 'cashfree',
};

module.exports = {
  ADDRESS_TYPE,
  USER_ROLE,
  SELLER_REQUEST,
  DISTANCE_UNIT,
  PRODUCT_STATUS,
  PRODUCT_CONDITION,
  PAYMENT_GATEWAY,
  ORDER_STATUS,
};
