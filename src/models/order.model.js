const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../utils/enums');

// TODO: Will have another payment_info model which will be referenced to order model

const orderSchema = new mongoose.Schema(
  {
    payment_gateway_order_id: String,
    payment_gateway: String,
    order_items: [
      {
        qty: Number,
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    shipping: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    items_price: Number,
    tax_price: Number,
    shipping_price: Number,
    amount: Number,
    status: {
      type: String,
      default: ORDER_STATUS.UNPAID,
      enum: [
        ORDER_STATUS.PENDING,
        ORDER_STATUS.PAID,
        ORDER_STATUS.REFUND_INITIATED,
        ORDER_STATUS.REFUNDED,
        ORDER_STATUS.UNPAID,
        ORDER_STATUS.CANCELLED,
      ],
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paid_at: Date,
    is_delivered: {
      type: Boolean,
      default: false,
    },
    delivered_at: Date,
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
