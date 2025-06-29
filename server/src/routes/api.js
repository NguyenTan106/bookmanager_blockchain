const express = require("express");
const router = express.Router();
const { searchBooks } = require("../controllers/searchController");
const { getTotalBooks } = require("../controllers/bookController");
const { uploadPDF, uploadImage } = require("../controllers/ipfsUpload");
const {
  addCategory,
  getCategories,
  deleteCategory,
} = require("../controllers/categoryController");
const searchBooksService = router.post("/search", searchBooks);
const uploadPDFService = router.post("/upload/pdf", uploadPDF);
const uploadImageService = router.post("/upload/image", uploadImage);
const addCategoryService = router.post("/categories/add", addCategory);
const getCategoriesService = router.get("/categories", getCategories);
const deleteCategoryService = router.delete(
  "/categories/delete/:id",
  deleteCategory
);
const getAllBooksService = router.get("/books", getTotalBooks);
module.exports = {
  searchBooksService,
  uploadPDFService,
  uploadImageService,
  addCategoryService,
  getCategoriesService,
  deleteCategoryService,
  getAllBooksService,
};
