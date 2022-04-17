const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const CryptoJs = require("crypto-js");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
    },
    bio: {
      type: String,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    address: {
      type: String,
      required :false
    },
    role: {
      type: String,
      default: `user`,
      validate(value) {
        if ([`user`, `admin`].indexOf(value) < 0) {
          throw new Error("invalid role");
        }
      },
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: Buffer,
    },
    points: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "active",
      validate(value) {
        if ([`active`, `inactive`].indexOf(value) < 0) {
          throw new Error("invalid status");
        }
      },
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },

    mnemonic: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "buyerId",
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  if (this.status === false) {
    throw new Error("Please get your account activated.");
  } else {
    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET
    );
    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
  }
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }

  return user;
};

// Hash the plain text password before saving
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("mnemonic")) {
    user.mnemonic = CryptoJs.HmacSHA1(user.mnemonic, "CactusWorld");
  }

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});


// Delete users orders when user is removed
userSchema.pre("remove", async function (next) {
  const user = this;
  await Order.deleteMany({ buyer: user._id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
