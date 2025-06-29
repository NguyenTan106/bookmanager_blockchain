import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function uploadImageToBackend(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${BASE_URL}/ipfs/upload/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.ipfsHash;
}

export async function uploadPDFToBackend(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${BASE_URL}/ipfs/upload/pdf`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.ipfsHash;
}
