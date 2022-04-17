require("dotenv").config();
const express = require("express");
require("./db/mongoose");
const UserRouter = require("./routers/user");
const ProductRouter = require("./routers/product");
let cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(UserRouter);
app.use(ProductRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
