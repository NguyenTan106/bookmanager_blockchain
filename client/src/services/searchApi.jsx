import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function searchBooks(query, account) {
  const res = await axios.post(`${BASE_URL}/search`, {
    query: query,
    userAddress: account,
  });
  // console.log("DATA:", res.data);
  return res.data;
}

export async function classifyBooks(query, account) {
  const res = await axios.post(`${BASE_URL}/classify`, {
    query: query,
    userAddress: account,
  });
  // console.log("DATA:", res.data);
  return res.data;
}
