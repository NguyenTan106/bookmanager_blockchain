const { ethers } = require("ethers");
const BookCategory = require("../../../client/src/build/contracts/BookCategory.json"); // đường dẫn tới file ABI

// Tải biến môi trường từ .env (nếu bạn dùng dotenv)
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// 👇 Đây là private key của tài khoản admin (KHÔNG dùng ví thật trên mạng chính!)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  process.env.CONTRACT_BOOKCATEGORY_ADDRESS, // địa chỉ contract đã deploy
  BookCategory.abi, // ABI của contract
  provider // Dùng provider cho gọi đọc (view)
);

module.exports = { contract, signer };
