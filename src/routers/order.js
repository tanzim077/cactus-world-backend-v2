const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const Order = require("../models/order");
const auth = require("../middleware/auth");
const router = new express.Router();

// create an order
router.post("/orders", auth, async (req, res) => {
  const order = new Order({
    ...req.body,
    buyer: req.user._id,
  });
  try {
    await order.save();
    res.status(201).send(order);
  } catch (e) {
    res.status(400).send(e);
  }
});

//Update an orders by id
router.patch("/orders/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["orderStatus", "shippingAddress"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send();
    }
    updates.forEach((update) => (order[update] = req.body[update]));
    await order.save();
    res.send(order);
  } catch (e) {
    res.status(400).send(e);
  }
});

//update payment status of an order 
router.patch("/orders/:id/payment", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["paymentStatus"];
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" });
    }
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
        return res.status(404).send();
        }
        updates.forEach((update) => (order[update] = req.body[update]));
        await order.save();
        res.send(order);
    } catch (e) {
        res.status(400).send(e);
    }
});
    