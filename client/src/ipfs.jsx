import axios from "axios";

// For Vite:
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT; // Thay bằng token thật

// DÙNG CHUNG CHO PDF & ẢNH
export async function uploadToIPFS(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: PINATA_JWT,
        },
      }
    );

    const ipfsHash = res.data.IpfsHash;
    console.log("📤 Uploaded to IPFS:", ipfsHash);
    return ipfsHash;
  } catch (err) {
    console.error("❌ Lỗi khi upload IPFS:", err);
    throw err;
  }
}

// Giữ lại phần đổi tên file
function sanitizeFileName(filename) {
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
}

// 📄 Upload PDF
export async function uploadPDF(file) {
  const cleanName = sanitizeFileName(file.name);
  const blob = new Blob([file], { type: file.type || "application/pdf" });
  const sanitizedFile = new File([blob], cleanName, { type: file.type });

  const ipfsHash = await uploadToIPFS(sanitizedFile);
  return ipfsHash;
}

// 🖼️ Upload ảnh bìa
export async function uploadImage(file) {
  const cleanName = sanitizeFileName(file.name);
  const blob = new Blob([file], { type: file.type || "image/jpeg" });
  const sanitizedFile = new File([blob], cleanName, { type: file.type });

  const ipfsHash = await uploadToIPFS(sanitizedFile);
  return ipfsHash;
}
