// Giữ lại phần đổi tên file
const axios = require("axios");
require("dotenv").config();
const FormData = require("form-data");
const fs = require("fs");

const PINATA_JWT = process.env.PINATA_JWT; // Thay bằng token thật

const sanitizeFileName = (filename) => {
  const maxBaseLength = 100;
  const ext = filename.split(".").pop();
  const base = filename.substring(0, filename.lastIndexOf(".")) || filename;

  const safeBase = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, maxBaseLength);

  const timestamp = Date.now();

  return `${safeBase || "file"}-${timestamp}.${ext}`;
};

// DÙNG CHUNG CHO PDF & ẢNH
const uploadToIPFS = async (filepath, filename) => {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filepath), filename);

  try {
    const res = await axios.post(
      process.env.PINATA_API_URL ||
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: "Infinity",
        headers: {
          ...formData.getHeaders(), // ⬅️ Bắt buộc, để axios biết boundary
          Authorization: PINATA_JWT,
        },
      }
    );

    const ipfsHash = res.data.IpfsHash;
    console.log("📤 Uploaded to IPFS:", ipfsHash);
    return ipfsHash;
  } catch (err) {
    console.error("❌ Lỗi khi upload IPFS:", err.response?.data || err.message);
    throw err;
  }
};

module.exports = { uploadToIPFS, sanitizeFileName };
