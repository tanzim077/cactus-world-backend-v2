const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
    ],
    paymentStatus: {
        type: String,
        required: true,
        trim: true,
    },
    orderStatus: {
        type: String,
        required: true,
        trim: true,
    },
    shippingAddress: {
        type: String,
        required: true,
        trim: true,
    },
    totalPrice: {
        type: Number,
        required: true,
        trim: true,
    },
    discountedPrice: {
        type: Number,
        trim: true,
    },

});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
