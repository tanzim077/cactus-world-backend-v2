const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  image: [
    {
      type: Buffer,
    },
  ],
  description: {
    type: String,
    required: true,
    trim: true,
  },
  originalPrice: {
    type: Number,
    required: true,
    trim: true,
  },
  discountedPrice: {
    type: Number,
    trim: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      comment: {
        type: String,
        required: true,
        trim: true,
      },
      commentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      commentedOn: {
        type: Date,
      },
      lastUpdatedAt: {
        type: Date,
      },
    },
    ],
    discountEndedDate: {
        type: Date,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    itemsInStock: {
        type: Number,
        default: 0,
    },
    itemsSold: {
        type: Number,
        default: 0,
    },
    isVerified: {
        type: Boolean,
        default: true,
    },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
