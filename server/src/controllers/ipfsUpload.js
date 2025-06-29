const {
  sanitizeFileName,
  uploadToIPFS,
} = require("../services/ipfsUploadService.js");
const fs = require("fs");
const path = require("path");

// 📄 Upload PDF
const uploadPDF = async (req, res) => {
  try {
    const file = req.file;
    const cleanName = sanitizeFileName(file.originalname);

    if (!file.mimetype.includes("pdf")) {
      return res.status(400).json({ error: "File phải là PDF" });
    }

    const ipfsHash = await uploadToIPFS(file.path, cleanName);
    fs.unlinkSync(file.path);

    res.json({ ipfsHash });
  } catch (err) {
    console.error("❌ Upload PDF lỗi:", err.message);
    res.status(500).json({ error: "Upload PDF thất bại" });
  }
};

// 🖼️ Upload ảnh bìa
const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    // console.log("File:", file);
    const cleanName = sanitizeFileName(file.originalname);

    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "File phải là ảnh" });
    }

    const ipfsHash = await uploadToIPFS(file.path, cleanName);
    fs.unlinkSync(file.path);

    res.json({ ipfsHash });
  } catch (err) {
    // console.error("❌ Upload ảnh lỗi:", err.message);
    res.status(500).json({ error: "Upload ảnh thất bại" });
  }
};

module.exports = { uploadPDF, uploadImage };
