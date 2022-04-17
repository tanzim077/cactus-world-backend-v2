const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const Product = require("../models/product");
const auth = require("../middleware/auth");
const router = new express.Router();

// get all products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.send(products);
  } catch (e) {
    res.status(500).send();
  }
});

//get a single product
router.get("/products/:id",  async (req, res) => {
  const _id = req.params.id;
  try {
    const product = await Product.findById(_id);
    if (!product) {
      return res.status(404).send();
    }
    res.send(product);
  } catch (e) {
    res.status(500).send();
  }
});

//create a product
router.post("/products", auth, async (req, res) => {
  const product = new Product({
    ...req.body,
  });
  try {
    await product.save();
    res.status(201).send(product);
  } catch (e) {
    res.status(400).send(e);
  }
});

//update a single product
router.patch("/products/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "name",
    "category",
    "image",
    "description",
    "originalPrice",
    "discountedPrice",
    "rating",
    "ratingCount",
    "comments",
    "discountEndedDate",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send();
    }
    updates.forEach((update) => (product[update] = req.body[update]));
    await product.save();
    res.send(product);
  } catch (e) {
    res.status(400).send(e);
  }
});

//delete a single product
router.delete("/products/:id", auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).send();
    }
    res.send(product);
  } catch (e) {
    res.status(500).send();
  }
});

//Delete all product based on same category
router.delete("/products/category/:category", auth, async (req, res) => {
  try {
    const product = await Product.deleteMany({ category: req.params.category });
    if (!product) {
      return res.status(404).send();
    }
    res.send(product);
  } catch (e) {
    res.status(500).send();
  }
});

// comment on single product
router.patch("/products/:id/comment", auth, async (req, res) => {
  const _id = req.params.id;
  const singleComment = {};
  singleComment.comment = req.body.comment;
  singleComment.commentedBy = req.user._id;
  singleComment.commentedOn = Date.now();
  try {
    const product = await Product.findById(_id);
    if (!product) {
      return res.status(404).send();
    }
    product.comments.push(singleComment);
    await product.save();
    res.send(product);
  } catch (e) {
    res.status(500).send();
  }
});

/**
 * @api {patch} /products/comments/:id/:commentId update a comment of a product by product id and comment id
 * @apiParam {String} id product id
 * @apiParam {String} commentId Comment id
 */
router.patch("/products/comments/:id/:commentId", auth, async (req, res) => {
  req.body.lastUpdatedAt = Date.now();
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "comment",
    "commentedBy",
    "commentedOn",
    "lastUpdatedAt",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }
  try {
    const product = await Product.findOne({ _id: req.params.id });
    if (!product) {
      return res.status(404).send();
    }
    const comment = product.comments.find(
      (c) => c._id.toString() === req.params.commentId
    );
    if (!comment) {
      return res.status(404).send();
    }
    if (comment.commentedBy.toString() === req.user.id) {
      updates.forEach((update) => (comment[update] = req.body[update]));
      await product.save();
      res.send(product);
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

//Delete a comment by its ID
/**
 * @api {delete} /products/comments/:id/:commentId delete a comment of a product by product id and comment id
 * @apiParam {String} id product id
 * @apiParam {String} commentId Comment id
 */
router.delete("/products/comments/:id/:commentId", auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id });
    if (!product) {
      return res.status(404).send();
    }
    const comment = product.comments.find(
      (c) => c._id.toString() === req.params.commentId
    );
    if (!comment) {
      return res.status(404).send();
    }
    if (
      req.user.role === `admin` ||
      comment.commentedBy.toString() === req.user.id
    ) {
      product.comments = product.comments.filter(
        (c) => c._id.toString() !== req.params.commentId
      );
      await product.save();
      res.send(product);
    } else {
      return res.status(401).send();
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

// give rating on a single product
router.patch("/products/:id/rating", auth, async (req, res) => {
  const _id = req.params.id;
  const rating = req.body.rating;
  try {
    const product = await Product.findById(_id);
    if (!product) {
      return res.status(404).send();
    }
    product.ratingCount++;
    product.rating =
      (product.rating * (product.ratingCount - 1) + rating) /
      product.ratingCount;
    await product.save();
    res.send(product);
  } catch (e) {
    res.status(500).send();
  }
});

// upload images for a products

//  delete images for a product


module.exports = router;
