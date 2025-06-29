const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
  searchBooksService,
  uploadPDFService,
  uploadImageService,
  addCategoryService,
  getCategoriesService,
  deleteCategoryService,
  getAllBooksService,
} = require("./routes/api");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(bodyParser.json());

app.use("/", searchBooksService);
app.use("/ipfs", upload.single("file"), uploadPDFService);
app.use("/ipfs", upload.single("file"), uploadImageService);
app.use("/", addCategoryService);
app.use("/", getCategoriesService);
app.use("/", deleteCategoryService);
app.use("/", getAllBooksService);

app.listen(PORT, () => {
  console.log(`TF-IDF backend running at http://localhost:${PORT}`);
});
