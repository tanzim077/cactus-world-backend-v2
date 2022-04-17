const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
      active: true,
    });
    if (user) {
      req.token = token;
      req.user = user;
      next();
    } else {
      throw new Error();
    }
  } catch {
      res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;