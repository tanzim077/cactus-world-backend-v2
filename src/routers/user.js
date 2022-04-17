const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const auth = require("../middleware/auth");
const router = new express.Router();
// const { sendMail } = require("../emails/mailsender");

/**
 * @api {post} /users Create a new user
 */
router.post("/users", async (req, res) => {
  const allowedInfo = ["name", "email", "password"];
  const isValid = Object.keys(req.body).every((key) =>
    allowedInfo.includes(key)
  );
  //   if (!isValid) return res.status(400).send("Invalid request");
  if (isValid) {
    req.body.role = "user";
    const user = new User(req.body);

    //!! Email activation  part will be added here later
    try {
      //   let status = await sendMail({
      //     receiver: user.email,
      //     subject: "Thanks for joining Cactus World!",
      //     type: "text",
      //     body: `Welcome to the Cactus World, ${user.name}. Please wait till approval.`,
      //   });

      //   if (status) {
      await user.save();
      res.status(201).send({ user });
      //   } else {
      // res.status(400).send({ error: "Invalid Email, please try again" });
      //   }
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  } else {
    res.status(400).send({ error: "Invalid request" });
  }
});

/**
 * @api {post} /users/login Login a user
 */
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * @api {post} /users/logout Logout a user
 */
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

/**
 * @api {post} /users/logoutAll Logout all users
 */
router.post("/users/logoutall", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

/**
 * @api {get} /users/me Get user info
 */
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

/**
 * @api {get} /users get all users
 */
router.get("/users", auth, async (req, res) => {
  const match = {};
  const sort = {};
  const pattern = "";
  if (req.query.active) {
    match.active = req.query.active;
  }
  if (req.query.role) {
    match.role = req.query.role;
  }
  if (req.query.rating) {
    match.rating = req.query.rating;
  }
  if (req.query.ratingCount) {
    match.ratingCount = req.query.ratingCount;
  }
  if (req.query.points) {
    match.points = req.query.points;
  }
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }
  if (req.user.role == `admin`) {
    try {
      let users = await User.find(match, null, {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      }).exec();
      res.send(users);
    } catch (e) {
      res.status(500).send();
    }
  } else {
    res.status(401).send();
  }
});

/**
 * @api {get} /users/:id get user by id
 * @apiParam {String} id user id
 */
router.get("/users/:id", auth, async (req, res) => {
  try {
    let user = await User.findById(req.params.id).exec();
    user = user.toObject();
    const hiddenField = [
      "dob",
      "theme",
      "tokens",
      "password",
      "updatedAt",
      "mnemonic",
    ];
    hiddenField.forEach((element) => {
      delete user[element];
    });
    res.send(user);
  } catch (error) {
    res.status(500).send();
  }
});

/**
 * @api {patch} /users/:id update current logged in user
 */
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "name",
    "email",
    "password",
    "dob",
    "avatar",
    "mnemonic",
    "phone",
    "bio",
    "address",
    "cart",
    "status",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * @api {patch} /users/:id update user by id
 * @apiParam {String} id user id
 */
router.patch("/users/:id", auth, async (req, res) => {
  if (req.user.role === "admin") {
    const targetUser = await User.findOne({ _id: req.params.id });
    console.log(targetUser);
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      "role",
      "active",
      "isVerified",
      "status",
      "comments",
      "points",
    ];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
      return res.status(400).send({ error: "Invalid updates!" });
    }

    try {
      updates.forEach((update) => (targetUser[update] = req.body[update]));
      await targetUser.save();
      res.send(targetUser);
    } catch (e) {
      res.status(400).send(e);
    }
  } else {
    res.status(400).send(`You don't have permission to access this page`);
  }
});

/**
 * @api {delete} /users/:id delete user by id
 * @apiParam {String} id user id
 * @apiParam {String} action user action (delete or deactivate)
 */
router.delete("/users/:id/:action", auth, async (req, res) => {
  if (req.user.role !== `admin`) {
    res.status(401).send();
  } else {
    try {
      const targetUser = await User.findOne({ _id: req.params.id });
      if (req.params.action === "inactive") {
        targetUser.status = "inactive";
        await targetUser.save();
        res.send(targetUser);
      } else if (req.params.action === "active") {
        targetUser.status = "active";
        await targetUser.save();
        res.send(targetUser);
      } else if (req.params.action === "delete") {
        await targetUser.remove();
        res.send(targetUser);
      } else {
        res.status(401).send({ error: "Unknown Action" });
      }
    } catch (e) {
      res.status(500).send();
    }
  }
});

/**
 * @api {post} /users/:id activate or deactivate a user
 */
router.patch(`/users/activate/:id`, auth, async (req, res) => {
  if (req.user.role != `admin`) {
    res.status(401).send();
  } else {
    try {
      await User.findOneAndUpdate({ _id: req.params.id }, { status: "active" });
      res.send();
    } catch (e) {
      res.status(500).send();
    }
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});

router.post(
  "/user/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.set("Content-Type", "image/png");
    res.send(req.user.avatar);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/user/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get("/user/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

router.get("/user/:id/profile", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new Error();
    }
    // res.set('Content-Type', 'image/png')
    res.send({
      name: user.name,
      address: user.address,
      points: user.points,
      rating: user.rating,
      avatar: user.avatar,
    });
  } catch (e) {
    res.status(404).send();
  }
});

router.get("/user/:id/mnemonic", auth, async (req, res) => {
  try {
    if (req.user.role != "admin") {
      return res.status(401).send();
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(500).send();
    }
    res.send({ userName: user.name, mnemonic: user.mnemonic });
  } catch {
    res.status(404).send();
  }
});

module.exports = router;
